"""
Autonomous Brain — Multi-Agent Coordinator
Orchestrates multiple specialized AB sub-agents working in parallel
on different aspects of a complex task.

Architecture:
  Coordinator ──► [Researcher Agent]    (gathers information)
               ──► [Architect Agent]    (designs solutions)
               ──► [Coder Agent]        (implements code)
               ──► [Reviewer Agent]     (validates quality)
               ──► [Synthesizer Agent]  (merges all outputs)

Each agent is a focused LLM call with a specialized system prompt.
Agents share a common context but work on distinct subtasks.
Results are collected and synthesized by the coordinator.
"""
from __future__ import annotations
import json
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field
from typing import Optional, Callable

import anthropic

from config import ANTHROPIC_API_KEY, DEFAULT_MODEL, MAX_TOKENS
from utils.logger import get_logger

log = get_logger("MultiAgent")


# ══════════════════════════════════════════════════════════════════
# AGENT DEFINITIONS
# ══════════════════════════════════════════════════════════════════

@dataclass
class AgentSpec:
    name: str
    role: str
    system_prompt: str
    max_tokens: int = 2000
    temperature: float = 0.7


@dataclass
class AgentResult:
    agent_name: str
    role: str
    output: str
    tokens_used: int = 0
    elapsed_ms: float = 0.0
    error: Optional[str] = None
    success: bool = True


BUILT_IN_AGENTS: list[AgentSpec] = [
    AgentSpec(
        name="researcher",
        role="Research & Information Gathering",
        system_prompt="""You are a Research Agent in a multi-agent AI system.
Your job: gather all relevant information, context, and background for the task.
- Identify key concepts, constraints, and requirements
- Surface relevant prior art, patterns, and best practices
- List unknowns and assumptions
- Be thorough but concise — your output feeds other agents
Output a structured research report.""",
        max_tokens=1500,
    ),
    AgentSpec(
        name="architect",
        role="Solution Architecture & Design",
        system_prompt="""You are an Architecture Agent in a multi-agent AI system.
Your job: design the solution structure and approach.
- Propose 2-3 concrete architectures or approaches
- Evaluate trade-offs for each
- Recommend the best approach with clear rationale
- Specify components, interfaces, and data flows
- Note risks and mitigation strategies
Output a clear architectural recommendation.""",
        max_tokens=1800,
    ),
    AgentSpec(
        name="implementer",
        role="Implementation & Coding",
        system_prompt="""You are an Implementation Agent in a multi-agent AI system.
Your job: produce the actual code, configuration, or artifact.
- Write complete, working, production-quality code
- Include error handling and edge cases
- Add meaningful comments for complex logic
- Follow language idioms and best practices
- Make the implementation match the architecture
Output complete, runnable code.""",
        max_tokens=MAX_TOKENS,
    ),
    AgentSpec(
        name="reviewer",
        role="Quality Review & Validation",
        system_prompt="""You are a Review Agent in a multi-agent AI system.
Your job: critically evaluate the implementation for quality.
- Check correctness: does it solve the problem?
- Check security: any vulnerabilities?
- Check performance: any bottlenecks?
- Check maintainability: readable and well-structured?
- Check completeness: edge cases handled?
Output a structured review with specific issues and suggested fixes.""",
        max_tokens=1200,
    ),
    AgentSpec(
        name="synthesizer",
        role="Synthesis & Final Delivery",
        system_prompt="""You are a Synthesis Agent in a multi-agent AI system.
Your job: combine all agent outputs into a coherent final result.
- Integrate research, architecture, implementation, and review
- Apply review feedback to improve the implementation
- Produce a polished, complete final answer
- Include: solution overview, complete code/artifact, key decisions, next steps
Output the definitive, production-ready final result.""",
        max_tokens=MAX_TOKENS,
    ),
]


# ══════════════════════════════════════════════════════════════════
# COORDINATOR
# ══════════════════════════════════════════════════════════════════

