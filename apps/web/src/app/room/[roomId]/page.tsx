'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@vantage/ui';
import { RecordingControls } from '@/components/RecordingControls';
import {
  Mic, MicOff, Video, VideoOff, Monitor, MonitorOff, PhoneOff,
  MessageSquare, Users, Hand, Settings,
  Circle, X, Sparkles, Palette,
  Volume2, VolumeX, Maximize2, Minimize2, Share2,
  Shield, Crown
} from 'lucide-react';

export default function PremiumMeetingRoom() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const roomId = params.roomId as string;

  // Media states
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Video effects
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'none' | 'blur' | 'portrait' | 'professional'>('none');
  const [backgroundBlur, setBackgroundBlur] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturate, setSaturate] = useState(100);

  // UI states
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showRecordingControls, setShowRecordingControls] = useState(false);

  // Chat
  const [messages, setMessages] = useState<Array<{ id: string; sender: string; content: string; time: string }>>([]);
  const [messageInput, setMessageInput] = useState('');

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = e.key.toLowerCase();
      
      switch (key) {
        case 'm':
          // Toggle mute/unmute
          e.preventDefault();
          toggleAudio();
          break;
        case 'v':
          // Toggle video
          e.preventDefault();
          toggleVideo();
          break;
        case 's':
          // Toggle screen share
          e.preventDefault();
          toggleScreenShare();
          break;
        case 'h':
          // Raise/lower hand
          e.preventDefault();
          setIsHandRaised(prev => !prev);
          break;
        case 'c':
          // Toggle chat
          e.preventDefault();
          setShowChat(prev => !prev);
          break;
        case 'e':
          // Send reaction
          e.preventDefault();
          // TODO: Show reaction picker
          console.log('Send reaction');
          break;
        case 'f':
          // Toggle fullscreen
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'd':
          // Toggle video filter panel
          e.preventDefault();
          setShowFilters(prev => !prev);
          break;
        case 'escape':
          // Close all panels
          e.preventDefault();
          setShowChat(false);
          setShowParticipants(false);
          setShowSettings(false);
          setShowFilters(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleAudio, toggleVideo, toggleScreenShare, toggleFullscreen]); // Dependencies for callbacks

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize camera with premium quality
  useEffect(() => {
    let stream: MediaStream | null = null;
    let mounted = true;

    async function initMedia() {
      try {
        // Request highest quality
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 3840, max: 3840 },
            height: { ideal: 2160, max: 2160 },
            frameRate: { ideal: 60, max: 60 },
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: 2,
          }
        });

        if (mounted) {
          setLocalStream(stream);
          setIsLoading(false);

          // Log actual settings
          const videoTrack = stream.getVideoTracks()[0];
          const settings = videoTrack.getSettings();
          console.log('📹 Video Quality:', {
            width: settings.width,
            height: settings.height,
            frameRate: settings.frameRate,
          });
        }
      } catch (err: any) {
        console.error('Failed to access media:', err);
        if (mounted) {
          setError(err.message || 'Failed to access camera/microphone');
          setIsLoading(false);
        }
      }
    }

    initMedia();

    return () => {
      mounted = false;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Attach stream to video
  useEffect(() => {
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Apply video filters - only color adjustments to person, blur goes to background
  useEffect(() => {
    if (videoRef.current) {
      // Only apply color adjustments to the video (person), NOT blur
      const filters = [];
      
      if (brightness !== 100) {
        filters.push(`brightness(${brightness}%)`);
      }
      if (contrast !== 100) {
        filters.push(`contrast(${contrast}%)`);
      }
      if (saturate !== 100) {
        filters.push(`saturate(${saturate}%)`);
      }
      if (selectedFilter === 'professional') {
        filters.push('saturate(0.8) contrast(1.1) brightness(1.05)');
      }
      if (selectedFilter === 'portrait') {
        filters.push('saturate(1.2) brightness(1.05) contrast(1.05)');
      }

      videoRef.current.style.filter = filters.join(' ');
    }
  }, [selectedFilter, brightness, contrast, saturate]);

  // Fullscreen handler
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const toggleAudio = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(!isAudioEnabled);
      }
    }
  }, [localStream, isAudioEnabled]);

  const toggleVideo = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(!isVideoEnabled);
      }
    }
  }, [localStream, isVideoEnabled]);

  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      window.location.reload();
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { width: { ideal: 3840 }, height: { ideal: 2160 }, frameRate: { ideal: 60 } },
          audio: true,
        });

        const screenTrack = screenStream.getVideoTracks()[0];
        if (localStream) {
          const videoTrack = localStream.getVideoTracks()[0];
          if (videoTrack) {
            localStream.removeTrack(videoTrack);
            videoTrack.stop();
          }
          localStream.addTrack(screenTrack);
          setLocalStream(localStream);
        }

        screenTrack.onended = () => {
          setIsScreenSharing(false);
        };

        setIsScreenSharing(true);
      } catch (err) {
        console.error('Screen share failed:', err);
      }
    }
  }, [isScreenSharing, localStream]);

  const toggleHand = () => {
    setIsHandRaised(!isHandRaised);
  };

  const leaveMeeting = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    router.push('/dashboard');
  };

  const sendMessage = () => {
    if (messageInput.trim()) {
      const newMessage = {
        id: Date.now().toString(),
        sender: user?.name || 'You',
        content: messageInput,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([...messages, newMessage]);
      setMessageInput('');
    }
  };

  const applyPreset = (preset: 'natural' | 'professional' | 'vibrant' | 'cinematic') => {
    switch (preset) {
      case 'natural':
        setBrightness(100);
        setContrast(100);
        setSelectedFilter('none');
        break;
      case 'professional':
        setBrightness(105);
        setContrast(110);
        setSelectedFilter('professional');
        break;
      case 'vibrant':
        setBrightness(105);
        setContrast(115);
        setSelectedFilter('portrait');
        break;
      case 'cinematic':
        setBrightness(95);
        setContrast(120);
        setSelectedFilter('none');
        break;
    }
    setShowFilters(false);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-slate-800" />
            <div className="absolute inset-0 rounded-full border-4 border-t-amber-500 animate-spin" />
            <div className="absolute inset-4 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Video className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Joining Meeting</h2>
          <p className="text-slate-400 text-sm">Setting up your camera and microphone...</p>
          <p className="text-slate-500 text-xs mt-4 font-mono">{roomId}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center mx-auto mb-6">
            <Video className="h-10 w-10 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Unable to Join</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => window.location.reload()} className="bg-amber-600 hover:bg-amber-500 text-white px-6 py-2.5 rounded-lg">
              Try Again
            </Button>
            <Button onClick={leaveMeeting} variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 px-6 py-2.5 rounded-lg">
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-screen bg-[#0a0e1a] flex flex-col overflow-hidden">
      {/* Custom Scrollbar Styles */}
      <style jsx global>{`
        /* Custom scrollbar for webkit browsers */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5);
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(245, 158, 11, 0.5);
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(245, 158, 11, 0.7);
        }
        /* Firefox scrollbar */
        * {
          scrollbar-width: thin;
          scrollbar-color: rgba(245, 158, 11, 0.5) rgba(15, 23, 42, 0.5);
        }
      `}</style>
      {/* Top Bar */}
      <header className="bg-gradient-to-b from-[#0a0e1a] to-transparent px-6 py-4 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Video className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-white">Room: {roomId}</h1>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs text-slate-400">Secure Connection</span>
                </div>
              </div>
            </div>
            {isHandRaised && (
              <div className="px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-medium flex items-center gap-1.5">
                <Hand className="h-3 w-3" />
                Hand Raised
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={toggleFullscreen}
              variant="ghost"
              className="text-slate-400 hover:text-white hover:bg-slate-800/50 h-9 w-9 rounded-lg"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <Button
              onClick={leaveMeeting}
              className="bg-red-600 hover:bg-red-500 text-white font-medium px-5 py-2.5 rounded-lg"
            >
              <PhoneOff className="h-4 w-4 mr-2" />
              Leave
            </Button>
          </div>
        </div>
      </header>

      {/* Main Video Area */}
      <div className="flex-1 flex items-center justify-center p-8 relative overflow-auto">
        {/* Background blur effect - blurred duplicate of video behind */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5" />
          {/* Blurred background layer */}
          {backgroundBlur > 0 && localStream && (
            <video
              autoPlay
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover opacity-30"
              style={{
                filter: `blur(${backgroundBlur}px)`,
                transform: 'scale(1.1)',
              }}
              ref={(el) => { if (el && localStream) el.srcObject = localStream; }}
            />
          )}
        </div>

        <div className="relative w-full max-w-6xl aspect-video">
          {/* Video Container */}
          <div className="relative w-full h-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl shadow-black/50">
            {/* Video */}
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className={`w-full h-full object-cover ${!isVideoEnabled ? 'hidden' : ''}`}
            />

            {/* Avatar when video off */}
            {!isVideoEnabled && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                <div className="w-40 h-40 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-4 border-amber-500/30 flex items-center justify-center">
                  <span className="text-7xl font-bold text-amber-400">
                    {(user?.name || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            )}

            {/* User Label */}
            <div className="absolute bottom-4 left-4 flex items-center gap-3">
              <div className="bg-black/60 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                    <span className="text-sm font-bold text-white">
                      {(user?.name || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{user?.name || 'You'}</p>
                    {/* Role removed - cleaner UI */}
                  </div>
                </div>
              </div>
              {isScreenSharing && (
                <div className="bg-blue-600/80 backdrop-blur-md px-3 py-2 rounded-xl border border-blue-400/30">
                  <div className="flex items-center gap-1.5">
                    <Monitor className="h-3.5 w-3.5 text-white" />
                    <span className="text-xs font-medium text-white">Presenting</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quality Badge */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
                <div className="flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-green-400" />
                  <span className="text-xs font-medium text-green-400">HD</span>
                </div>
              </div>
            </div>

            {/* Filters Button */}
            <div className="absolute top-4 left-4">
              <Button
                onClick={() => setShowFilters(!showFilters)}
                className="bg-black/60 backdrop-blur-md hover:bg-black/80 text-white border border-white/10 h-9 px-3 rounded-lg"
              >
                <Sparkles className="h-4 w-4 mr-1.5" />
                <span className="text-xs font-medium">Filters</span>
              </Button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="absolute top-16 left-4 w-80 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-5 z-20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Palette className="h-4 w-4 text-amber-400" />
                  Video Filters
                </h3>
                <button onClick={() => setShowFilters(false)} className="text-slate-400 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Presets */}
              <div className="mb-4">
                <p className="text-xs text-slate-400 mb-2">Presets</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => applyPreset('natural')}
                    className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-amber-500/50 text-xs text-slate-300 hover:text-white transition-all"
                  >
                    🌿 Natural
                  </button>
                  <button
                    onClick={() => applyPreset('professional')}
                    className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-amber-500/50 text-xs text-slate-300 hover:text-white transition-all"
                  >
                    💼 Professional
                  </button>
                  <button
                    onClick={() => applyPreset('vibrant')}
                    className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-amber-500/50 text-xs text-slate-300 hover:text-white transition-all"
                  >
                    ✨ Vibrant
                  </button>
                  <button
                    onClick={() => applyPreset('cinematic')}
                    className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-amber-500/50 text-xs text-slate-300 hover:text-white transition-all"
                  >
                    🎬 Cinematic
                  </button>
                </div>
              </div>

              {/* Background Blur */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-slate-400">Background Blur</p>
                  <span className="text-xs text-amber-400">{backgroundBlur}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  value={backgroundBlur}
                  onChange={(e) => setBackgroundBlur(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500"
                />
                <p className="text-xs text-slate-500 mt-1">Blurs background, keeps you sharp</p>
              </div>

              {/* Brightness */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-slate-400">Brightness</p>
                  <span className="text-xs text-amber-400">{brightness}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500"
                />
              </div>

              {/* Contrast */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-slate-400">Contrast</p>
                  <span className="text-xs text-amber-400">{contrast}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500"
                />
              </div>

              {/* Saturation */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-slate-400">Saturation</p>
                  <span className="text-xs text-amber-400">{saturate}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={saturate}
                  onChange={(e) => setSaturate(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chat Panel */}
      {showChat && (
        <div className="absolute right-0 top-0 bottom-24 w-80 bg-slate-900/95 backdrop-blur-xl border-l border-slate-800 flex flex-col z-20">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-amber-400" />
              Chat
            </h3>
            <button onClick={() => setShowChat(false)} className="text-slate-400 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <p className="text-center text-slate-500 text-sm py-8">No messages yet</p>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-amber-400">{msg.sender}</span>
                    <span className="text-xs text-slate-500">{msg.time}</span>
                  </div>
                  <p className="text-sm text-slate-300">{msg.content}</p>
                </div>
              ))
            )}
          </div>
          <div className="p-4 border-t border-slate-800">
            <div className="flex gap-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
              />
              <Button onClick={sendMessage} className="bg-amber-600 hover:bg-amber-500 text-white h-9 w-9 rounded-lg p-0">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Participants Panel */}
      {showParticipants && (
        <div className="absolute right-0 top-0 bottom-24 w-72 bg-slate-900/95 backdrop-blur-xl border-l border-slate-800 flex flex-col z-20">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Users className="h-4 w-4 text-amber-400" />
              Participants
            </h3>
            <button onClick={() => setShowParticipants(false)} className="text-slate-400 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {/* Host (You) */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <Crown className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">{user?.name || 'You'}</p>
                <p className="text-xs text-amber-400">Host</p>
              </div>
              {isAudioEnabled ? (
                <Volume2 className="h-4 w-4 text-green-400" />
              ) : (
                <VolumeX className="h-4 w-4 text-red-400" />
              )}
            </div>

            {/* Sample Participants - In real implementation, these would come from WebSocket */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                <span className="text-sm font-bold text-white">J</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">John Doe</p>
                <p className="text-xs text-slate-400">Participant</p>
              </div>
              <div className="flex items-center gap-1">
                <button className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-blue-400" title="Promote to Co-host">
                  <Crown className="h-3.5 w-3.5" />
                </button>
                <button className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-red-400" title="Remove">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                <span className="text-sm font-bold text-white">S</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">Sarah Smith</p>
                <p className="text-xs text-slate-400">Participant</p>
              </div>
              <div className="flex items-center gap-1">
                <button className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-blue-400" title="Promote to Co-host">
                  <Crown className="h-3.5 w-3.5" />
                </button>
                <button className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-red-400" title="Remove">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Controls Bar */}
      <footer className="bg-gradient-to-t from-[#0a0e1a] to-transparent px-6 py-6 z-10">
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl px-4 py-3">
            {/* Audio */}
            <div className="relative group">
              <button
                onClick={toggleAudio}
                className={`h-12 w-12 rounded-xl transition-all flex items-center justify-center ${
                  isAudioEnabled
                    ? 'bg-slate-800 hover:bg-slate-700 text-white'
                    : 'bg-red-600 hover:bg-red-500 text-white'
                }`}
              >
                {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </button>
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {isAudioEnabled ? 'Mute' : 'Unmute'}
              </span>
            </div>

            {/* Video */}
            <div className="relative group">
              <button
                onClick={toggleVideo}
                className={`h-12 w-12 rounded-xl transition-all flex items-center justify-center ${
                  isVideoEnabled
                    ? 'bg-slate-800 hover:bg-slate-700 text-white'
                    : 'bg-red-600 hover:bg-red-500 text-white'
                }`}
              >
                {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
              </button>
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {isVideoEnabled ? 'Stop Video' : 'Start Video'}
              </span>
            </div>

            {/* Screen Share */}
            <div className="relative group">
              <button
                onClick={toggleScreenShare}
                className={`h-12 w-12 rounded-xl transition-all flex items-center justify-center ${
                  isScreenSharing
                    ? 'bg-blue-600 hover:bg-blue-500 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-white'
                }`}
              >
                {isScreenSharing ? <MonitorOff className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
              </button>
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {isScreenSharing ? 'Stop Share' : 'Share Screen'}
              </span>
            </div>

            {/* Divider */}
            <div className="w-px h-8 bg-slate-800 mx-2" />

            {/* Hand */}
            <div className="relative group">
              <button
                onClick={toggleHand}
                className={`h-12 w-12 rounded-xl transition-all flex items-center justify-center ${
                  isHandRaised
                    ? 'bg-amber-600 hover:bg-amber-500 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-white'
                }`}
              >
                <Hand className="h-5 w-5" />
              </button>
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {isHandRaised ? 'Lower Hand' : 'Raise Hand'}
              </span>
            </div>

            {/* Chat */}
            <div className="relative group">
              <button
                onClick={() => setShowChat(!showChat)}
                className={`h-12 w-12 rounded-xl transition-all flex items-center justify-center ${
                  showChat
                    ? 'bg-amber-600 hover:bg-amber-500 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-white'
                }`}
              >
                <MessageSquare className="h-5 w-5" />
              </button>
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Chat
              </span>
            </div>

            {/* Participants */}
            <div className="relative group">
              <button
                onClick={() => setShowParticipants(!showParticipants)}
                className="h-12 w-12 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-all flex items-center justify-center"
              >
                <Users className="h-5 w-5" />
              </button>
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Participants
              </span>
            </div>

            {/* Settings */}
            <div className="relative group">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="h-12 w-12 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-all flex items-center justify-center"
              >
                <Settings className="h-5 w-5" />
              </button>
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Settings
              </span>
            </div>

            {/* Recording */}
            <div className="relative group">
              <button
                onClick={() => setShowRecordingControls(!showRecordingControls)}
                className={`h-12 w-12 rounded-xl transition-all flex items-center justify-center ${
                  showRecordingControls
                    ? 'bg-red-600 hover:bg-red-500 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-white'
                }`}
              >
                <Circle className="h-5 w-5" />
              </button>
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Recording
              </span>
            </div>
          </div>
        </div>

        {/* Recording Controls - Draggable Panel */}
        {showRecordingControls && (
          <RecordingControls 
            roomId={roomId as string} 
            isHost={true} 
            onClose={() => setShowRecordingControls(false)} 
          />
        )}

        {/* Settings Modal */}
        {showSettings && (
          <div className="absolute bottom-24 right-8 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden z-50">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-semibold text-white">Room Settings</h3>
              <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {/* Video Quality */}
              <div>
                <label className="block text-xs text-slate-400 mb-2">Video Quality</label>
                <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none">
                  <option>Auto (Recommended)</option>
                  <option>1080p HD</option>
                  <option>720p</option>
                  <option>480p</option>
                </select>
              </div>

              {/* Audio Input */}
              <div>
                <label className="block text-xs text-slate-400 mb-2">Microphone</label>
                <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none">
                  <option>Default Microphone</option>
                </select>
              </div>

              {/* Audio Output */}
              <div>
                <label className="block text-xs text-slate-400 mb-2">Speaker</label>
                <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none">
                  <option>Default Speaker</option>
                </select>
              </div>

              {/* Background */}
              <div>
                <label className="block text-xs text-slate-400 mb-2">Background</label>
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    onClick={() => setBackgroundBlur(0)}
                    className={`p-2 border rounded-lg text-xs transition-all ${
                      backgroundBlur === 0
                        ? 'bg-amber-600 border-amber-500 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    None
                  </button>
                  <button 
                    onClick={() => setBackgroundBlur(20)}
                    className={`p-2 border rounded-lg text-xs transition-all ${
                      backgroundBlur > 0
                        ? 'bg-amber-600 border-amber-500 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    Blur
                  </button>
                  <button 
                    onClick={() => alert('🎨 Custom Background (Demo Mode)\n\nIn production:\n• Upload custom image\n• Select virtual background\n• Green screen support')}
                    className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 hover:border-slate-500"
                  >
                    Custom
                  </button>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-800">
              <button onClick={() => setShowSettings(false)} className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg py-2 text-sm font-medium transition-all">
                Close
              </button>
            </div>
          </div>
        )}

        {/* Keyboard Shortcuts */}
        <div className="mt-8 flex items-center justify-center gap-6 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <kbd className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-400">M</kbd>
            <span>Mute</span>
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-400">V</kbd>
            <span>Video</span>
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-400">S</kbd>
            <span>Share</span>
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-400">H</kbd>
            <span>Hand</span>
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-400">C</kbd>
            <span>Chat</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
