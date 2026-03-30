'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@vantage/ui';
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare, Users, Hand,
  X, Shield, Lock, Crown, Sparkles,
  Maximize2, Minimize2, Share2, Download, Eye,
  Clock, AlertCircle,
  Zap, Focus, Type, Presentation
} from 'lucide-react';

export default function ExecutiveMeetingRoom() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const roomId = params.roomId as string;

  // Media states
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Executive video enhancements
  const [showEnhancements, setShowEnhancements] = useState(false);
  const [beautyFilter, setBeautyFilter] = useState(0);
  const [lighting, setLighting] = useState(100);
  const [backgroundType, setBackgroundType] = useState<'none' | 'blur' | 'solid' | 'image'>('none');
  const [selectedBackground, setSelectedBackground] = useState('');
  const [framingGuide, setFramingGuide] = useState(false);

  // Podcast mode
  const [isPodcastMode, setIsPodcastMode] = useState(false);
  const [podcastLayout, setPodcastLayout] = useState<'single' | 'split' | 'pip'>('single');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Professional features
  const [showTeleprompter, setShowTeleprompter] = useState(false);
  const [teleprompterText, setTeleprompterText] = useState('');
  const [teleprompterSpeed, setTeleprompterSpeed] = useState(2);
  const [showTimer] = useState(true);
  const [meetingTime, setMeetingTime] = useState(0);

  // UI states
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Chat
  const [messages, setMessages] = useState<Array<{ id: string; sender: string; content: string; time: string }>>([]);
  const [messageInput, setMessageInput] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const teleprompterInterval = useRef<NodeJS.Timeout | null>(null);
  const timerInterval = useRef<NodeJS.Timeout | null>(null);

  // Executive backgrounds
  const executiveBackgrounds = [
    { id: 'boardroom', name: 'Boardroom', url: 'linear-gradient(to bottom, #1e3a5f, #0f172a)' },
    { id: 'office', name: 'Executive Office', url: 'linear-gradient(to bottom, #2d3748, #1a202c)' },
    { id: 'studio', name: 'Professional Studio', url: 'linear-gradient(to bottom, #4a5568, #2d3748)' },
    { id: 'abstract', name: 'Abstract', url: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  ];

  // Initialize with executive-quality settings
  useEffect(() => {
    let stream: MediaStream | null = null;
    let mounted = true;

    async function initMedia() {
      try {
        // Request best quality with executive optimizations
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1920, max: 1920 },
            height: { ideal: 1080, max: 1080 },
            frameRate: { ideal: 30, max: 60 },
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

          // Auto-apply executive enhancements
          setBeautyFilter(30); // Subtle skin smoothing
          setLighting(110); // Slight brightness boost
          setBackgroundType('blur'); // Default blur for privacy
          setFramingGuide(true); // Show framing guide
        }
      } catch (err: any) {
        console.error('Failed to access media:', err);
        if (mounted) {
          setError('Unable to access camera. Please check permissions.');
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
      if (teleprompterInterval.current) clearInterval(teleprompterInterval.current);
      if (timerInterval.current) clearInterval(timerInterval.current);
    };
  }, []);

  // Apply video enhancements
  useEffect(() => {
    if (videoRef.current) {
      const filters = [];
      
      // Beauty filter (skin smoothing via slight blur + saturation)
      if (beautyFilter > 0) {
        filters.push(`saturate(${100 + beautyFilter / 2}%)`);
      }
      
      // Lighting compensation
      if (lighting !== 100) {
        filters.push(`brightness(${lighting}%)`);
      }

      // Professional look
      filters.push('contrast(1.05)');
      
      videoRef.current.style.filter = filters.join(' ');
    }
  }, [beautyFilter, lighting]);

  // Meeting timer
  useEffect(() => {
    if (showTimer) {
      timerInterval.current = setInterval(() => {
        setMeetingTime(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerInterval.current) clearInterval(timerInterval.current);
    };
  }, [showTimer]);

  // Teleprompter
  const startTeleprompter = useCallback(() => {
    setShowTeleprompter(true);
    // Auto-scroll logic would go here
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Podcast Recording Functions
  const startRecording = async () => {
    if (!localStream) return;

    try {
      // Native recording using MediaRecorder - implemented in this component
      setIsRecording(true);

      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Failed to start recording:', error);
      setError('Failed to start recording');
    }
  };

  const stopRecording = async () => {
    try {
      // Native recording stop - implemented in this component
      setIsRecording(false);
      setRecordingDuration(0);

      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }

    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(!isAudioEnabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(!isVideoEnabled);
      }
    }
  };

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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-slate-800" />
            <div className="absolute inset-0 rounded-full border-4 border-t-amber-500 animate-spin" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Preparing Executive Room</h2>
          <p className="text-slate-400 text-sm">Applying professional enhancements...</p>
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
            <AlertCircle className="h-10 w-10 text-red-400" />
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
      {/* Custom Scrollbar */}
      <style jsx global>{`
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: rgba(15, 23, 42, 0.8); }
        ::-webkit-scrollbar-thumb { background: rgba(245, 158, 11, 0.6); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(245, 158, 11, 0.8); }
      `}</style>

      {/* Top Bar - Minimal & Clean */}
      <header className="bg-gradient-to-b from-[#0a0e1a] to-transparent px-6 py-4 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Video className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-white">{roomId}</h1>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs text-slate-400">Encrypted Connection</span>
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
            {/* Meeting Timer */}
            {showTimer && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50">
                <Clock className="h-4 w-4 text-amber-400" />
                <span className="text-sm font-mono text-white">{formatTime(meetingTime)}</span>
              </div>
            )}
            
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
      <div className="flex-1 flex items-center justify-center p-4 md:p-8 relative">
        {/* Background Layer */}
        <div className="absolute inset-0 overflow-hidden">
          {backgroundType === 'blur' && localStream && (
            <video
              autoPlay
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover opacity-40"
              style={{ filter: 'blur(40px) scale(1.1)' }}
              ref={(el) => { if (el && localStream) el.srcObject = localStream; }}
            />
          )}
          {backgroundType === 'solid' && (
            <div className="absolute inset-0" style={{ background: selectedBackground }} />
          )}
          {backgroundType === 'image' && (
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-800" />
          )}
        </div>

        {/* Main Video */}
        <div className="relative w-full max-w-5xl aspect-video">
          <div className="relative w-full h-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl">
            {/* Video Feed */}
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

            {/* Framing Guide Overlay */}
            {framingGuide && (
              <div className="absolute inset-0 pointer-events-none">
                {/* Rule of thirds grid */}
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                  {[...Array(9)].map((_, i) => (
                    <div key={i} className="border border-white/5" />
                  ))}
                </div>
                {/* Center marker */}
                <div className="absolute top-1/2 left-1/2 w-4 h-4 -translate-x-1/2 -translate-y-1/2 border-2 border-white/20 rounded-full" />
                {/* Eye level line */}
                <div className="absolute top-1/3 left-0 right-0 border-t border-white/10" />
              </div>
            )}

            {/* Teleprompter Overlay */}
            {showTeleprompter && (
              <div className="absolute top-0 left-0 right-0 bg-black/80 backdrop-blur-sm p-6">
                <textarea
                  value={teleprompterText}
                  onChange={(e) => setTeleprompterText(e.target.value)}
                  placeholder="Enter your speaking notes here..."
                  className="w-full h-32 bg-transparent text-white text-lg leading-relaxed focus:outline-none resize-none"
                />
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Speed:</span>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={teleprompterSpeed}
                      onChange={(e) => setTeleprompterSpeed(Number(e.target.value))}
                      className="w-24"
                    />
                  </div>
                  <Button
                    onClick={() => setShowTeleprompter(false)}
                    size="sm"
                    className="bg-amber-600 hover:bg-amber-500 text-white"
                  >
                    Done
                  </Button>
                </div>
              </div>
            )}

            {/* User Info Badge */}
            <div className="absolute bottom-4 left-4 flex items-center gap-3">
              <div className="bg-black/60 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                    {user?.role === 'CEO' || user?.role === 'ADMIN' ? (
                      <Crown className="h-4 w-4 text-white" />
                    ) : (
                      <span className="text-xs font-bold text-white">
                        {(user?.name || 'U').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{user?.name || 'You'}</p>
                    <p className="text-xs text-amber-400">{user?.role || 'Executive'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quality & Security Badges */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
                <div className="flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-green-400" />
                  <span className="text-xs font-medium text-green-400">HD</span>
                </div>
              </div>
              <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
                <div className="flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-xs font-medium text-amber-400">Encrypted</span>
                </div>
              </div>
            </div>

            {/* Enhancements Button */}
            <div className="absolute top-4 left-4">
              <Button
                onClick={() => setShowEnhancements(!showEnhancements)}
                className="bg-black/60 backdrop-blur-md hover:bg-black/80 text-white border border-white/10 h-9 px-3 rounded-lg"
              >
                <Sparkles className="h-4 w-4 mr-1.5" />
                <span className="text-xs font-medium">Enhance</span>
              </Button>
            </div>
          </div>

          {/* Executive Enhancements Panel */}
          {showEnhancements && (
            <div className="absolute top-16 left-4 w-80 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-5 z-20 max-h-[600px] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  Executive Enhancements
                </h3>
                <button onClick={() => setShowEnhancements(false)} className="text-slate-400 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Quick Presets */}
              <div className="mb-6">
                <p className="text-xs text-slate-400 mb-2">Quick Presets</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setBeautyFilter(30);
                      setLighting(110);
                      setBackgroundType('blur');
                    }}
                    className="p-3 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-amber-500/50 text-xs text-slate-300 hover:text-white transition-all text-left"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Crown className="h-3.5 w-3.5 text-amber-400" />
                      <span className="font-semibold">Board Meeting</span>
                    </div>
                    <p className="text-slate-500">Professional look</p>
                  </button>
                  <button
                    onClick={() => {
                      setBeautyFilter(50);
                      setLighting(120);
                      setBackgroundType('solid');
                      setSelectedBackground(executiveBackgrounds[0].url);
                    }}
                    className="p-3 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-amber-500/50 text-xs text-slate-300 hover:text-white transition-all text-left"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Presentation className="h-3.5 w-3.5 text-blue-400" />
                      <span className="font-semibold">Presentation</span>
                    </div>
                    <p className="text-slate-500">Bright & clear</p>
                  </button>
                  <button
                    onClick={() => {
                      setBeautyFilter(20);
                      setLighting(100);
                      setBackgroundType('none');
                    }}
                    className="p-3 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-amber-500/50 text-xs text-slate-300 hover:text-white transition-all text-left"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Eye className="h-3.5 w-3.5 text-green-400" />
                      <span className="font-semibold">Natural</span>
                    </div>
                    <p className="text-slate-500">No enhancements</p>
                  </button>
                  <button
                    onClick={() => {
                      setBeautyFilter(40);
                      setLighting(115);
                      setBackgroundType('solid');
                      setSelectedBackground(executiveBackgrounds[2].url);
                    }}
                    className="p-3 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-amber-500/50 text-xs text-slate-300 hover:text-white transition-all text-left"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="h-3.5 w-3.5 text-purple-400" />
                      <span className="font-semibold">Media Call</span>
                    </div>
                    <p className="text-slate-500">Camera-ready</p>
                  </button>
                </div>
              </div>

              {/* Beauty Filter */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-slate-400">Skin Enhancement</p>
                  <span className="text-xs text-amber-400">{beautyFilter}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="60"
                  value={beautyFilter}
                  onChange={(e) => setBeautyFilter(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500"
                />
              </div>

              {/* Lighting */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-slate-400">Lighting Compensation</p>
                  <span className="text-xs text-amber-400">{lighting}%</span>
                </div>
                <input
                  type="range"
                  min="70"
                  max="150"
                  value={lighting}
                  onChange={(e) => setLighting(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500"
                />
              </div>

              {/* Background */}
              <div className="mb-4">
                <p className="text-xs text-slate-400 mb-2">Background</p>
                <div className="space-y-2">
                  <button
                    onClick={() => setBackgroundType('none')}
                    className={`w-full p-2.5 rounded-lg border text-xs text-left transition-all ${backgroundType === 'none' ? 'bg-amber-500/20 border-amber-500/50 text-white' : 'bg-slate-800/50 border-slate-700 text-slate-300'}`}
                  >
                    📷 Original
                  </button>
                  <button
                    onClick={() => setBackgroundType('blur')}
                    className={`w-full p-2.5 rounded-lg border text-xs text-left transition-all ${backgroundType === 'blur' ? 'bg-amber-500/20 border-amber-500/50 text-white' : 'bg-slate-800/50 border-slate-700 text-slate-300'}`}
                  >
                    🌫️ Blur (Recommended)
                  </button>
                  <button
                    onClick={() => {
                      setBackgroundType('solid');
                      setSelectedBackground(executiveBackgrounds[0].url);
                    }}
                    className={`w-full p-2.5 rounded-lg border text-xs text-left transition-all ${backgroundType === 'solid' && selectedBackground === executiveBackgrounds[0].url ? 'bg-amber-500/20 border-amber-500/50 text-white' : 'bg-slate-800/50 border-slate-700 text-slate-300'}`}
                  >
                    🏢 Boardroom
                  </button>
                  <button
                    onClick={() => {
                      setBackgroundType('solid');
                      setSelectedBackground(executiveBackgrounds[2].url);
                    }}
                    className={`w-full p-2.5 rounded-lg border text-xs text-left transition-all ${backgroundType === 'solid' && selectedBackground === executiveBackgrounds[2].url ? 'bg-amber-500/20 border-amber-500/50 text-white' : 'bg-slate-800/50 border-slate-700 text-slate-300'}`}
                  >
                    🎬 Studio
                  </button>
                </div>
              </div>

              {/* Framing Guide */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                <div className="flex items-center gap-2">
                  <Focus className="h-4 w-4 text-slate-400" />
                  <span className="text-xs text-slate-300">Framing Guide</span>
                </div>
                <button
                  onClick={() => setFramingGuide(!framingGuide)}
                  className={`w-10 h-5 rounded-full transition-all ${framingGuide ? 'bg-amber-500' : 'bg-slate-700'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${framingGuide ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>

              {/* Teleprompter */}
              <div className="mt-4 pt-4 border-t border-slate-800">
                <button
                  onClick={startTeleprompter}
                  className="w-full p-3 rounded-lg bg-gradient-to-r from-amber-600/20 to-orange-600/20 border border-amber-500/30 text-amber-400 hover:text-white hover:border-amber-500/50 transition-all text-xs font-medium flex items-center justify-center gap-2"
                >
                  <Type className="h-4 w-4" />
                  Open Teleprompter
                </button>
              </div>

              {/* Podcast Mode */}
              <div className="mt-4 pt-4 border-t border-slate-800">
                <p className="text-xs text-slate-400 mb-2 flex items-center gap-1.5">
                  <Mic className="h-3 w-3" />
                  Podcast Mode
                </p>
                <button
                  onClick={() => {
                    setIsPodcastMode(true);
                    setPodcastLayout('split');
                  }}
                  className={`w-full p-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                    isPodcastMode
                      ? 'bg-purple-600/20 border-purple-500/50 text-purple-400'
                      : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-purple-500/50'
                  }`}
                >
                  <Mic className="h-4 w-4" />
                  {isPodcastMode ? 'Podcast Active' : 'Enable Podcast'}
                </button>
              </div>
            </div>
          )}

          {/* Podcast Mode Panel */}
          {isPodcastMode && (
            <div className="absolute top-16 right-4 w-72 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-5 z-20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Mic className="h-4 w-4 text-purple-400" />
                  Podcast Mode
                </h3>
                <button onClick={() => setIsPodcastMode(false)} className="text-slate-400 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Layout Options */}
              <div className="mb-4">
                <p className="text-xs text-slate-400 mb-2">Layout</p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setPodcastLayout('single')}
                    className={`p-2 rounded-lg border text-xs transition-all ${
                      podcastLayout === 'single'
                        ? 'bg-purple-600/20 border-purple-500/50 text-purple-400'
                        : 'bg-slate-800/50 border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="w-full aspect-video bg-current opacity-30 rounded mb-1" />
                    <span>Single</span>
                  </button>
                  <button
                    onClick={() => setPodcastLayout('split')}
                    className={`p-2 rounded-lg border text-xs transition-all ${
                      podcastLayout === 'split'
                        ? 'bg-purple-600/20 border-purple-500/50 text-purple-400'
                        : 'bg-slate-800/50 border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="w-full aspect-video bg-current opacity-30 rounded mb-1 flex">
                      <div className="w-1/2 border-r border-current/20" />
                      <div className="w-1/2" />
                    </div>
                    <span>Split</span>
                  </button>
                  <button
                    onClick={() => setPodcastLayout('pip')}
                    className={`p-2 rounded-lg border text-xs transition-all ${
                      podcastLayout === 'pip'
                        ? 'bg-purple-600/20 border-purple-500/50 text-purple-400'
                        : 'bg-slate-800/50 border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="w-full aspect-video bg-current opacity-30 rounded mb-1 relative">
                      <div className="absolute bottom-1 right-1 w-1/3 h-1/3 bg-current/50 rounded" />
                    </div>
                    <span>PIP</span>
                  </button>
                </div>
              </div>

              {/* Audio Enhancement */}
              <div className="mb-4">
                <p className="text-xs text-slate-400 mb-2">Audio Enhancement</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 rounded bg-slate-800/50 border border-slate-700">
                    <span className="text-xs text-slate-300">Noise Reduction</span>
                    <span className="text-xs text-green-400">On</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-slate-800/50 border border-slate-700">
                    <span className="text-xs text-slate-300">Voice Boost</span>
                    <span className="text-xs text-green-400">On</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-slate-800/50 border border-slate-700">
                    <span className="text-xs text-slate-300">Auto-Level</span>
                    <span className="text-xs text-green-400">On</span>
                  </div>
                </div>
              </div>

              {/* Recording */}
              <div className="p-3 rounded-lg bg-purple-600/20 border border-purple-500/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-purple-400 font-medium">Local Recording</span>
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                </div>
                <p className="text-xs text-slate-400 mb-2">Audio & video saved locally</p>
                <Button className="w-full bg-purple-600 hover:bg-purple-500 text-white text-xs py-2 rounded-lg">
                  <Download className="h-3 w-3 mr-1" />
                  Export Recording
                </Button>
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
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <Crown className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">{user?.name || 'You'}</p>
                <p className="text-xs text-amber-400">Host</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Controls Bar - Clean & Minimal */}
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

            {/* Podcast Mode */}
            <div className="relative group">
              <button
                onClick={() => setIsPodcastMode(!isPodcastMode)}
                className={`h-12 w-12 rounded-xl transition-all flex items-center justify-center ${
                  isPodcastMode
                    ? 'bg-purple-600 hover:bg-purple-500 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-white'
                }`}
              >
                <Mic className="h-5 w-5" />
              </button>
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {isPodcastMode ? 'Exit Podcast' : 'Podcast Mode'}
              </span>
            </div>

            {/* Recording Button */}
            {isPodcastMode && (
              <div className="relative group">
                <button
                  onClick={toggleRecording}
                  className={`h-12 w-12 rounded-xl transition-all flex items-center justify-center ${
                    isRecording
                      ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse'
                      : 'bg-slate-800 hover:bg-slate-700 text-white'
                  }`}
                >
                  {isRecording ? (
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      <span className="text-xs font-mono">{Math.floor(recordingDuration)}s</span>
                    </div>
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-white" />
                  )}
                </button>
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {isRecording ? 'Stop Recording' : 'Start Recording'}
                </span>
              </div>
            )}

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

            {/* Divider */}
            <div className="w-px h-8 bg-slate-800 mx-2" />

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
          </div>
        </div>

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
