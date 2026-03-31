"""
Autonomous Brain — Tool-Augmented Reasoning
Extends the base reasoning engine: the AB can call tools (web search,
code execution, file reads) mid-reasoning chain, then incorporate
results before producing its final answer.

This implements a lightweight ReAct loop:
  Thought → Action (tool call) → Observation → Thought → ... → Answer
"""
from __future__ import annotations
import json
import re
from typing import Optional

import anthropic

from config import ANTHROPIC_API_KEY, DEFAULT_MODEL
from models import ReasoningResult, ReasoningStep, ConfidenceLevel
from knowledge.graph import KnowledgeGraph
from knowledge.memory import VectorMemory
from tools.registry import ToolRegistry
from utils.logger import get_logger

log = get_logger("AugmentedReasoning")

MAX_REACT_STEPS = 8   # prevent infinite loops


class AugmentedReasoningEngine:
    """
    ReAct-style reasoning: Think → Act (tool) → Observe → Think → Answer.
    Falls back to pure reasoning when no tool fits.
    """

    TOOL_USE_PROMPT = """You are the reasoning engine of an Autonomous Brain with access to tools.

AVAILABLE TOOLS:
{tool_manifest}

PROBLEM: {problem}
DOMAIN: {domain}
CONTEXT: {context}

Reason step-by-step using this exact format:

Thought: [what you are thinking / what you need to know]
Action: [tool_name] | [JSON params]   ← use a tool, OR
Action: ANSWER                          ← when ready to give final answer

After each Observation (tool result), continue with another Thought.
When done reasoning, output:
Action: ANSWER
Final Answer: [your complete answer here]
Confidence: high|medium|low
"""

    def __init__(self, graph: KnowledgeGraph, memory: VectorMemory,
                 tool_registry: ToolRegistry):
        self.graph    = graph
        self.memory   = memory
        self.tools    = tool_registry
        self.client   = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
        self._trace: list[dict] = []

    # ══════════════════════════════════════════════════════════════
    # PUBLIC
    # ══════════════════════════════════════════════════════════════

    def reason_with_tools(self, problem: str, domain: str,
                          context: str = "") -> ReasoningResult:
        """Full ReAct loop — think, act, observe, repeat, answer."""
        log.info(f"[AUGMENTED] Starting ReAct loop | {problem[:60]}")
        self._trace = []

        # Build knowledge context
        know_ctx = self._knowledge_context(problem, domain)
        mem_ctx  = self._memory_context(problem, domain)
        full_ctx = "\n".join(filter(None, [context, know_ctx, mem_ctx]))

        prompt = self.TOOL_USE_PROMPT.format(
            tool_manifest=self.tools.describe_all(),
            problem=problem,
            domain=domain,
            context=full_ctx or "None",
        )

        conversation = prompt
        steps: list[ReasoningStep] = []
        final_answer = ""
        confidence   = ConfidenceLevel.MEDIUM

        for step_num in range(1, MAX_REACT_STEPS + 1):
            # Call LLM
            raw = self._call_llm(conversation)
            conversation += f"\n{raw}"

            # Parse thought + action
            thought = self._extract(raw, "Thought:")
            action  = self._extract(raw, "Action:")

            log.debug(f"[REACT step {step_num}] thought={thought[:60]} | action={action[:40]}")

            # Record step
            step = ReasoningStep(
                step_number=step_num,
                thought=thought,
                inference=action,
                confidence=0.75,
            )
            steps.append(step)
            self._trace.append({"step": step_num, "thought": thought, "action": action})

            # Check for terminal action
            if "ANSWER" in action.upper():
                final_answer = self._extract(raw, "Final Answer:")
                conf_raw     = self._extract(raw, "Confidence:").lower().strip()
                confidence   = self._parse_confidence(conf_raw)
                break

            # Parse and execute tool call
            tool_name, tool_params = self._parse_action(action)
            if tool_name:
                log.info(f"[REACT] Calling tool: {tool_name} | params={str(tool_params)[:80]}")
                observation = self.tools.call(tool_name, **tool_params)
                obs_text    = self._format_observation(observation)
                conversation += f"\nObservation: {obs_text}\n"
                self._trace[-1]["tool"] = tool_name
                self._trace[-1]["observation"] = obs_text[:200]
            else:
                # No valid tool found — push LLM to answer
                conversation += "\nObservation: [Tool not available. Continue reasoning with existing knowledge.]\n"

        if not final_answer:
            # Fallback: extract best answer from last LLM output
            final_answer = raw.split("Final Answer:")[-1].strip() if "Final Answer:" in raw else raw[:800]

        log.info(f"[AUGMENTED] Done in {len(steps)} steps | confidence={confidence.value}")
        return ReasoningResult(
            query=problem,
            chain_of_thought=steps,
            perspectives=[],
            adversarial_challenges=[f"Tool trace: {len(steps)} steps executed"],
            final_answer=final_answer,
            confidence=confidence,
        )

    def get_trace(self) -> list[dict]:
        """Return the reasoning trace from the last call."""
        return self._trace.copy()

    # ══════════════════════════════════════════════════════════════
    # HELPERS
    # ══════════════════════════════════════════════════════════════

    def _call_llm(self, prompt: str) -> str:
        try:
            resp = self.client.messages.create(
                model=DEFAULT_MODEL,
                max_tokens=1500,
                messages=[{"role": "user", "content": prompt}],
            )
            return resp.content[0].text
        except Exception as e:
            log.error(f"LLM call failed: {e}")
            return "Thought: Error occurred.\nAction: ANSWER\nFinal Answer: Unable to complete reasoning.\nConfidence: low"

    def _parse_action(self, action_line: str) -> tuple[str, dict]:
        """
        Parse: "tool_name | {json_params}"
        Returns (tool_name, params_dict) or ("", {}) if not parseable.
        """
        action_line = action_line.strip()
        if "|" not in action_line:
            return "", {}

        parts = action_line.split("|", 1)
        tool_name = parts[0].strip().lower().replace(" ", "_")

        # Verify tool exists
        if not self.tools.get(tool_name):
            # Try fuzzy match
            for spec in self.tools.list_tools():
                if tool_name in spec.name or spec.name in tool_name:
                    tool_name = spec.name
                    break
            else:
                return "", {}

        try:
            params = json.loads(parts[1].strip())
        except Exception:
            # Try extracting query string as fallback
            raw_param = parts[1].strip().strip('"\'{}')
            params = {"query": raw_param} if tool_name == "web_search" else \
                     {"code": raw_param} if tool_name == "execute_python" else {}

        return tool_name, params

    def _format_observation(self, result: any) -> str:
        """Format a tool result for inclusion in the conversation."""
        if isinstance(result, dict):
            if result.get("error"):
                return f"Error: {result['error']}"
            if "results" in result:  # web search
                items = result.get("results", [])[:3]
                return "\n".join(
                    f"• {r.get('title','')}: {r.get('snippet','')[:150]}"
                    for r in items
                ) or "No results found."
            if "stdout" in result:   # code execution
                out = result.get("stdout", "").strip()
                err = result.get("error", "")
                if err:
                    return f"Code error: {err[:200]}"
                return out[:500] or "(no output)"
            return json.dumps(result)[:400]
        return str(result)[:400]

    def _extract(self, text: str, prefix: str) -> str:
        """Extract text after a prefix on the same or next line."""
        for line in text.splitlines():
            if line.strip().startswith(prefix):
                return line[len(prefix):].strip()
        return ""

    def _parse_confidence(self, raw: str) -> ConfidenceLevel:
        if "high" in raw:
            return ConfidenceLevel.HIGH
        if "low" in raw:
            return ConfidenceLevel.LOW
        return ConfidenceLevel.MEDIUM

    def _knowledge_context(self, query: str, domain: str) -> str:
        nodes = self.graph.search(query, domain=domain, top_k=4)
        if not nodes:
            return ""
        return "Knowledge base context:\n" + "\n".join(
            f"• {n.concept}: {n.description}" for n in nodes
        )

    def _memory_context(self, query: str, domain: str) -> str:
        entries = self.memory.search(query, top_k=3, domain=domain)
        if not entries:
            return ""
        return "Relevant memory:\n" + "\n".join(
            f"• {e.summary}" for e in entries
        )
