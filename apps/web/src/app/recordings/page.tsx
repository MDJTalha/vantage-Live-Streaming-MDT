'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@vantage/ui';
import {
  Video,
  Play,
  Download,
  Trash2,
  Calendar,
  HardDrive,
  Search,
  Filter,
  Share2,
  Film,
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { recordingService, type Recording } from '@/services/RecordingService';
import meetingService from '@/services/MeetingService';

export default function RecordingsLibrary() {
  const router = useRouter();
  useAuth();
  const [recordings, setRecordings] = useState<Array<Recording & { meetingName?: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackUrl, setPlaybackUrl] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadRecordings();
  }, []);

  async function loadRecordings() {
    try {
      setIsLoading(true);
      // Get all meetings first to get meeting names
      const meetings = await meetingService.getAllMeetings();
      
      // Get recordings for each meeting
      const allRecordings: Array<Recording & { meetingName?: string }> = [];
      
      for (const meeting of meetings) {
        try {
          const meetingRecordings = await recordingService.getRecordings(meeting.code);
          allRecordings.push(...meetingRecordings.map(r => ({
            ...r,
            meetingName: meeting.name,
            meetingCode: meeting.code,
          })));
        } catch (error) {
          console.error(`Failed to load recordings for meeting ${meeting.code}:`, error);
        }
      }
      
      setRecordings(allRecordings);
    } catch (error) {
      console.error('Failed to load recordings:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handlePlayRecording(recording: Recording) {
    try {
      setSelectedRecording(recording);
      setIsPlaying(true);
      // In a real implementation, get the actual URL
      // const url = await recordingService.getRecordingUrl(recording.roomId, recording.key);
      // setPlaybackUrl(url);
      
      // For demo, use a placeholder
      setPlaybackUrl('https://www.w3schools.com/html/mov_bbb.mp4');
    } catch (error: any) {
      alert(error.message || 'Failed to load recording');
    }
  }

  async function handleDownloadRecording(recording: Recording) {
    try {
      const url = await recordingService.getRecordingUrl(recording.roomId, recording.key);
      window.open(url, '_blank');
    } catch (error: any) {
      alert(error.message || 'Failed to download recording');
    }
  }

  async function handleDeleteRecording(recording: Recording) {
    try {
      await recordingService.deleteRecording(recording.key);
      await loadRecordings();
      setDeleteConfirm(null);
    } catch (error: any) {
      alert(error.message || 'Failed to delete recording');
    }
  }

  async function handleShareRecording(recording: Recording) {
    try {
      const url = await recordingService.getRecordingUrl(recording.roomId, recording.key);
      await navigator.clipboard.writeText(url);
      alert('Recording URL copied to clipboard!');
    } catch (error: any) {
      alert(error.message || 'Failed to share recording');
    }
  }

  // Filter recordings by search query
  const filteredRecordings = recordings.filter(rec =>
    rec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rec.meetingName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate total storage
  const totalStorage = recordings.reduce((sum, r) => sum + (r.size || 0), 0);
  const formatStorage = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      {/* Header */}
      <header className="bg-gradient-to-b from-[#0a0e1a] to-[#0f172a] border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Film className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Recordings Library</h1>
                <p className="text-slate-400 text-sm">
                  {recordings.length} recordings • {formatStorage(totalStorage)} total
                </p>
              </div>
            </div>
            <Button
              onClick={() => router.push('/dashboard')}
              variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Search and Filter */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search recordings..."
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>
          <Button variant="outline" className="border-slate-700 text-slate-300">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
            <span className="ml-3 text-slate-400">Loading recordings...</span>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredRecordings.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-6">
              <Video className="h-10 w-10 text-slate-600" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No recordings yet</h3>
            <p className="text-slate-400 mb-6">
              Record your meetings to access them later
            </p>
            <Button
              onClick={() => router.push('/create-room')}
              className="bg-amber-600 hover:bg-amber-500 text-white"
            >
              Create a Meeting
            </Button>
          </div>
        )}

        {/* Recordings Grid */}
        {!isLoading && filteredRecordings.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecordings.map((recording) => (
              <div
                key={recording.id}
                className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden hover:border-amber-500/30 transition-all group"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-slate-900">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-500/10" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button
                      onClick={() => handlePlayRecording(recording)}
                      className="w-16 h-16 rounded-full bg-amber-600/90 hover:bg-amber-500 flex items-center justify-center transition-all transform group-hover:scale-110"
                    >
                      <Play className="h-7 w-7 text-white ml-1" />
                    </button>
                  </div>
                  <div className="absolute bottom-3 right-3 px-2 py-1 rounded bg-black/80 text-xs text-white font-medium">
                    {formatDuration(recording.duration)}
                  </div>
                  {recording.status === 'processing' && (
                    <div className="absolute top-3 left-3 px-2 py-1 rounded bg-blue-600 text-xs text-white font-medium flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Processing
                    </div>
                  )}
                  {recording.status === 'ready' && (
                    <div className="absolute top-3 left-3 px-2 py-1 rounded bg-green-600 text-xs text-white font-medium flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Ready
                    </div>
                  )}
                  {recording.status === 'failed' && (
                    <div className="absolute top-3 left-3 px-2 py-1 rounded bg-red-600 text-xs text-white font-medium flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Failed
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-white truncate mb-1">
                      {recording.title}
                    </h3>
                    <p className="text-sm text-slate-400 truncate">
                      {recording.meetingName || 'Meeting'}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(recording.createdAt)}
                    </div>
                    <div className="flex items-center gap-1">
                      <HardDrive className="h-3 w-3" />
                      {formatStorage(recording.size)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-slate-700">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePlayRecording(recording)}
                      className="flex-1 text-slate-300 hover:text-white hover:bg-slate-700"
                    >
                      <Play className="h-3 w-3 mr-1.5" />
                      Play
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownloadRecording(recording)}
                      className="text-slate-300 hover:text-white hover:bg-slate-700 h-8 w-8 p-0"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleShareRecording(recording)}
                      className="text-slate-300 hover:text-white hover:bg-slate-700 h-8 w-8 p-0"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteConfirm(recording.key)}
                      className="text-red-400 hover:text-red-300 hover:bg-slate-700 h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Video Player Modal */}
      {isPlaying && selectedRecording && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="w-full max-w-5xl mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">
                {selectedRecording.title}
              </h3>
              <Button
                variant="ghost"
                onClick={() => {
                  setIsPlaying(false);
                  setSelectedRecording(null);
                  setPlaybackUrl('');
                }}
                className="text-slate-400 hover:text-white"
              >
                Close
              </Button>
            </div>
            <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
              {playbackUrl ? (
                <video
                  src={playbackUrl}
                  controls
                  autoPlay
                  className="w-full h-full"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-amber-500 mx-auto mb-3" />
                    <p className="text-slate-400">Loading video...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-2">Delete Recording?</h3>
            <p className="text-slate-400 mb-6">
              This action cannot be undone. The recording will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 border-slate-700 text-slate-300"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  const recording = recordings.find(r => r.key === deleteConfirm);
                  if (recording) handleDeleteRecording(recording);
                }}
                className="flex-1"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