class MultiAgentCoordinator:
    """
    Orchestrates specialized agents to solve complex tasks collaboratively.
    Supports sequential and parallel execution strategies.
    """

    def __init__(self, agents: list[AgentSpec] = None):
        self.agents = agents or BUILT_IN_AGENTS
        self.client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
        self._results: list[AgentResult] = []

    def run_sequential(self, task: str,
                       progress_cb: Optional[Callable[[str, str], None]] = None,
                       context: str = "") -> dict:
        """
        Run agents sequentially — each agent sees all previous outputs.
        Best for tasks where each phase depends on the previous.
        """
        log.info(f"[MULTI-AGENT] Sequential run | task={task[:60]}")
        self._results = []
        accumulated_context = context

        for agent in self.agents:
            if progress_cb:
                progress_cb("multi_agent", f"Agent [{agent.name}] — {agent.role}")

            result = self._run_agent(agent, task, accumulated_context)
            self._results.append(result)

            if result.success:
                accumulated_context += f"\n\n--- {agent.role} Output ---\n{result.output}"
            else:
                log.warning(f"Agent {agent.name} failed: {result.error}")

        return self._package_results(task)

    def run_parallel_then_synthesize(self, task: str,
                                      progress_cb: Optional[Callable] = None,
                                      context: str = "",
                                      parallel_agents: list[str] = None) -> dict:
        """
        Run specified agents in parallel, then synthesize results.
        Best for independent research/design tasks.
        """
        log.info(f"[MULTI-AGENT] Parallel run | task={task[:60]}")
        self._results = []

        # Determine which agents run in parallel
        parallel_names = parallel_agents or ["researcher", "architect"]
        parallel_specs = [a for a in self.agents if a.name in parallel_names]
        sequential_specs = [a for a in self.agents if a.name not in parallel_names]

        # Run parallel agents
        parallel_results: list[AgentResult] = []
        if progress_cb:
            progress_cb("multi_agent", f"Running {len(parallel_specs)} agents in parallel...")

        with ThreadPoolExecutor(max_workers=len(parallel_specs)) as executor:
            futures = {
                executor.submit(self._run_agent, agent, task, context): agent
                for agent in parallel_specs
            }
            for future in as_completed(futures):
                result = future.result()
                parallel_results.append(result)
                if progress_cb:
                    status = "✓" if result.success else "✗"
                    progress_cb("multi_agent", f"  {status} {result.agent_name} complete")

        self._results.extend(parallel_results)

        # Build combined context from parallel results
        parallel_context = context + "\n\n" + "\n\n".join(
            f"--- {r.role} Output ---\n{r.output}"
            for r in parallel_results if r.success
        )

        # Run remaining agents sequentially with combined context
        accumulated = parallel_context
        for agent in sequential_specs:
            if progress_cb:
                progress_cb("multi_agent", f"Agent [{agent.name}] — {agent.role}")
            result = self._run_agent(agent, task, accumulated)
            self._results.append(result)
            if result.success:
                accumulated += f"\n\n--- {agent.role} Output ---\n{result.output}"

        return self._package_results(task)

    def run_custom(self, task: str, agent_names: list[str],
                   strategy: str = "sequential",
                   context: str = "") -> dict:
        """Run a custom subset of agents."""
        selected = [a for a in self.agents if a.name in agent_names]
        if strategy == "parallel":
            return self.run_parallel_then_synthesize(
                task, context=context,
                parallel_agents=agent_names[:-1] if len(agent_names) > 1 else agent_names
            )
        else:
            # Temporarily replace agents list
            original = self.agents
            self.agents = selected
            result = self.run_sequential(task, context=context)
            self.agents = original
            return result

    def get_agent_results(self) -> list[AgentResult]:
        """Return individual agent results from the last run."""
        return self._results.copy()

    # ══════════════════════════════════════════════════════════════
    # INTERNAL
    # ══════════════════════════════════════════════════════════════

    def _run_agent(self, agent: AgentSpec, task: str,
                   context: str) -> AgentResult:
        """Run a single agent and return its result."""
        start = time.perf_counter()
        log.info(f"[AGENT:{agent.name}] Starting | task={task[:50]}")

        user_prompt = f"""TASK: {task}

ACCUMULATED CONTEXT:
{context[:4000] if context else 'None — this is the first agent.'}

Complete your role: {agent.role}"""

        try:
            resp = self.client.messages.create(
                model=DEFAULT_MODEL,
                max_tokens=agent.max_tokens,
                system=agent.system_prompt,
                messages=[{"role": "user", "content": user_prompt}],
            )
            output     = resp.content[0].text
            tokens     = resp.usage.input_tokens + resp.usage.output_tokens
            elapsed    = (time.perf_counter() - start) * 1000
            log.info(f"[AGENT:{agent.name}] Done in {elapsed:.0f}ms | {tokens} tokens")
            return AgentResult(
                agent_name=agent.name,
                role=agent.role,
                output=output,
                tokens_used=tokens,
                elapsed_ms=elapsed,
                success=True,
            )
        except Exception as e:
            log.error(f"[AGENT:{agent.name}] Failed: {e}")
            return AgentResult(
                agent_name=agent.name,
                role=agent.role,
                output="",
                error=str(e),
                success=False,
                elapsed_ms=(time.perf_counter() - start) * 1000,
            )

    def _package_results(self, task: str) -> dict:
        """Package all agent results into a structured report."""
        successful = [r for r in self._results if r.success]
        failed     = [r for r in self._results if not r.success]
        total_ms   = sum(r.elapsed_ms for r in self._results)
        total_tok  = sum(r.tokens_used for r in self._results)

        # Final output is from synthesizer, else last successful agent
        synthesizer = next((r for r in self._results if r.agent_name == "synthesizer"), None)
        final_output = synthesizer.output if synthesizer and synthesizer.success else (
            successful[-1].output if successful else "All agents failed."
        )

        return {
            "task": task,
            "final_output": final_output,
            "agents_run": len(self._results),
            "agents_succeeded": len(successful),
            "agents_failed": len(failed),
            "total_elapsed_ms": round(total_ms, 1),
            "total_tokens": total_tok,
            "per_agent": [
                {
                    "name": r.agent_name,
                    "role": r.role,
                    "success": r.success,
                    "output_preview": r.output[:200] if r.output else "",
                    "elapsed_ms": round(r.elapsed_ms, 1),
                    "tokens": r.tokens_used,
                    "error": r.error,
                }
                for r in self._results
            ],
        }
