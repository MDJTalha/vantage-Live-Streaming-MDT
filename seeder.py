"""
Autonomous Brain — Knowledge Seeder
Pre-populates the knowledge graph with high-confidence foundational
knowledge across all primary domains. Runs once on first startup.
Subsequent startups detect existing seeds and skip.
"""
from __future__ import annotations
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from knowledge.graph import KnowledgeGraph

from models import KnowledgeNode, KnowledgeEdge
from utils.logger import get_logger

log = get_logger("KnowledgeSeeder")

SEED_MARKER = "__seeded_v1__"   # sentinel concept to detect prior seeding

# ══════════════════════════════════════════════════════════════════
# SEED DATA
# ══════════════════════════════════════════════════════════════════

SEEDS: list[dict] = [

    # ── SOFTWARE ENGINEERING ──────────────────────────────────────
    {"concept": "SOLID Principles", "domain": "software_engineering",
     "description": "Five OOP design principles: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion.",
     "confidence": 0.97, "tags": ["design", "oop", "best_practices"]},

    {"concept": "REST API Design", "domain": "software_engineering",
     "description": "Architectural style using HTTP methods (GET/POST/PUT/DELETE), stateless requests, resource-based URLs, and standard status codes.",
     "confidence": 0.96, "tags": ["api", "http", "architecture"]},

    {"concept": "Microservices Architecture", "domain": "software_engineering",
     "description": "System design decomposing apps into small, independently deployable services communicating via APIs. Trade-off: resilience vs. operational complexity.",
     "confidence": 0.95, "tags": ["architecture", "distributed_systems", "scalability"]},

    {"concept": "CI/CD Pipeline", "domain": "software_engineering",
     "description": "Automated software delivery pipeline: code commit → build → test → deploy. Enables fast, reliable releases with automated quality gates.",
     "confidence": 0.95, "tags": ["devops", "automation", "deployment"]},

    {"concept": "Big O Notation", "domain": "software_engineering",
     "description": "Algorithm complexity notation. O(1)=constant, O(log n)=logarithmic, O(n)=linear, O(n²)=quadratic. Critical for performance analysis.",
     "confidence": 0.98, "tags": ["algorithms", "complexity", "performance"]},

    {"concept": "Database Indexing", "domain": "software_engineering",
     "description": "Data structure (B-tree, hash) that speeds up queries by maintaining sorted pointers to rows. Trade-off: read speed vs. write overhead and storage.",
     "confidence": 0.95, "tags": ["database", "performance", "optimization"]},

    {"concept": "Concurrency Patterns", "domain": "software_engineering",
     "description": "Patterns for managing concurrent execution: mutex/lock for shared state, producer-consumer, actor model, event loop (async/await).",
     "confidence": 0.93, "tags": ["concurrency", "threading", "async"]},

    {"concept": "Design Patterns", "domain": "software_engineering",
     "description": "Reusable solutions: Creational (Factory, Singleton, Builder), Structural (Adapter, Decorator, Proxy), Behavioral (Observer, Strategy, Command).",
     "confidence": 0.96, "tags": ["patterns", "oop", "architecture"]},

    {"concept": "Git Version Control", "domain": "software_engineering",
     "description": "Distributed VCS using a DAG of commits. Core operations: branch, merge, rebase, cherry-pick. Workflows: GitFlow, trunk-based development.",
     "confidence": 0.97, "tags": ["git", "vcs", "collaboration"]},

    {"concept": "Test-Driven Development", "domain": "software_engineering",
     "description": "Write failing test first, implement minimum code to pass, refactor. Red-Green-Refactor cycle. Produces testable, well-designed code.",
     "confidence": 0.94, "tags": ["testing", "methodology", "quality"]},

    # ── ARTIFICIAL INTELLIGENCE ───────────────────────────────────
    {"concept": "Transformer Architecture", "domain": "artificial_intelligence",
     "description": "Neural network using self-attention to process sequences in parallel. Consists of encoder/decoder stacks, multi-head attention, and feed-forward layers.",
     "confidence": 0.97, "tags": ["deep_learning", "nlp", "attention"]},

    {"concept": "Retrieval-Augmented Generation", "domain": "artificial_intelligence",
     "description": "Combines retrieval from a knowledge base with LLM generation. Reduces hallucinations by grounding responses in retrieved documents.",
     "confidence": 0.95, "tags": ["llm", "retrieval", "knowledge"]},

    {"concept": "Fine-tuning", "domain": "artificial_intelligence",
     "description": "Adapting a pretrained model on task-specific data. Full fine-tuning updates all weights; LoRA/QLoRA use low-rank adapters for efficiency.",
     "confidence": 0.94, "tags": ["llm", "training", "adaptation"]},

    {"concept": "Embeddings", "domain": "artificial_intelligence",
     "description": "Dense vector representations of text/images in semantic space. Similar meanings → similar vectors (high cosine similarity).",
     "confidence": 0.96, "tags": ["nlp", "representation", "vectors"]},

    {"concept": "Prompt Engineering", "domain": "artificial_intelligence",
     "description": "Crafting LLM inputs for desired outputs. Techniques: few-shot examples, chain-of-thought, system prompts, role assignment, output formatting.",
     "confidence": 0.95, "tags": ["llm", "prompting", "optimization"]},

    {"concept": "Reinforcement Learning from Human Feedback", "domain": "artificial_intelligence",
     "description": "Training method using human preference rankings to fine-tune models via reward modeling + PPO. Used in ChatGPT, Claude alignment.",
     "confidence": 0.93, "tags": ["rlhf", "alignment", "training"]},

    {"concept": "Vector Databases", "domain": "artificial_intelligence",
     "description": "Databases optimized for storing and querying embeddings. Support ANN (approximate nearest neighbor) search. Examples: Pinecone, Weaviate, Chroma, pgvector.",
     "confidence": 0.94, "tags": ["databases", "embeddings", "retrieval"]},

    {"concept": "AI Agents", "domain": "artificial_intelligence",
     "description": "LLM-powered systems that use tools, maintain state, and take actions toward goals. Architectures: ReAct, Plan-and-Execute, multi-agent systems.",
     "confidence": 0.94, "tags": ["agents", "llm", "autonomous"]},

    {"concept": "Gradient Descent", "domain": "artificial_intelligence",
     "description": "Optimization algorithm minimizing loss by updating parameters opposite to gradient direction. Variants: SGD, Adam, AdaGrad. Learning rate controls step size.",
     "confidence": 0.97, "tags": ["optimization", "training", "math"]},

    {"concept": "Attention Mechanism", "domain": "artificial_intelligence",
     "description": "Computes weighted sum of values based on query-key similarity. Multi-head attention runs multiple attention operations in parallel for different representation subspaces.",
     "confidence": 0.96, "tags": ["attention", "transformer", "nlp"]},

    # ── SYSTEMS & INFRASTRUCTURE ──────────────────────────────────
    {"concept": "CAP Theorem", "domain": "systems_infrastructure",
     "description": "Distributed systems can guarantee only 2 of 3: Consistency, Availability, Partition Tolerance. CP systems (etcd), AP systems (Cassandra).",
     "confidence": 0.96, "tags": ["distributed", "consistency", "theory"]},

    {"concept": "Kubernetes", "domain": "systems_infrastructure",
     "description": "Container orchestration platform managing deployment, scaling, and self-healing of containerized apps via Pods, Services, Deployments, and ConfigMaps.",
     "confidence": 0.95, "tags": ["containers", "orchestration", "devops"]},

    {"concept": "Event-Driven Architecture", "domain": "systems_infrastructure",
     "description": "Systems communicating via events (messages). Components: producers, consumers, event broker (Kafka, RabbitMQ). Enables loose coupling and scalability.",
     "confidence": 0.94, "tags": ["architecture", "messaging", "scalability"]},

    {"concept": "Load Balancing", "domain": "systems_infrastructure",
     "description": "Distributes traffic across servers. Algorithms: Round Robin, Least Connections, IP Hash, Weighted. L4 (transport) vs L7 (application) balancing.",
     "confidence": 0.95, "tags": ["networking", "scalability", "infrastructure"]},

    {"concept": "Caching Strategies", "domain": "systems_infrastructure",
     "description": "Cache-aside (app manages cache), write-through (sync write), write-behind (async), read-through. Eviction: LRU, LFU, TTL. Redis, Memcached.",
     "confidence": 0.95, "tags": ["caching", "performance", "redis"]},

    {"concept": "Database Transactions", "domain": "systems_infrastructure",
     "description": "ACID properties: Atomicity, Consistency, Isolation, Durability. Isolation levels: Read Uncommitted → Serializable. 2-Phase Commit for distributed transactions.",
     "confidence": 0.96, "tags": ["database", "acid", "consistency"]},

    # ── RESEARCH & METHODOLOGY ────────────────────────────────────
    {"concept": "Scientific Method", "domain": "research",
     "description": "Observation → Hypothesis → Experiment → Analysis → Conclusion. Peer review and reproducibility validate findings.",
     "confidence": 0.98, "tags": ["methodology", "science", "epistemology"]},

    {"concept": "Statistical Significance", "domain": "research",
     "description": "p-value < 0.05 threshold for rejecting null hypothesis. Effect size (Cohen's d) measures practical significance. Multiple testing requires Bonferroni correction.",
     "confidence": 0.95, "tags": ["statistics", "methodology", "analysis"]},

    {"concept": "Ablation Study", "domain": "research",
     "description": "Systematic removal of components to measure each one's contribution to performance. Standard in AI/ML research to justify design choices.",
     "confidence": 0.93, "tags": ["research", "evaluation", "ai"]},

    # ── PRODUCT & PROCESS DESIGN ──────────────────────────────────
    {"concept": "Agile Methodology", "domain": "product_process_design",
     "description": "Iterative development in short sprints (1-2 weeks). Ceremonies: Sprint Planning, Daily Standup, Review, Retrospective. Values working software over documentation.",
     "confidence": 0.96, "tags": ["agile", "scrum", "methodology"]},

    {"concept": "System Design Interviews", "domain": "product_process_design",
     "description": "Framework: Clarify requirements → Estimate scale → High-level design → Deep dive → Trade-offs. Always discuss: CAP theorem, caching, sharding, async.",
     "confidence": 0.93, "tags": ["system_design", "interviews", "architecture"]},

    {"concept": "API Rate Limiting", "domain": "product_process_design",
     "description": "Protect APIs from abuse: Token Bucket, Leaky Bucket, Fixed/Sliding Window algorithms. Implement at gateway level; return 429 with Retry-After header.",
     "confidence": 0.94, "tags": ["api", "security", "scalability"]},

    # ── CYBERSECURITY ─────────────────────────────────────────────
    {"concept": "OWASP Top 10", "domain": "cybersecurity",
     "description": "Top web security risks: Injection, Broken Auth, Sensitive Data Exposure, XXE, Broken Access Control, Security Misconfiguration, XSS, Insecure Deserialization, Vulnerable Components, Logging failures.",
     "confidence": 0.95, "tags": ["security", "web", "vulnerabilities"]},

    {"concept": "Zero Trust Architecture", "domain": "cybersecurity",
     "description": "Never trust, always verify. Assumes breaches are inevitable. Micro-segmentation, least-privilege access, continuous authentication, and mTLS between services.",
     "confidence": 0.94, "tags": ["security", "architecture", "network"]},

    {"concept": "JWT Authentication", "domain": "cybersecurity",
     "description": "Stateless token: Header.Payload.Signature (base64 + HMAC/RSA). Advantages: stateless, cross-domain. Risks: token leakage, no server-side revocation. Use short expiry + refresh tokens.",
     "confidence": 0.95, "tags": ["auth", "tokens", "security"]},
]

