'use client';

import { useState, useEffect } from 'react';
import { Button, Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@vantage/ui';
import { Circle, Pause, Square, Download, Trash2, ExternalLink, Video } from 'lucide-react';
import { type Recording } from '@/services/RecordingService';
import { streamingService, type StreamConfig } from '@/services/StreamingService';

interface RecordingControlsProps {
  roomId: string;
  isHost: boolean;
}

export function RecordingControls({ roomId, isHost }: RecordingControlsProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [streamTime, setStreamTime] = useState(0);
  const [showStreamModal, setShowStreamModal] = useState(false);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load recordings on mount
  useEffect(() => {
    loadRecordings();
  }, []);

  // Stream configuration
  const [streamConfig, setStreamConfig] = useState<Omit<StreamConfig, 'roomId'>>({
    platform: 'youtube',
    streamKey: '',
    rtmpUrl: 'rtmp://a.rtmp.youtube.com/live2',
  });

  // Timer effect for recording
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Timer effect for streaming
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isStreaming) {
      interval = setInterval(() => {
        setStreamTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isStreaming]);

  // Format time as HH:MM:SS
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start recording
  const handleStartRecording = async () => {
    if (!isHost) return;

    try {
      setIsLoading(true);
      
      // DEMO MODE: Simulate recording start
      // In production, uncomment the API call below:
      /*
      await recordingService.startRecording({
        roomId,
        title: `Recording ${new Date().toLocaleString()}`,
        outputFormat: 'mp4',
      });
      */
      
      // Demo mode: Store recording state in localStorage
      const recordingState = {
        isRecording: true,
        startTime: Date.now(),
        roomId,
        title: `Recording ${new Date().toLocaleString()}`,
      };
      localStorage.setItem('recording-state', JSON.stringify(recordingState));
      
      setIsRecording(true);
      setRecordingTime(0);
      
      // Show success message
      alert('🔴 Recording started! (Demo Mode)\n\nIn production, this will record your meeting to the cloud.');
    } catch (error: any) {
      console.error('Failed to start recording:', error);
      // Fallback to demo mode
      setIsRecording(true);
      setRecordingTime(0);
      alert('🔴 Recording started in Demo Mode\n\nAPI not available - recording UI demonstration only.');
    } finally {
      setIsLoading(false);
    }
  };

  // Stop recording
  const handleStopRecording = async () => {
    if (!isHost) return;

    try {
      setIsLoading(true);
      
      // DEMO MODE: Simulate recording stop and save
      // In production, uncomment the API call below:
      /*
      await recordingService.stopRecording('current-recording');
      */
      
      // Demo mode: Save recording to localStorage
      const recordingState = JSON.parse(localStorage.getItem('recording-state') || '{}');
      const duration = Math.floor((Date.now() - recordingState.startTime) / 1000);
      
      const newRecording = {
        id: 'rec-' + Date.now(),
        key: 'demo-recording-' + Date.now(),
        roomId: roomId,
        title: recordingState.title || 'Demo Recording',
        duration: duration || 60,
        size: Math.floor(Math.random() * 100000000),
        format: 'mp4',
        status: 'ready' as const,
        createdAt: new Date().toISOString(),
        meetingName: 'Demo Meeting',
      };
      
      // Save to localStorage recordings
      const existingRecordings = JSON.parse(localStorage.getItem('recordings') || '[]');
      existingRecordings.push(newRecording);
      localStorage.setItem('recordings', JSON.stringify(existingRecordings));
      
      // Clear recording state
      localStorage.removeItem('recording-state');
      
      setIsRecording(false);
      setRecordingTime(0);
      
      // Load recordings
      loadRecordings();
      
      alert(`✅ Recording saved! (Demo Mode)\n\nDuration: ${formatTime(duration)}\n\nRecording saved to your library.`);
    } catch (error: any) {
      console.error('Failed to stop recording:', error);
      setIsRecording(false);
      alert('✅ Recording stopped (Demo Mode)');
    } finally {
      setIsLoading(false);
    }
  };

  // Start streaming
  const handleStartStreaming = async () => {
    if (!isHost) return;

    try {
      setIsLoading(true);
      await streamingService.startStream({
        roomId,
        ...streamConfig,
      });
      setIsStreaming(true);
      setStreamTime(0);
      setShowStreamModal(false);
    } catch (error: any) {
      console.error('Failed to start stream:', error);
      alert(error.message || 'Failed to start stream');
    } finally {
      setIsLoading(false);
    }
  };

  // Stop streaming
  const handleStopStreaming = async () => {
    if (!isHost) return;

    try {
      setIsLoading(true);
      // In a real implementation, you'd track the streamId
      await streamingService.stopStream('current-stream');
      setIsStreaming(false);
    } catch (error: any) {
      console.error('Failed to stop stream:', error);
      alert(error.message || 'Failed to stop stream');
    } finally {
      setIsLoading(false);
    }
  };

  // Load recordings
  const loadRecordings = async () => {
    try {
      // DEMO MODE: Load from localStorage
      const localRecordings = JSON.parse(localStorage.getItem('recordings') || '[]');
      const filteredRecordings = localRecordings.filter((r: any) => r.roomId === roomId || r.meetingCode === roomId);
      setRecordings(filteredRecordings);
      
      // In production, use API:
      // const data = await recordingService.getRecordings(roomId);
      // setRecordings(data);
    } catch (error) {
      console.error('Failed to load recordings:', error);
      setRecordings([]);
    }
  };

  // Delete recording
  const handleDeleteRecording = async (key: string) => {
    if (!confirm('Are you sure you want to delete this recording?')) return;

    try {
      // DEMO MODE: Delete from localStorage
      const existingRecordings = JSON.parse(localStorage.getItem('recordings') || '[]');
      const filtered = existingRecordings.filter((r: any) => r.key !== key);
      localStorage.setItem('recordings', JSON.stringify(filtered));
      await loadRecordings();
      
      // In production, use API:
      // await recordingService.deleteRecording(key);
      
      alert('✅ Recording deleted!');
    } catch (error: any) {
      alert(error.message || 'Failed to delete recording');
    }
  };

  // Get recording URL and download
  const handleDownloadRecording = async (_key: string) => {
    try {
      // DEMO MODE: Show demo message
      alert('📥 Download Started (Demo Mode)\n\nIn production, this will download the recording file.');
      
      // In production, use API:
      // const url = await recordingService.getRecordingUrl(roomId, key);
      // window.open(url, '_blank');
    } catch (error: any) {
      alert(error.message || 'Failed to get recording URL');
    }
  };

  return (
    <div className="space-y-4">
      {/* Recording & Streaming Buttons */}
      <div className="flex gap-2">
        {isHost && (
          <>
            {/* Record Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isRecording ? 'destructive' : 'secondary'}
                    size="lg"
                    onClick={isRecording ? handleStopRecording : handleStartRecording}
                    disabled={isLoading}
                    className="h-10 px-3"
                  >
                    {isRecording ? (
                      <>
                        <Pause className="h-4 w-4 mr-2" />
                        Stop
                      </>
                    ) : (
                      <>
                        <Circle className="h-4 w-4 mr-2" />
                        Record
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isRecording ? 'Stop Recording' : 'Start Recording'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Stream Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isStreaming ? 'destructive' : 'secondary'}
                    size="lg"
                    onClick={() => isStreaming ? handleStopStreaming() : setShowStreamModal(true)}
                    disabled={isLoading}
                    className="h-10 px-3"
                  >
                    {isStreaming ? (
                      <>
                        <Square className="h-4 w-4 mr-2" />
                        End Stream
                      </>
                    ) : (
                      <>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Go Live
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isStreaming ? 'End Live Stream' : 'Start Live Stream'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </>
        )}
      </div>

      {/* Recording Indicator */}
      {isRecording && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 animate-pulse">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm font-medium text-red-500">Recording</span>
          <span className="text-xs text-red-400 font-mono">{formatTime(recordingTime)}</span>
        </div>
      )}

      {/* Streaming Indicator */}
      {isStreaming && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-sm font-medium text-blue-500">Live Streaming</span>
          <span className="text-xs text-blue-400 font-mono">{formatTime(streamTime)}</span>
        </div>
      )}

      {/* Recordings List */}
      {recordings.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-white">Recordings</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {recordings.map((recording) => (
              <div
                key={recording.id}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-800 border border-slate-700"
              >
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-amber-400" />
                  <div>
                    <p className="text-xs font-medium text-white truncate max-w-[150px]">
                      {recording.title}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatTime(recording.duration)} • {recording.format.toUpperCase()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownloadRecording(recording.key)}
                    className="h-7 w-7 p-0"
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteRecording(recording.key)}
                    className="h-7 w-7 p-0 text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stream Configuration Modal */}
      {showStreamModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">Start Live Stream</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Platform
                </label>
                <select
                  value={streamConfig.platform}
                  onChange={(e) => setStreamConfig({
                    ...streamConfig,
                    platform: e.target.value as StreamConfig['platform'],
                    rtmpUrl: e.target.value === 'youtube'
                      ? 'rtmp://a.rtmp.youtube.com/live2'
                      : e.target.value === 'twitch'
                      ? 'rtmp://live.twitch.tv/app'
                      : streamConfig.rtmpUrl,
                  })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                >
                  <option value="youtube">YouTube</option>
                  <option value="twitch">Twitch</option>
                  <option value="facebook">Facebook</option>
                  <option value="custom">Custom RTMP</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Stream Key
                </label>
                <input
                  type="password"
                  value={streamConfig.streamKey}
                  onChange={(e) => setStreamConfig({ ...streamConfig, streamKey: e.target.value })}
                  placeholder="Enter your stream key"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  RTMP URL
                </label>
                <input
                  type="text"
                  value={streamConfig.rtmpUrl}
                  onChange={(e) => setStreamConfig({ ...streamConfig, rtmpUrl: e.target.value })}
                  placeholder="rtmp://..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder:text-slate-500"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowStreamModal(false)}
                  className="flex-1 border-slate-700 text-slate-300"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleStartStreaming}
                  disabled={!streamConfig.streamKey || isLoading}
                  className="flex-1 bg-amber-600 hover:bg-amber-500 text-white"
                >
                  Start Streaming
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RecordingControls;
