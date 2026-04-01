"""
VANTAGE — AI Action Item Extraction
Uses multi-agent coordinator to extract action items from meetings
"""
from __future__ import annotations
import json
from typing import List, Optional
from prisma import Prisma
from coordinator import MultiAgentCoordinator
from utils.logger import get_logger

log = get_logger("ActionItemExtractor")


class ActionItemExtractor:
    """
    Extract action items from meetings using multi-agent AI.
    """

    def __init__(self):
        self.db = Prisma()
        self.coordinator = MultiAgentCoordinator()

    async def connect(self):
        await self.db.connect()
        log.info("✅ Action Item Extractor connected")

    async def disconnect(self):
        await self.db.disconnect()

    async def extract_from_meeting(self, meeting_id: str) -> dict:
        """
        Extract action items from a specific meeting.
        """
        log.info(f"[EXTRACT] Processing meeting: {meeting_id}")

        # Fetch meeting
        meeting = await self.db.meeting.find_unique(
            where={'id': meeting_id},
            include={
                'messages': {'take': 200, 'order': {'createdAt': 'asc'}},
                'participants': {'include': {'user': True}}
            }
        )

        if not meeting:
            return {'error': 'Meeting not found'}

        # Build conversation transcript
        transcript = self._build_transcript(meeting.messages)

        # Multi-agent extraction
        task = f"""Extract action items from this meeting:

Meeting: {meeting.name}
Participants: {', '.join([p.name for p in meeting.participants])}

Transcript:
{transcript[:3000]}

Extract:
1. Action items (who, what, by when)
2. Decisions made
3. Follow-ups required
4. Key takeaways

Return as structured JSON."""

        result = self.coordinator.run_sequential(task, context="")

        # Parse AI response
        action_items = self._parse_action_items(result['final_output'])

        # Store in database (in production, create ActionItem model)
        stored = await self._store_action_items(meeting_id, action_items)

        log.info(f"[EXTRACT] Found {len(action_items)} action items")

        return {
            'meeting_id': meeting_id,
            'meeting_name': meeting.name,
            'action_items': action_items,
            'decisions': self._extract_decisions(result['final_output']),
            'follow_ups': self._extract_follow_ups(result['final_output']),
            'raw_analysis': result['final_output'][:1000],
            'stored': stored,
        }

    async def extract_from_all_meetings(self, limit: int = 20) -> dict:
        """
        Extract action items from recent meetings.
        """
        meetings = await self.db.meeting.find_many(
            take=limit,
            order={'createdAt': 'desc'},
            include={'messages': {'take': 50}}
        )

        results = []
        for meeting in meetings:
            try:
                result = await self.extract_from_meeting(meeting.id)
                results.append(result)
            except Exception as e:
                log.error(f"Failed to extract from {meeting.id}: {e}")
                results.append({
                    'meeting_id': meeting.id,
                    'error': str(e)
                })

        return {
            'total': len(meetings),
            'processed': len([r for r in results if 'error' not in r]),
            'failed': len([r for r in results if 'error' in r]),
            'total_action_items': sum(
                len(r.get('action_items', [])) for r in results if 'error' not in r
            ),
            'results': results,
        }

    def _build_transcript(self, messages: list) -> str:
        """Build conversation transcript from messages."""
        lines = []
        for msg in messages:
            sender = getattr(msg, 'senderName', 'Unknown')
            content = msg.content
            lines.append(f"{sender}: {content}")
        return '\n'.join(lines)

    def _parse_action_items(self, text: str) -> list:
        """Parse action items from AI response."""
        import re
        
        action_items = []
        
        # Look for action item patterns
        patterns = [
            r'[-•*]\s*\[?\s*([^\]]+)\]?\s*:?\s*(.+?)(?=\n[-•*]|$)',
            r'(\w+\s+\w+)\s+should\s+(.+?)(?=\.|$)',
            r'Action\s+Item[:\s]+(.+?)(?=\n|$)',
        ]

        for pattern in patterns:
            matches = re.findall(pattern, text, re.IGNORECASE | re.MULTILINE)
            for match in matches:
                if isinstance(match, tuple):
                    owner, action = match
                else:
                    owner, action = 'Unassigned', match
                
                action_items.append({
                    'owner': owner.strip() if owner else 'Unassigned',
                    'action': action.strip(),
                    'status': 'pending',
                    'priority': 'medium',
                })

        # Remove duplicates
        seen = set()
        unique = []
        for item in action_items:
            key = f"{item['owner']}:{item['action']}"
            if key not in seen:
                seen.add(key)
                unique.append(item)

        return unique[:20]  # Limit to 20

    def _extract_decisions(self, text: str) -> list:
        """Extract decisions from AI response."""
        import re
        
        decisions = []
        patterns = [
            r'Decision[:\s]+(.+?)(?=\n|$)',
            r'Decided[:\s]+(.+?)(?=\.|$)',
            r'Agreed[:\s]+(.+?)(?=\.|$)',
        ]

        for pattern in patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            decisions.extend(matches)

        return list(set(decisions))[:10]

    def _extract_follow_ups(self, text: str) -> list:
        """Extract follow-ups from AI response."""
        import re
        
        follow_ups = []
        patterns = [
            r'Follow[- ]?up[:\s]+(.+?)(?=\n|$)',
            r'Next\s+steps[:\s]+(.+?)(?=\n|$)',
        ]

        for pattern in patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            follow_ups.extend(matches)

        return list(set(follow_ups))[:10]

    async def _store_action_items(self, meeting_id: str, items: list) -> int:
        """Store action items in database."""
        # In production, create ActionItem model and store
        # For now, just log
        log.info(f"Would store {len(items)} action items for {meeting_id}")
        return len(items)


if __name__ == '__main__':
    import asyncio
    import sys

    async def main():
        extractor = ActionItemExtractor()
        await extractor.connect()

        if len(sys.argv) > 1:
            meeting_id = sys.argv[1]
            result = await extractor.extract_from_meeting(meeting_id)
            print(f"\n📋 Action Items from {result.get('meeting_name', 'Unknown')}:")
            for item in result.get('action_items', [])[:10]:
                print(f"  • [{item['owner']}] {item['action']}")
        else:
            result = await extractor.extract_from_all_meetings(limit=5)
            print(f"\n✅ Processed: {result['processed']}/{result['total']}")
            print(f"📋 Total action items: {result['total_action_items']}")

        await extractor.disconnect()

    asyncio.run(main())
