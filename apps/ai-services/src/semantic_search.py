"""
VANTAGE — AI Semantic Search
Vector-based semantic search across meetings, recordings, and transcripts
"""
from __future__ import annotations
import json
from typing import Optional, List
from prisma import Prisma
from brain import AutonomousBrain
from utils.logger import get_logger

log = get_logger("SemanticSearch")


class SemanticSearch:
    """
    Semantic search using AI embeddings.
    Search by meaning, not just keywords.
    """

    def __init__(self):
        self.db = Prisma()
        self.brain = AutonomousBrain(seed=True)

    async def connect(self):
        await self.db.connect()
        log.info("✅ Semantic Search connected")

    async def disconnect(self):
        await self.db.disconnect()

    async def search(self, query: str, options: dict = None) -> dict:
        """
        Semantic search across all VANTAGE data.
        
        Args:
            query: Natural language query
            options: {
                'sources': ['meetings', 'recordings', 'transcripts'],
                'date_range': {'start': '2026-01-01', 'end': '2026-12-31'},
                'limit': 20
            }
        """
        options = options or {}
        sources = options.get('sources', ['meetings', 'recordings'])
        limit = options.get('limit', 20)
        date_range = options.get('date_range')

        log.info(f"[SEARCH] Query: {query[:100]}")

        # AI query enhancement
        enhanced_query = self._enhance_query(query)

        results = {
            'query': query,
            'enhanced_query': enhanced_query,
            'meetings': [],
            'recordings': [],
            'transcripts': [],
        }

        # Search meetings
        if 'meetings' in sources:
            results['meetings'] = await self._search_meetings(
                enhanced_query, limit // 2, date_range
            )

        # Search recordings
        if 'recordings' in sources:
            results['recordings'] = await self._search_recordings(
                enhanced_query, limit // 2, date_range
            )

        # Search transcripts
        if 'transcripts' in sources:
            results['transcripts'] = await self._search_transcripts(
                enhanced_query, limit, date_range
            )

        # AI ranking
        ranked = self._rank_results(results, query)

        return {
            'query': query,
            'total_results': sum(len(v) for v in ranked.values()),
            'results': ranked,
        }

    async def _search_meetings(self, query: str, limit: int, date_range: dict = None) -> list:
        """Search meetings by semantic similarity."""
        # Get all meetings (in production, use vector DB)
        where = {}
        if date_range:
            where['createdAt'] = {
                'gte': date_range.get('start'),
                'lte': date_range.get('end'),
            }

        meetings = await self.db.meeting.find_many(
            where=where,
            take=limit * 2,  # Get more, AI will rank
            include={'participants': {'take': 5}}
        )

        # AI ranking
        ranked = []
        for meeting in meetings:
            relevance = self._calculate_relevance(meeting, query)
            if relevance > 0.5:  # Threshold
                ranked.append({
                    'type': 'meeting',
                    'id': meeting.id,
                    'name': meeting.name,
                    'code': meeting.code,
                    'status': meeting.status,
                    'relevance': relevance,
                    'snippet': self._generate_snippet(meeting.name, meeting.name, query),
                    'date': str(meeting.createdAt),
                })

        # Sort by relevance
        ranked.sort(key=lambda x: x['relevance'], reverse=True)
        return ranked[:limit]

    async def _search_recordings(self, query: str, limit: int, date_range: dict = None) -> list:
        """Search recordings by semantic similarity."""
        where = {}
        if date_range:
            where['createdAt'] = {
                'gte': date_range.get('start'),
                'lte': date_range.get('end'),
            }

        recordings = await self.db.recording.find_many(
            where=where,
            take=limit * 2,
            include={'meeting': True}
        )

        ranked = []
        for rec in recordings:
            relevance = self._calculate_relevance(rec, query)
            if relevance > 0.5:
                ranked.append({
                    'type': 'recording',
                    'id': rec.id,
                    'title': rec.title,
                    'duration': rec.duration,
                    'relevance': relevance,
                    'snippet': self._generate_snippet(rec.title, rec.description or '', query),
                    'meeting_name': rec.meeting.name if rec.meeting else None,
                    'date': str(rec.createdAt),
                })

        ranked.sort(key=lambda x: x['relevance'], reverse=True)
        return ranked[:limit]

    async def _search_transcripts(self, query: str, limit: int, date_range: dict = None) -> list:
        """Search transcripts by semantic similarity."""
        # Search messages as proxy for transcripts
        where = {}
        if date_range:
            where['createdAt'] = {
                'gte': date_range.get('start'),
                'lte': date_range.get('end'),
            }

        messages = await self.db.message.find_many(
            where=where,
            take=limit * 3,
            include={'sender': True, 'meeting': True}
        )

        ranked = []
        for msg in messages:
            relevance = self._calculate_relevance(msg, query)
            if relevance > 0.6:
                ranked.append({
                    'type': 'transcript',
                    'id': msg.id,
                    'content': msg.content[:200],
                    'relevance': relevance,
                    'sender': msg.sender.name if msg.sender else 'Unknown',
                    'meeting_name': msg.meeting.name if msg.meeting else None,
                    'date': str(msg.createdAt),
                })

        ranked.sort(key=lambda x: x['relevance'], reverse=True)
        return ranked[:limit]

    def _enhance_query(self, query: str) -> str:
        """Use AI to enhance search query with synonyms and related terms."""
        prompt = f"""Enhance this search query for better results:

Original: "{query}"

Provide:
1. Synonyms for key terms
2. Related concepts
3. Alternative phrasings

Return as a single enhanced search string."""

        enhanced = self.brain.chat(prompt, domain='artificial_intelligence')
        return enhanced[:500]

    def _calculate_relevance(self, item, query: str) -> float:
        """Calculate relevance score using AI."""
        # Simple keyword-based for now (in production, use embeddings)
        text = ' '.join([
            getattr(item, 'name', '') or '',
            getattr(item, 'title', '') or '',
            getattr(item, 'description', '') or '',
            getattr(item, 'content', '') or '',
        ]).lower()

        query_terms = query.lower().split()
        matches = sum(1 for term in query_terms if term in text)
        
        return matches / len(query_terms) if query_terms else 0.0

    def _generate_snippet(self, title: str, content: str, query: str) -> str:
        """Generate relevant snippet with query terms highlighted."""
        # Simple snippet generation
        if len(content) > 200:
            content = content[:200] + '...'
        
        return f"{title}: {content}" if title else content

    def _rank_results(self, results: dict, query: str) -> dict:
        """AI-powered ranking of all results."""
        # For now, return as-is (already sorted by relevance)
        # In production, use AI to re-rank across types
        return results


if __name__ == '__main__':
    import asyncio
    import sys

    async def main():
        search = SemanticSearch()
        await search.connect()

        query = ' '.join(sys.argv[1:]) if len(sys.argv) > 1 else 'board meeting strategy'
        
        results = await search.search(query, {
            'sources': ['meetings', 'recordings'],
            'limit': 10,
        })

        print(f"\n🔍 Search: {query}")
        print(f"Total results: {results['total_results']}")
        
        for source, items in results['results'].items():
            if items:
                print(f"\n{source.upper()} ({len(items)}):")
                for item in items[:5]:
                    print(f"  • {item.get('name') or item.get('title', 'Unknown')} ({item['relevance']:.2f})")

        await search.disconnect()

    asyncio.run(main())
