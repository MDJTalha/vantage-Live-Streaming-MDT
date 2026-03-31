"""
Autonomous Brain — Main Orchestrator v2
Integrates: knowledge seeding, plugins, session manager,
multi-agent coordinator, observability, tool-augmented reasoning.
"""
from __future__ import annotations
import json
import time
from typing import Optional, Callable

import anthropic

from config import ANTHROPIC_API_KEY, DEFAULT_MODEL, MAX_TOKENS, DEFAULT_MODE
from models import (Session, Message, OperatingMode, LearnerProfile,
                    LearnerLevel, TaskResult)
from knowledge.graph import KnowledgeGraph
from knowledge.memory import VectorMemory
from knowledge.seeder import seed_knowledge_graph
from learning.engine import LearningEngine
from reasoning.engine import ReasoningEngine
from reasoning.augmented import AugmentedReasoningEngine
from teaching.engine import TeachingEngine
from execution.pipeline import ExecutionPipeline
from self_improvement.loop import SelfImprovementLoop
from tools import TOOL_REGISTRY
from modes.handlers import get_handler
from agents.coordinator import MultiAgentCoordinator
from utils.session_manager import SessionManager
from utils.observability import METRICS
from utils.logger import get_logger

log = get_logger("Brain")


class AutonomousBrain:
    """Autonomous Brain v2 — self-directed, continuously learning intelligence."""

    def __init__(self, seed: bool = True, load_plugins: bool = True):
        log.info("Initializing Autonomous Brain v2...")
        t0 = time.perf_counter()

        self.graph  = KnowledgeGraph()
        self.memory = VectorMemory()

        if seed:
            added = seed_knowledge_graph(self.graph)
            if added > 0:
                METRICS.nodes_added_total.inc(added)

        self.learning      = LearningEngine(self.graph, self.memory)
        self.reasoning     = ReasoningEngine(self.graph, self.memory)
        self.aug_reasoning = AugmentedReasoningEngine(self.graph, self.memory, TOOL_REGISTRY)
        self.teaching      = TeachingEngine()
        self.pipeline      = ExecutionPipeline(self.graph, self.memory)
        self.improvement   = SelfImprovementLoop(self.graph, self.memory)
        self.coordinator   = MultiAgentCoordinator()
        self.session_mgr   = SessionManager()
        self.client        = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
        self.session: Optional[Session] = None
        self.plugins = None

        if load_plugins:
            try:
                from plugins.plugin_system import PluginSystem, write_example_plugins
                write_example_plugins()
                self.plugins = PluginSystem(TOOL_REGISTRY)
                n = self.plugins.discover_and_load()
                extra = self.plugins.get_skill_seeds()
                if extra:
                    seed_knowledge_graph(self.graph, extra_seeds=extra, force=True)
                log.info(f"Plugins loaded: {n}")
            except Exception as e:
                log.warning(f"Plugin system: {e}")

        stats = self.graph.stats()
        METRICS.knowledge_nodes.set(stats["total_nodes"])
        METRICS.open_gaps.set(stats["open_gaps"])
        METRICS.memory_entries.set(len(self.memory._entries))

        elapsed = (time.perf_counter() - t0) * 1000
        log.info(f"Brain online in {elapsed:.0f}ms | nodes={stats['total_nodes']}")

    # ── Session Management ────────────────────────────────────────

    def start_session(self, mode: str = DEFAULT_MODE,
                      restore_latest: bool = False) -> Session:
        if restore_latest:
            existing = self.session_mgr.get_latest()
            if existing:
                self.session = existing
                METRICS.active_sessions.inc()
                return self.session
        self.session = self.session_mgr.create(mode=mode)
        METRICS.active_sessions.inc()
        return self.session

    def end_session(self) -> dict:
        if not self.session:
            return {}
        reflection = self.improvement.reflect(self.session)
        deep       = self.improvement.deep_reflect()
        summary    = (f"Mode:{self.session.mode.value} | "
                      f"Msgs:{len(self.session.messages)} | "
                      f"Tasks:{len(self.session.tasks_completed)}")
        self.session_mgr.end_session(self.session, summary=summary)
        METRICS.active_sessions.dec()
        METRICS.knowledge_nodes.set(self.graph.stats()["total_nodes"])
        METRICS.save()
        result = {
            "session_id":   self.session.id,
            "mode":         self.session.mode.value,
            "messages":     len(self.session.messages),
            "tasks":        len(self.session.tasks_completed),
            "learn_cycles": self.session.learn_cycles,
            "new_gaps":     len(reflection.gaps_identified),
            "strengths":    reflection.what_went_well[:3],
            "improvements": reflection.better_approaches[:3],
        }
        if deep:
            result["deep_analysis"] = deep.get("analysis", "")
        return result

    # ── Chat ──────────────────────────────────────────────────────

    def chat(self, user_input: str,
             progress_cb: Optional[Callable[[str, str], None]] = None,
             use_tools: bool = False) -> str:
        if not self.session:
            self.start_session()

        start = time.perf_counter()
        self.session.messages.append(Message(role="user", content=user_input))

        mode_handler    = get_handler(self.session.mode)
        processed_input = mode_handler.preprocess(user_input, self.session)

        intent   = self._detect_intent(processed_input)
        response = self._route(processed_input, intent, progress_cb, use_tools)
        response = mode_handler.postprocess(response, self.session)

        if self.plugins:
            response = self.plugins.apply_processors(response, stage="output")

        self.session.messages.append(Message(role="assistant", content=response))

        if intent.get("learn_from_this") and len(user_input) > 100:
            dom = intent.get("domain", "general")
            res = self.learning.learn(content=user_input, domain=dom,
                                       source="user_message",
                                       session_id=self.session.id)
            self.session.learn_cycles += 1
            METRICS.learn_cycles_total.inc()
            METRICS.nodes_added_total.inc(res.nodes_created)

        self.session_mgr.save_session(self.session)
        elapsed = (time.perf_counter() - start) * 1000
        METRICS.record_request(intent.get("domain", "general"),
                                self.session.mode.value, elapsed)
        return response

    # ── Multi-Agent Task ──────────────────────────────────────────

    def multi_agent_task(self, goal: str, strategy: str = "sequential",
                         progress_cb: Optional[Callable] = None) -> dict:
        start   = time.perf_counter()
        know_ctx = "\n".join(
            f"• {n.concept}: {n.description}"
            for n in self.graph.search(goal, top_k=5)
        )
        context = f"Knowledge base:\n{know_ctx}" if know_ctx else ""
        if strategy == "parallel":
            result = self.coordinator.run_parallel_then_synthesize(
                task=goal, progress_cb=progress_cb, context=context)
        else:
            result = self.coordinator.run_sequential(
                task=goal, progress_cb=progress_cb, context=context)
        METRICS.record_task((time.perf_counter() - start) * 1000, 0.85)
        if self.session:
            self.session.tasks_completed.append(f"ma_{goal[:20]}")
        return result

    # ── Intent & Routing ──────────────────────────────────────────

    def _detect_intent(self, text: str) -> dict:
        prompt = f"""Classify for routing. Message: "{text[:400]}"
Return ONLY JSON:
{{"intent":"task|teach|research|learn|chat|curriculum|status|multi_agent",
"domain":"software_engineering|artificial_intelligence|research|systems_infrastructure|product_process_design|cybersecurity|general",
"complexity":"low|medium|high|very_high",
"operating_mode":"autonomous|collaborative|advisory|educational|research|creative",
"reasoning_depth":"quick|standard|deep",
"learn_from_this":true|false,
"teaching_mode":"lecture|workshop|mentorship|code_review|debugging|socratic",
"is_task":true|false,
"is_teaching_request":true|false,
"needs_tools":true|false,
"needs_multi_agent":true|false}}"""
        try:
            resp = self.client.messages.create(
                model=DEFAULT_MODEL, max_tokens=350,
                messages=[{"role": "user", "content": prompt}])
            raw = resp.content[0].text.strip()
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            return json.loads(raw)
        except Exception:
            return {"intent": "chat", "domain": "general", "complexity": "medium",
                    "operating_mode": self.session.mode.value if self.session else DEFAULT_MODE,
                    "reasoning_depth": "standard", "learn_from_this": False,
                    "is_task": False, "is_teaching_request": False,
                    "needs_tools": False, "needs_multi_agent": False}

    def _route(self, user_input: str, intent: dict,
               progress_cb, use_tools: bool) -> str:
        mode  = OperatingMode(intent.get("operating_mode", DEFAULT_MODE))
        depth = intent.get("reasoning_depth", "standard")
        dom   = intent.get("domain", "general")

        if intent.get("intent") == "status":
            return self._status_report()

        if intent.get("needs_multi_agent") or intent.get("complexity") == "very_high":
            if progress_cb:
                progress_cb("multi_agent", "Dispatching to multi-agent coordinator...")
            res = self.multi_agent_task(user_input, "parallel", progress_cb)
            return res.get("final_output", "Multi-agent task completed.")

        if any(k in user_input.lower() for k in ("curriculum", "learning path", "study plan")):
            return self._format_curriculum(
                self.teaching.build_curriculum(user_input, LearnerLevel.INTERMEDIATE, dom))

        if intent.get("is_task") and intent.get("complexity") in ("high", "medium"):
            result = self.pipeline.run(
                goal=user_input, mode=mode,
                progress_cb=progress_cb,
                session_id=self.session.id if self.session else "")
            if self.session:
                self.session.tasks_completed.append(result.task_id)
            METRICS.record_task(0, result.quality_score)
            return result.final_output or "Task completed."

        if intent.get("is_teaching_request") or intent.get("intent") == "teach":
            profile = self._get_or_create_learner_profile(user_input, dom)
            history = [{"role": m.role, "content": m.content}
                       for m in (self.session.messages[-10:] if self.session else [])]
            return self.teaching.teach(
                topic=user_input, domain=dom, profile=profile,
                teaching_mode=intent.get("teaching_mode", "lecture"),
                conversation_history=history)

        if use_tools or intent.get("needs_tools"):
            result = self.aug_reasoning.reason_with_tools(user_input, dom)
            return result.final_answer

        if intent.get("intent") == "research" or depth == "deep":
            result = self.reasoning.reason(user_input, dom, depth="deep")
            return self._format_reasoning(result)

        result = self.reasoning.reason(user_input, dom, depth=depth)
        return result.final_answer

    # ── Direct Access ─────────────────────────────────────────────

    def learn_from(self, content: str, domain: str, source: str = "manual"):
        if not self.session:
            self.start_session()
        start  = time.perf_counter()
        result = self.learning.learn(content=content, domain=domain,
                                      source=source, session_id=self.session.id)
        elapsed = (time.perf_counter() - start) * 1000
        self.session.learn_cycles += 1
        METRICS.record_learn_cycle(domain, result.nodes_created, elapsed)
        METRICS.knowledge_nodes.set(self.graph.stats()["total_nodes"])
        return result

    def set_mode(self, mode: str):
        if self.session:
            self.session.mode = OperatingMode(mode)
            log.info(f"Mode: {mode}")

    def get_knowledge_stats(self) -> dict:
        return self.graph.stats()

    def search_knowledge(self, query: str, domain: str = None) -> list:
        return self.graph.search(query, domain=domain, top_k=5)

    def get_metrics(self) -> dict:
        return METRICS.snapshot()

    def health_check(self) -> dict:
        return METRICS.health_check()

    def get_session_history(self, limit: int = 20) -> list:
        return self.session_mgr.list_sessions(limit=limit)

    def search_session_history(self, query: str) -> list:
        return self.session_mgr.search_history(query)

    def get_analytics(self) -> dict:
        return self.session_mgr.analytics()

    # ── Formatters ────────────────────────────────────────────────

    def _status_report(self) -> str:
        stats     = self.graph.stats()
        health    = METRICS.health_check()
        analytics = self.session_mgr.analytics()
        gaps      = self.graph.get_open_gaps()[:3]
        lines = [
            "## Autonomous Brain — Status",
            f"**Health:** {health['status']} | Errors: {health['error_rate']:.1%}",
            f"**Knowledge:** {stats['total_nodes']} nodes | {stats['total_edges']} edges | {stats['open_gaps']} gaps",
            f"**Sessions:** {analytics['total_sessions']} total | {analytics['total_messages']} messages",
            "\n**Priority gaps:**",
        ]
        for g in gaps:
            lines.append(f"  - [{g.priority.upper()}] {g.domain}/{g.topic}")
        if not gaps:
            lines.append("  - No open gaps!")
        lines.append("\n**Domain confidence:**")
        for d, c in stats.get("avg_confidence_per_domain", {}).items():
            bar = "█" * int(c * 15) + "░" * (15 - int(c * 15))
            lines.append(f"  `{d:<30}` {bar} {c:.2f}")
        return "\n".join(lines)

    def _format_reasoning(self, result) -> str:
        parts = []
        if result.chain_of_thought:
            parts.append("**Reasoning:**")
            for s in result.chain_of_thought[:3]:
                parts.append(f"{s.step_number}. {s.thought} → _{s.inference}_")
        rec = next((p for p in result.perspectives if p.recommended), None)
        if rec:
            parts.append(f"\n**Best approach:** {rec.approach} — {rec.description}")
        if result.adversarial_challenges:
            parts.append("\n**Challenges:**")
            for ch in result.adversarial_challenges[:2]:
                parts.append(f"• {ch}")
        parts.append(f"\n**Answer** _{result.confidence.value}_:\n{result.final_answer}")
        return "\n".join(parts)

    def _format_curriculum(self, curriculum) -> str:
        if not curriculum.modules:
            return "Could not generate curriculum. Be more specific about the topic."
        lines = [f"# Curriculum: {curriculum.topic}",
                 f"*{curriculum.target_level.value} | {curriculum.total_estimated_time}*\n"]
        for m in curriculum.modules:
            lines.append(f"## Module {m.order}: {m.title}")
            lines.append(f"**Objective:** {m.objective}")
            lines.append(f"**Difficulty:** {m.difficulty} | **Time:** {m.estimated_time}")
            if m.prerequisites:
                lines.append(f"**Prerequisites:** {', '.join(m.prerequisites)}")
            lines.append(f"**Concepts:** {', '.join(m.concepts)}")
            if m.exercises:
                lines.append("**Exercises:**")
                for ex in m.exercises:
                    lines.append(f"  - {ex}")
            lines.append("")
        return "\n".join(lines)

    def _get_or_create_learner_profile(self, message: str, domain: str) -> LearnerProfile:
        if self.session and self.session.learner_profile:
            return self.teaching.assess_learner(
                message, domain, self.session.learner_profile, self.session.id)
        sid     = self.session.id if self.session else "anon"
        profile = LearnerProfile(session_id=sid)
        profile = self.teaching.assess_learner(message, domain, profile, sid)
        if self.session:
            self.session.learner_profile = profile
        return profile
