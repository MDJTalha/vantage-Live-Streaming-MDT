"""
VANTAGE — AI Recording Summarization
Uses augmented.py reasoning to auto-summarize recordings
"""
from __future__ import annotations
import json
from typing import Optional
from prisma import Prisma
from brain import AutonomousBrain
from utils.logger import get_logger

log = get_logger("RecordingSummarization")


class RecordingSummarizer:
    """
    AI-powered recording summarization.
    Generates summaries, tags, and key points from recordings.
    """

    def __init__(self):
        self.db = Prisma()
        self.brain = AutonomousBrain(seed=True)

    async def connect(self):
        await self.db.connect()
        log.info("✅ Recording Summarizer connected")

    async def disconnect(self):
        await self.db.disconnect()

    async def summarize_recording(self, recording_id: str) -> dict:
        """
        Generate AI summary for a recording.
        """
        log.info(f"[SUMMARY] Processing recording: {recording_id}")

        # Fetch recording
        recording = await self.db.recording.find_unique(
            where={'id': recording_id},
            include={'meeting': True}
        )

        if not recording:
            return {'error': 'Recording not found'}

        # Get transcript (if available)
        transcript = await self._get_transcript(recording_id)

        # Build context
        context = f"""
Recording: {recording.title}
Meeting: {recording.meeting.name if recording.meeting else 'Unknown'}
Duration: {recording.duration} seconds
Format: {recording.format}

Transcript:
{transcript[:3000] if transcript else 'No transcript available'}

Description:
{recording.description or 'No description'}
"""

        # AI analysis
        analysis = self.brain.chat(
            f"""Analyze this recording and provide:

{context}

Provide structured JSON output:
{{
  "summary": "2-3 sentence summary",
  "key_points": ["point 1", "point 2", "point 3"],
  "tags": ["tag1", "tag2", "tag3"],
  "category": "meeting|webinar|training|workshop|interview|other",
  "action_items": ["action 1", "action 2"],
  "decisions_made": ["decision 1", "decision 2"],
  "sentiment": "positive|neutral|negative",
  "confidence": 0.95
}}""",
            domain='artificial_intelligence'
        )

        # Parse AI response
        structured = self._parse_json_response(analysis)

        # Update recording with AI data
        await self.db.recording.update(
            where={'id': recording_id},
            data={
                'description': structured.get('summary', recording.description),
                # In production, add metadata JSON field to schema
            }
        )

        log.info(f"[SUMMARY] Generated for {recording_id}")

        return {
            'recording_id': recording_id,
            'summary': structured.get('summary', ''),
            'key_points': structured.get('key_points', []),
            'tags': structured.get('tags', []),
            'category': structured.get('category', 'meeting'),
            'action_items': structured.get('action_items', []),
            'decisions_made': structured.get('decisions_made', []),
            'sentiment': structured.get('sentiment', 'neutral'),
            'confidence': structured.get('confidence', 0.8),
        }

    async def summarize_all_recordings(self, limit: int = 50) -> dict:
        """
        Summarize all recordings without summaries.
        """
        recordings = await self.db.recording.find_many(
            take=limit,
            order={'createdAt': 'desc'}
        )

        results = []
        for rec in recordings:
            try:
                summary = await self.summarize_recording(rec.id)
                results.append(summary)
            except Exception as e:
                log.error(f"Failed to summarize {rec.id}: {e}")
                results.append({
                    'recording_id': rec.id,
                    'error': str(e)
                })

        return {
            'total': len(recordings),
            'summarized': len([r for r in results if 'error' not in r]),
            'failed': len([r for r in results if 'error' in r]),
            'results': results,
        }

    async def _get_transcript(self, recording_id: str) -> Optional[str]:
        """Fetch transcript from database or file."""
        # In production, implement transcript storage
        # For now, return None
        return None

    def _parse_json_response(self, text: str) -> dict:
        """Parse JSON from AI response."""
        import json
        import re
        
        # Try to extract JSON from text
        json_match = re.search(r'\{[\s\S]*\}', text)
        if json_match:
            try:
                return json.loads(json_match.group())
            except:
                pass
        
        # Fallback to structured default
        return {
            'summary': text[:500],
            'key_points': [],
            'tags': [],
            'category': 'meeting',
            'action_items': [],
            'decisions_made': [],
            'sentiment': 'neutral',
            'confidence': 0.8,
        }


if __name__ == '__main__':
    import asyncio
    import sys

    async def main():
        summarizer = RecordingSummarizer()
        await summarizer.connect()

        if len(sys.argv) > 1:
            recording_id = sys.argv[1]
            result = await summarizer.summarize_recording(recording_id)
            print(json.dumps(result, indent=2))
        else:
            result = await summarizer.summarize_all_recordings(limit=10)
            print(f"Summarized: {result['summarized']}/{result['total']}")
            print(f"Failed: {result['failed']}")

        await summarizer.disconnect()

    asyncio.run(main())