# ── Edges between seed concepts ───────────────────────────────────
SEED_EDGES: list[tuple[str, str, str]] = [
    ("Transformer Architecture", "Attention Mechanism", "uses"),
    ("Retrieval-Augmented Generation", "Embeddings", "requires"),
    ("Retrieval-Augmented Generation", "Vector Databases", "uses"),
    ("Fine-tuning", "Gradient Descent", "applies"),
    ("Reinforcement Learning from Human Feedback", "Fine-tuning", "extends"),
    ("AI Agents", "Retrieval-Augmented Generation", "can_use"),
    ("Microservices Architecture", "Event-Driven Architecture", "often_uses"),
    ("Microservices Architecture", "Load Balancing", "requires"),
    ("Kubernetes", "Load Balancing", "provides"),
    ("Caching Strategies", "Database Indexing", "complements"),
    ("SOLID Principles", "Design Patterns", "underlies"),
    ("Test-Driven Development", "CI/CD Pipeline", "enables"),
    ("Zero Trust Architecture", "JWT Authentication", "includes"),
]


def seed_knowledge_graph(graph: "KnowledgeGraph",
                         extra_seeds: list[dict] = None,
                         force: bool = False) -> int:
    """
    Seed the graph with foundational knowledge.
    Skips if already seeded (unless force=True).
    Returns number of concepts added.
    """
    # Check if already seeded
    if not force and graph.find_by_concept(SEED_MARKER, "meta"):
        log.info("Knowledge graph already seeded — skipping")
        return 0

    log.info("Seeding knowledge graph with foundational knowledge...")
    all_seeds = SEEDS + (extra_seeds or [])
    added = 0
    id_map: dict[str, str] = {}

    for seed in all_seeds:
        node = KnowledgeNode(
            concept=seed["concept"],
            domain=seed["domain"],
            description=seed["description"],
            confidence=seed.get("confidence", 0.90),
            tags=seed.get("tags", []),
            sources=["knowledge_seed_v1"],
        )
        node_id = graph.add_node(node)
        id_map[seed["concept"]] = node_id
        added += 1

    # Add seed edges
    for src_name, tgt_name, relation in SEED_EDGES:
        if src_name in id_map and tgt_name in id_map:
            graph.add_edge(KnowledgeEdge(
                source_id=id_map[src_name],
                target_id=id_map[tgt_name],
                relation=relation,
                weight=0.9,
            ))

    # Mark as seeded
    marker = KnowledgeNode(
        concept=SEED_MARKER, domain="meta",
        description="Seed marker — indicates foundational knowledge has been loaded",
        confidence=1.0,
    )
    graph.add_node(marker)
    graph.save()

    log.info(f"Seeding complete: {added} foundational concepts added across "
             f"{len(set(s['domain'] for s in all_seeds))} domains")
    return added
