'use client';

import { useRouter } from 'next/navigation';
import { Video, Play, Clock, Users, FileText, ArrowRight, FolderOpen } from 'lucide-react';

interface Recording {
  id: string;
  title: string;
  duration: string;
  date: string;
  participants: number;
  thumbnail?: string;
  meetingCode: string;
}

interface RecentRecordingsProps {
  recordings?: Recording[];
}

const DEFAULT_RECORDINGS: Recording[] = [
  {
    id: '1',
    title: 'Board Meeting - Q4 Review',
    duration: '1h 23m',
    date: 'Yesterday',
    participants: 12,
    meetingCode: 'MTG-BOARD-Q4',
  },
  {
    id: '2',
    title: 'Investor Pitch - Series B',
    duration: '45m',
    date: '2 days ago',
    participants: 8,
    meetingCode: 'MTG-INV-SB',
  },
  {
    id: '3',
    title: 'Executive Strategy Session',
    duration: '2h 10m',
    date: '3 days ago',
    participants: 6,
    meetingCode: 'MTG-EXEC-STRAT',
  },
];

export function RecentRecordings({ recordings = DEFAULT_RECORDINGS }: RecentRecordingsProps) {
  const router = useRouter();

  return (
    <div className="rounded-2xl bg-slate-900/50 border border-slate-800 overflow-hidden">
      <div className="p-6 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Video className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Recent Recordings</h2>
            <p className="text-xs text-slate-500">AI-processed and ready to review</p>
          </div>
        </div>
        <button
          onClick={() => router.push('/recordings')}
          className="text-sm font-semibold text-blue-400 hover:text-blue-300 transition-all flex items-center gap-2"
        >
          <FolderOpen className="h-4 w-4" />
          View All
        </button>
      </div>

      <div className="divide-y divide-slate-800">
        {recordings.length === 0 ? (
          <div className="p-12 text-center">
            <Video className="h-12 w-12 text-slate-700 mx-auto mb-4" />
            <p className="text-sm text-slate-500 mb-4">No recordings yet</p>
            <p className="text-xs text-slate-600">Recordings will appear here after your meetings</p>
          </div>
        ) : (
          recordings.map((recording) => (
            <div
              key={recording.id}
              className="p-4 hover:bg-slate-800/50 transition-all group cursor-pointer"
              onClick={() => router.push(`/recordings/${recording.id}`)}
            >
              <div className="flex items-center gap-4">
                {/* Thumbnail Placeholder */}
                <div className="w-24 h-14 rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <div className="w-8 h-8 rounded-full bg-slate-700/50 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                    <Play className="h-4 w-4 text-slate-400 group-hover:text-cyan-400 transition-colors ml-0.5" />
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-white truncate mb-1 group-hover:text-cyan-400 transition-colors">
                    {recording.title}
                  </h4>
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {recording.duration}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {recording.participants}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {recording.date}
                    </span>
                  </div>
                </div>

                {/* Action */}
                <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
