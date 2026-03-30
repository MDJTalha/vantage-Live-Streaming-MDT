'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useMediaRecorder } from '@/hooks/useMediaRecorder';
import podcastService from '@/services/PodcastService';
import { ArrowLeft, Mic, Video, Plus, X, Check, AlertCircle } from 'lucide-react';

export default function NewEpisodePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState<'setup' | 'recording' | 'complete'>('setup');
  const [episodeTitle, setEpisodeTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isVideo, setIsVideo] = useState(true);
  const [guests, setGuests] = useState<string[]>([]);
  const [newGuest, setNewGuest] = useState('');
  const [recordingResult, setRecordingResult] = useState<{ url: string; duration: number; size: number } | null>(null);

  const {
    isRecording,
    isPaused,
    duration,
    error: recordingError,
    startRecording,
    stopRecording,
    toggleRecording,
    formatDuration,
    videoRef,
  } = useMediaRecorder(isVideo ? 'video' : 'audio');

  const handleAddGuest = () => {
    if (newGuest.trim() && !guests.includes(newGuest.trim())) {
      setGuests([...guests, newGuest.trim()]);
      setNewGuest('');
    }
  };

  const handleRemoveGuest = (guest: string) => {
    setGuests(guests.filter(g => g !== guest));
  };

  const handleStartRecording = async () => {
    if (!episodeTitle.trim()) {
      alert('Please enter an episode title');
      return;
    }
    if (!user) {
      alert('You must be logged in to record');
      return;
    }
    
    try {
      // Create episode in draft state first
      await podcastService.createEpisode({
        title: episodeTitle,
        description,
        recordingType: isVideo ? 'video' : 'audio',
        guests,
        hostId: user.id,
        hostName: user.name,
      });

      // Start recording
      await startRecording();
      setStep('recording');
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Failed to start recording. Please check permissions.');
    }
  };

  const handleFinishRecording = async () => {
    try {
      const result = await stopRecording();
      setRecordingResult(result);
      setStep('complete');
    } catch (error) {
      console.error('Failed to stop recording:', error);
      alert('Failed to save recording');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/podcast')}
                className="p-2 text-slate-500 hover:text-slate-300 hover:bg-slate-900 rounded-md transition-all"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                  <Mic className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h1 className="text-sm font-medium text-slate-300">New Episode</h1>
                  <p className="text-xs text-slate-600">Create a new podcast episode</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {step === 'setup' && (
          <div className="max-w-2xl mx-auto">
            <div className="rounded-lg bg-slate-900/50 border border-slate-800 p-8">
              <h2 className="text-lg font-medium text-slate-300 mb-6">Episode Setup</h2>

              {/* Episode Title */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Episode Title *
                </label>
                <input
                  type="text"
                  value={episodeTitle}
                  onChange={(e) => setEpisodeTitle(e.target.value)}
                  placeholder="e.g., Episode 4: The Future of AI"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-md text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 transition-all"
                  autoFocus
                />
              </div>

              {/* Description */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What will you discuss in this episode?"
                  rows={4}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-md text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 transition-all resize-none"
                />
              </div>

              {/* Recording Type */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Recording Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setIsVideo(true)}
                    className={`p-4 rounded-lg border transition-all text-left ${
                      isVideo
                        ? 'bg-purple-500/10 border-purple-500/50'
                        : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-md flex items-center justify-center ${
                        isVideo ? 'bg-purple-500/20' : 'bg-slate-700'
                      }`}>
                        <Video className={`h-5 w-5 ${isVideo ? 'text-purple-400' : 'text-slate-400'}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-300">Video Podcast</p>
                        <p className="text-xs text-slate-500">Video + Audio</p>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => setIsVideo(false)}
                    className={`p-4 rounded-lg border transition-all text-left ${
                      !isVideo
                        ? 'bg-purple-500/10 border-purple-500/50'
                        : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-md flex items-center justify-center ${
                        !isVideo ? 'bg-purple-500/20' : 'bg-slate-700'
                      }`}>
                        <Mic className={`h-5 w-5 ${!isVideo ? 'text-purple-400' : 'text-slate-400'}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-300">Audio Only</p>
                        <p className="text-xs text-slate-500">Audio podcast</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Guests */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Guests (Optional)
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newGuest}
                    onChange={(e) => setNewGuest(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddGuest()}
                    placeholder="Add guest name or email"
                    className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-md text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 transition-all"
                  />
                  <button
                    onClick={handleAddGuest}
                    className="px-4 py-2 text-sm font-medium rounded-md bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-300 hover:border-slate-600 transition-all flex items-center gap-1.5"
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </button>
                </div>
                {guests.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {guests.map((guest) => (
                      <span
                        key={guest}
                        className="px-3 py-1.5 text-xs font-medium rounded-md bg-slate-800 border border-slate-700 text-slate-400 flex items-center gap-1.5"
                      >
                        {guest}
                        <button
                          onClick={() => handleRemoveGuest(guest)}
                          className="text-slate-500 hover:text-slate-300"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => router.push('/podcast')}
                  className="flex-1 px-4 py-2 text-sm font-medium rounded-md bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-300 hover:border-slate-600 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStartRecording}
                  className="flex-1 px-4 py-2 text-sm font-medium rounded-md bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:opacity-90 transition-all"
                >
                  Start Recording
                </button>
              </div>
            </div>

            {/* Tips */}
            <div className="mt-6 p-4 rounded-lg bg-slate-900/30 border border-slate-800">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-slate-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-400 mb-1">Recording Tips</p>
                  <ul className="text-xs text-slate-500 space-y-1">
                    <li>• Use a quiet environment for best audio quality</li>
                    <li>• Test your microphone before starting</li>
                    <li>• Ensure good lighting for video podcasts</li>
                    <li>• Invite guests at least 5 minutes early</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 'recording' && (
          <div className="max-w-4xl mx-auto">
            <div className="rounded-lg bg-slate-900/50 border border-slate-800 p-6">
              {/* Video Preview */}
              {isVideo && (
                <div className="relative w-full aspect-video bg-slate-950 rounded-lg overflow-hidden mb-6">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  {isPaused && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <p className="text-slate-300 text-lg">Paused</p>
                    </div>
                  )}
                </div>
              )}

              {/* Audio Visualization Placeholder */}
              {!isVideo && (
                <div className="w-full aspect-video bg-slate-950 rounded-lg flex items-center justify-center mb-6">
                  <div className={`w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center ${isRecording ? 'animate-pulse' : ''}`}>
                    <Mic className="h-16 w-16 text-white" />
                  </div>
                </div>
              )}

              {/* Recording Info */}
              <div className="text-center mb-6">
                <h2 className="text-xl font-medium text-slate-300 mb-2">
                  {isPaused ? 'Recording Paused' : 'Recording in Progress'}
                </h2>
                <p className="text-sm text-slate-500 mb-4">"{episodeTitle}"</p>
                <div className="text-5xl font-mono text-slate-300">
                  {formatDuration(duration)}
                </div>
              </div>

              {/* Error Display */}
              {recordingError && (
                <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                  <p className="text-sm text-red-400">{recordingError}</p>
                </div>
              )}

              {/* Controls */}
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to cancel? Recording will be lost.')) {
                      setStep('setup');
                    }
                  }}
                  className="px-6 py-2 text-sm font-medium rounded-md bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-300 hover:border-slate-600 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={toggleRecording}
                  className={`px-6 py-2 text-sm font-medium rounded-md transition-all ${
                    isPaused
                      ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                      : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-300 hover:border-slate-600'
                  }`}
                >
                  {isPaused ? 'Resume' : 'Pause'}
                </button>
                <button
                  onClick={handleFinishRecording}
                  className="px-6 py-2 text-sm font-medium rounded-md bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:opacity-90 transition-all flex items-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  Finish
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 'complete' && recordingResult && (
          <div className="max-w-2xl mx-auto">
            <div className="rounded-lg bg-slate-900/50 border border-slate-800 p-12 text-center">
              <div className="w-24 h-24 rounded-full bg-green-500/20 border border-green-500/50 flex items-center justify-center mx-auto mb-6">
                <Check className="h-10 w-10 text-green-400" />
              </div>
              <h2 className="text-xl font-medium text-slate-300 mb-2">Recording Complete!</h2>
              <p className="text-sm text-slate-500 mb-4">"{episodeTitle}" has been saved</p>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                  <p className="text-xs text-slate-500 mb-1">Duration</p>
                  <p className="text-lg font-medium text-slate-300">{formatDuration(recordingResult.duration)}</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                  <p className="text-xs text-slate-500 mb-1">File Size</p>
                  <p className="text-lg font-medium text-slate-300">{(recordingResult.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>

              <div className="flex gap-3 justify-center mb-8">
                <a
                  href={recordingResult.url}
                  download={`podcast-${episodeTitle.replace(/[^a-z0-9]/gi, '-')}-${Date.now()}.webm`}
                  className="px-6 py-2 text-sm font-medium rounded-md bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-300 hover:border-slate-600 transition-all flex items-center gap-2"
                >
                  Download Recording
                </a>
                <button
                  onClick={async () => {
                    try {
                      // Find the episode and update it with recording
                      const episodes = await podcastService.getEpisodes(user!.id);
                      const latestEpisode = episodes[0];
                      if (latestEpisode) {
                        await podcastService.updateEpisode(latestEpisode.id, {
                          recordingUrl: recordingResult.url,
                          duration: recordingResult.duration,
                        });
                        await podcastService.publishEpisode(latestEpisode.id);
                        alert('Episode published successfully!');
                        router.push('/podcast');
                      }
                    } catch (error) {
                      console.error('Failed to publish:', error);
                      alert('Failed to publish episode');
                    }
                  }}
                  className="px-6 py-2 text-sm font-medium rounded-md bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:opacity-90 transition-all"
                >
                  Publish Now
                </button>
              </div>

              <button
                onClick={() => router.push('/podcast')}
                className="px-6 py-2 text-sm font-medium rounded-md bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-300 hover:border-slate-600 transition-all"
              >
                Back to Episodes
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
