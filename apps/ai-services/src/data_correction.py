"""
VANTAGE — AI Data Correction & Enhancement System
Integrates Autonomous Brain with VANTAGE PostgreSQL database
for automated data correction, validation, and enrichment.
"""
from __future__ import annotations
import json
from typing import Optional
from prisma import Prisma
from brain import AutonomousBrain
from utils.logger import get_logger

log = get_logger("AIDataCorrection")


class AIDataCorrection:
    """
    AI-powered data correction for VANTAGE platform.
    Uses multi-agent reasoning to identify and fix data issues.
    """

    def __init__(self):
        self.db = Prisma()
        self.brain = AutonomousBrain(seed=True)
        self._correction_log = []

    async def connect(self):
        """Initialize database connection."""
        await self.db.connect()
        log.info("✅ AI Data Correction connected to database")

    async def disconnect(self):
        """Close database connection."""
        await self.db.disconnect()

    # ══════════════════════════════════════════════════════════════
    # MEETING DATA CORRECTION
    # ══════════════════════════════════════════════════════════════

    async def correct_meeting_data(self, meeting_id: str) -> dict:
        """
        Analyze and correct meeting data inconsistencies.
        Returns correction report.
        """
        log.info(f"[AI CORRECTION] Analyzing meeting: {meeting_id}")

        # Fetch meeting
        meeting = await self.db.meeting.find_unique(where={'id': meeting_id})
        if not meeting:
            return {'error': 'Meeting not found'}

        # Fetch participants
        participants = await self.db.participant.find_many(
            where={'meetingId': meeting_id}
        )

        # Fetch messages
        messages = await self.db.message.find_many(
            where={'meetingId': meeting_id}
        )

        # AI analysis
        analysis = self.brain.chat(
            f"""Analyze this meeting data for inconsistencies:

Meeting: {json.dumps({
    'id': meeting.id,
    'name': meeting.name,
    'code': meeting.code,
    'status': meeting.status,
    'scheduledAt': str(meeting.scheduledAt) if meeting.scheduledAt else None,
    'duration': meeting.duration,
    'maxParticipants': meeting.maxParticipants,
}, default=str)}

Participants: {len(participants)}
Messages: {len(messages)}

Check for:
1. Status inconsistencies (e.g., ACTIVE meeting with no participants)
2. Duration mismatches
3. Invalid codes
4. Orphaned records
5. Data quality issues

Return structured correction recommendations.""",
            domain='software_engineering'
        )

        # Apply corrections
        corrections = await self._apply_meeting_corrections(meeting, participants, messages, analysis)

        return {
            'meeting_id': meeting_id,
            'analysis': analysis,
            'corrections_applied': corrections,
            'timestamp': str(prisma.datetime.now())
        }

    async def _apply_meeting_corrections(self, meeting, participants, messages, analysis) -> list:
        """Apply AI-recommended corrections."""
        corrections = []

        # Check for status inconsistencies
        if meeting.status == 'ACTIVE' and len(participants) == 0:
            # Meeting marked active but no participants - likely stale
            await self.db.meeting.update(
                where={'id': meeting.id},
                data={'status': 'ENDED'}
            )
            corrections.append({
                'field': 'status',
                'old': meeting.status,
                'new': 'ENDED',
                'reason': 'Active meeting with no participants'
            })
            log.info(f"Corrected meeting {meeting.id} status: ACTIVE → ENDED")

        # Check for duration issues
        if meeting.duration and meeting.duration > 1440:  # > 24 hours
            await self.db.meeting.update(
                where={'id': meeting.id},
                data={'duration': 120}  # Default to 2 hours
            )
            corrections.append({
                'field': 'duration',
                'old': meeting.duration,
                'new': 120,
                'reason': 'Unrealistic duration (>24h)'
            })

        # Check for invalid meeting codes
        if not meeting.code or len(meeting.code) != 6:
            new_code = await self._generate_meeting_code()
            await self.db.meeting.update(
                where={'id': meeting.id},
                data={'code': new_code}
            )
            corrections.append({
                'field': 'code',
                'old': meeting.code,
                'new': new_code,
                'reason': 'Invalid code format'
            })

        return corrections

    # ══════════════════════════════════════════════════════════════
    # USER DATA ENRICHMENT
    # ══════════════════════════════════════════════════════════════

    async def enrich_user_profiles(self, user_id: Optional[str] = None) -> dict:
        """
        Enrich user profiles with AI-generated insights.
        """
        query = {'id': user_id} if user_id else {}
        users = await self.db.user.find_many(where=query)

        enrichments = []
        for user in users:
            # Analyze user activity
            meetings_hosted = await self.db.meeting.count(
                where={'hostId': user.id}
            )
            meetings_participated = await self.db.participant.count(
                where={'userId': user.id}
            )
            messages_sent = await self.db.message.count(
                where={'senderId': user.id}
            )

            # AI analysis
            analysis = self.brain.chat(
                f"""Analyze this user's activity pattern:

User: {user.name} ({user.email})
Role: {user.role}
Meetings Hosted: {meetings_hosted}
Meetings Participated: {meetings_participated}
Messages Sent: {messages_sent}

Suggest:
1. Engagement level (low/medium/high)
2. Recommended features
3. Potential issues
4. Profile enhancements""",
                domain='product_process_design'
            )

            # Store analysis in metadata (you'd add a metadata field to User model)
            enrichments.append({
                'user_id': user.id,
                'email': user.email,
                'name': user.name,
                'activity': {
                    'meetings_hosted': meetings_hosted,
                    'meetings_participated': meetings_participated,
                    'messages_sent': messages_sent,
                },
                'ai_analysis': analysis[:500],  # Truncate for storage
            })

        return {
            'users_enriched': len(enrichments),
            'enrichments': enrichments,
        }

    # ══════════════════════════════════════════════════════════════
    # RECORDING DATA ENHANCEMENT
    # ══════════════════════════════════════════════════════════════

    async def enhance_recordings(self, recording_id: Optional[str] = None) -> dict:
        """
        Auto-tag and categorize recordings using AI.
        """
        query = {'id': recording_id} if recording_id else {}
        recordings = await self.db.recording.find_many(where=query)

        enhancements = []
        for recording in recordings:
            # AI analysis of recording metadata
            analysis = self.brain.chat(
                f"""Analyze this recording and suggest tags/categories:

Title: {recording.title}
Description: {recording.description or 'N/A'}
Duration: {recording.duration}s
Format: {recording.format}
Created: {recording.createdAt}

Suggest:
1. Category (meeting, webinar, training, etc.)
2. Tags (5-10 relevant keywords)
3. Summary (2-3 sentences)
4. Key topics discussed""",
                domain='artificial_intelligence'
            )

            # Extract structured data from AI response
            tags = self._extract_tags(analysis)
            category = self._extract_category(analysis)
            summary = self._extract_summary(analysis)

            enhancements.append({
                'recording_id': recording.id,
                'tags': tags,
                'category': category,
                'summary': summary,
                'ai_analysis': analysis[:500],
            })

        return {
            'recordings_enhanced': len(enhancements),
            'enhancements': enhancements,
        }

    # ══════════════════════════════════════════════════════════════
    # KNOWLEDGE GRAPH BUILDING
    # ══════════════════════════════════════════════════════════════

    async def build_knowledge_from_meetings(self, limit: int = 50) -> dict:
        """
        Extract knowledge from past meetings and build knowledge graph.
        """
        # Get recent meetings
        meetings = await self.db.meeting.find_many(
            take=limit,
            order={'createdAt': 'desc'},
            include={
                'messages': {'take': 100},
                'recordings': True,
            }
        )

        knowledge_added = 0
        for meeting in meetings:
            # Extract key concepts from meeting
            if meeting.messages:
                conversation = '\n'.join([
                    f"{m.senderId}: {m.content}"
                    for m in meeting.messages[:50]
                ])

                # AI extraction
                concepts = self.brain.chat(
                    f"""Extract key concepts and knowledge from this meeting:

Meeting: {meeting.name}
Conversation:
{conversation[:2000]}

Extract:
1. Key topics discussed (5-10)
2. Decisions made
3. Action items
4. Technical concepts mentioned
5. Best practices shared

Return as structured JSON.""",
                    domain='software_engineering'
                )

                # Add to knowledge graph
                self.brain.learn_from(
                    content=concepts,
                    domain='meeting_knowledge',
                    source=f'meeting_{meeting.id}'
                )
                knowledge_added += 1

        return {
            'meetings_processed': len(meetings),
            'knowledge_nodes_added': knowledge_added,
        }

    # ══════════════════════════════════════════════════════════════
    # DATA QUALITY AUDIT
    # ══════════════════════════════════════════════════════════════

    async def audit_data_quality(self) -> dict:
        """
        Comprehensive data quality audit across all tables.
        """
        log.info("[AI AUDIT] Starting comprehensive data quality audit")

        issues = {
            'meetings': [],
            'users': [],
            'recordings': [],
            'messages': [],
        }

        # Audit meetings
        all_meetings = await self.db.meeting.find_many()
        for meeting in all_meetings:
            if meeting.status == 'ACTIVE':
                # Check if meeting is stale (active > 24h)
                age_hours = (prisma.datetime.now() - meeting.createdAt).total_seconds() / 3600
                if age_hours > 24:
                    issues['meetings'].append({
                        'id': meeting.id,
                        'issue': 'Stale active meeting',
                        'severity': 'medium',
                        'recommendation': 'Mark as ENDED'
                    })

        # Audit users
        all_users = await self.db.user.find_many()
        for user in all_users:
            if not user.name or len(user.name) < 2:
                issues['users'].append({
                    'id': user.id,
                    'issue': 'Invalid name',
                    'severity': 'low',
                    'recommendation': 'Request name update'
                })

        # Audit recordings
        all_recordings = await self.db.recording.find_many()
        for recording in all_recordings:
            if recording.status == 'PROCESSING':
                age_hours = (prisma.datetime.now() - recording.createdAt).total_seconds() / 3600
                if age_hours > 2:
                    issues['recordings'].append({
                        'id': recording.id,
                        'issue': 'Stuck in processing',
                        'severity': 'high',
                        'recommendation': 'Mark as FAILED or retry'
                    })

        # AI analysis of issues
        ai_recommendations = self.brain.chat(
            f"""Analyze these data quality issues and prioritize fixes:

{json.dumps(issues, default=str, indent=2)}

Provide:
1. Priority order for fixes
2. Automated fixes that can be applied
3. Manual interventions needed
4. Prevention strategies""",
            domain='systems_infrastructure'
        )

        return {
            'audit_timestamp': str(prisma.datetime.now()),
            'issues_found': sum(len(v) for v in issues.values()),
            'issues_by_table': {k: len(v) for k, v in issues.items()},
            'detailed_issues': issues,
            'ai_recommendations': ai_recommendations,
        }

    # ══════════════════════════════════════════════════════════════
    # HELPERS
    # ══════════════════════════════════════════════════════════════

    async def _generate_meeting_code(self) -> str:
        """Generate unique 6-character meeting code."""
        import random
        chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
        while True:
            code = ''.join(random.choice(chars) for _ in range(6))
            existing = await self.db.meeting.find_unique(where={'code': code})
            if not existing:
                return code

    def _extract_tags(self, text: str) -> list:
        """Extract tags from AI response."""
        # Simple extraction - in production use better parsing
        import re
        tags = re.findall(r'\b[A-Za-z][a-z]+\b', text)
        return list(set(tags))[:10]

    def _extract_category(self, text: str) -> str:
        """Extract category from AI response."""
        categories = ['meeting', 'webinar', 'training', 'workshop', 'interview', 'other']
        text_lower = text.lower()
        for cat in categories:
            if cat in text_lower:
                return cat
        return 'meeting'

    def _extract_summary(self, text: str) -> str:
        """Extract summary from AI response."""
        # Look for summary section
        if 'Summary:' in text:
            return text.split('Summary:')[1].split('\n')[0].strip()[:500]
        return text[:500]


# ══════════════════════════════════════════════════════════════════
# CLI USAGE
# ══════════════════════════════════════════════════════════════════

if __name__ == '__main__':
    import asyncio

    async def main():
        correction = AIDataCorrection()
        await correction.connect()

        # Run data correction
        print("🔍 Starting AI Data Correction...")

        # Audit data quality
        audit = await correction.audit_data_quality()
        print(f"\n📊 Data Quality Audit:")
        print(f"  Issues found: {audit['issues_found']}")
        print(f"  AI Recommendations: {audit['ai_recommendations'][:200]}...")

        # Enhance recordings
        recordings = await correction.enhance_recordings()
        print(f"\n Recordings Enhanced: {recordings['recordings_enhanced']}")

        # Build knowledge graph
        knowledge = await correction.build_knowledge_from_meetings()
        print(f"\n🧠 Knowledge Nodes Added: {knowledge['knowledge_nodes_added']}")

        await correction.disconnect()

    asyncio.run(main())
