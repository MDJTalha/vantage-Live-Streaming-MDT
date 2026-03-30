'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Avatar, Badge } from '@vantage/ui';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MoreVertical,
  Maximize,
  Image,
  User,
  X
} from 'lucide-react';
import { VirtualBackgroundPanel } from './VirtualBackgroundPanel';
import { useVirtualBackground, VirtualBackgroundOptions } from '@/hooks/useVirtualBackground';

interface VideoCardWithBackgroundProps {
  stream: MediaStream;
  peerId: string;
  name?: string;
  isLocal?: boolean;
  isSpeaking?: boolean;
  isVideoEnabled?: boolean;
  isAudioEnabled?: boolean;
  isScreenSharing?: boolean;
  onToggleAudio?: () => void;
  onToggleVideo?: () => void;
  onPin?: () => void;
  onSpotlight?: () => void;
}

export function VideoCardWithBackground({
  stream,
  peerId: _peerId,
  name = 'Participant',
  isLocal = false,
  isSpeaking = false,
  isVideoEnabled = true,
  isAudioEnabled = true,
  isScreenSharing = false,
  onToggleAudio,
  onToggleVideo,
  onPin,
  onSpotlight,
}: VideoCardWithBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [showBackgroundPanel, setShowBackgroundPanel] = useState(false);
  const [currentBackground, setCurrentBackground] = useState<{
    id: string;
    type: 'none' | 'blur' | 'image';
    blurStrength?: number;
    imageUrl?: string;
  }>({ id: 'none', type: 'none' });

  const backgroundOptions: VirtualBackgroundOptions = {
    enabled: currentBackground.type !== 'none',
    type: currentBackground.type,
    blurStrength: currentBackground.blurStrength,
    imageUrl: currentBackground.imageUrl,
  };

  const { isProcessing, error, updateBackground, disableBackground } = useVirtualBackground(
    videoRef.current,
    canvasRef.current,
    backgroundOptions
  );

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      const handleLoadedData = () => setIsLoading(false);
      videoRef.current.addEventListener('loadeddata', handleLoadedData);
      return () => {
        videoRef.current?.removeEventListener('loadeddata', handleLoadedData);
      };
    }
    return undefined;
  }, [stream]);

  const handleBackgroundChange = useCallback((options: {
    type: string;
    blurStrength?: number;
    imageUrl?: string;
  }) => {
    setCurrentBackground({
      id: options.type === 'none' ? 'none' : options.type === 'blur' ? `blur-${options.blurStrength}` : 'custom',
      type: options.type as 'none' | 'blur' | 'image',
      blurStrength: options.blurStrength,
      imageUrl: options.imageUrl,
    });

    if (options.type === 'none') {
      disableBackground();
    } else if (options.imageUrl) {
      updateBackground(options.imageUrl);
    }

    setShowBackgroundPanel(false);
  }, [disableBackground, updateBackground]);

  return (
    <div
      className={`relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl overflow-hidden shadow-xl transition-all duration-300 group ${
        isSpeaking ? 'ring-2 ring-success ring-offset-2 ring-offset-background' : ''
      } ${isScreenSharing ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Video/Canvas Container */}
      <div className="absolute inset-0">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Avatar name={name} size="md" />
              </div>
            </div>
          </div>
        ) : isVideoEnabled ? (
          <>
            {/* Hidden original video */}
            <video
              ref={videoRef}
              autoPlay
              muted={isLocal}
              playsInline
              className="hidden"
            />
            
            {/* Canvas for processed video with background */}
            <canvas
              ref={canvasRef}
              className={`w-full h-full object-cover ${isLocal && currentBackground.type !== 'none' ? '' : 'hidden'}`}
              width="640"
              height="480"
            />
            
            {/* Show original video when background is none or for remote participants */}
            {!isLocal || currentBackground.type === 'none' ? (
              <video
                ref={videoRef}
                autoPlay
                muted={isLocal}
                playsInline
                className="w-full h-full object-cover"
              />
            ) : null}

            {/* Processing indicator */}
            {isProcessing && isLocal && (
              <div className="absolute top-3 right-3 z-20">
                <Badge variant="secondary" size="sm">
                  <Image className="h-3 w-3 mr-1" />
                  Processing...
                </Badge>
              </div>
            )}

            {/* Error indicator */}
            {error && isLocal && (
              <div className="absolute top-3 right-3 z-20">
                <Badge variant="destructive" size="sm">
                  <X className="h-3 w-3 mr-1" />
                  {error}
                </Badge>
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
            <div className="text-center space-y-4">
              <Avatar name={name} size="xl" variant="gradient" />
              <div className="space-y-2">
                <p className="text-lg font-medium text-white">{name}</p>
                <p className="text-sm text-muted-foreground">Camera is off</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Screen Share Indicator */}
      {isScreenSharing && (
        <div className="absolute top-3 left-3 z-10">
          <Badge variant="success" size="sm">
            <Video className="h-3 w-3 mr-1" />
            Presenting
          </Badge>
        </div>
      )}

      {/* Top Bar - Name & Status */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10 flex items-center gap-2">
            {isLocal ? (
              <Avatar name={name} size="sm" status="online" showStatus />
            ) : (
              <Avatar name={name} size="sm" />
            )}
            <span className="text-sm font-medium text-white">
              {isLocal ? 'You' : name}
            </span>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex items-center gap-2">
          {!isAudioEnabled && (
            <Badge variant="destructive" size="sm">
              <MicOff className="h-3 w-3 mr-1" />
              Muted
            </Badge>
          )}
          {isScreenSharing && (
            <Badge variant="primary" size="sm">
              <Video className="h-3 w-3 mr-1" />
              Sharing
            </Badge>
          )}
        </div>
      </div>

      {/* Bottom Bar - Controls (Local Only) */}
      {isLocal && (onToggleAudio || onToggleVideo) && (
        <div
          className={`absolute bottom-3 left-3 right-3 flex items-center justify-center gap-2 transition-all duration-200 ${
            showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
        >
          {onToggleAudio && (
            <button
              onClick={onToggleAudio}
              className={`p-3 rounded-xl backdrop-blur-sm border transition-all duration-200 ${
                isAudioEnabled
                  ? 'bg-white/20 border-white/20 text-white hover:bg-white/30'
                  : 'bg-destructive border-destructive text-white hover:bg-destructive/80'
              }`}
              title={isAudioEnabled ? 'Mute' : 'Unmute'}
            >
              {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </button>
          )}
          {onToggleVideo && (
            <button
              onClick={onToggleVideo}
              className={`p-3 rounded-xl backdrop-blur-sm border transition-all duration-200 ${
                isVideoEnabled
                  ? 'bg-white/20 border-white/20 text-white hover:bg-white/30'
                  : 'bg-destructive border-destructive text-white hover:bg-destructive/80'
              }`}
              title={isVideoEnabled ? 'Stop Video' : 'Start Video'}
            >
              {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </button>
          )}
          
          {/* Virtual Background Button */}
          <div className="relative">
            <button
              onClick={() => setShowBackgroundPanel(!showBackgroundPanel)}
              className={`p-3 rounded-xl backdrop-blur-sm border transition-all duration-200 ${
                currentBackground.type !== 'none'
                  ? 'bg-blue-600 border-blue-500 text-white hover:bg-blue-700'
                  : 'bg-white/20 border-white/20 text-white hover:bg-white/30'
              }`}
              title="Virtual Background"
            >
              {currentBackground.type === 'blur' ? (
                <Image className="h-5 w-5" />
              ) : (
                <Image className="h-5 w-5" />
              )}
            </button>

            <VirtualBackgroundPanel
              isOpen={showBackgroundPanel}
              onClose={() => setShowBackgroundPanel(false)}
              onBackgroundChange={handleBackgroundChange}
              currentBackground={currentBackground as any}
            />
          </div>

          {onSpotlight && (
            <button
              onClick={onSpotlight}
              className="p-3 rounded-xl bg-white/20 backdrop-blur-sm border border-white/20 text-white hover:bg-white/30 transition-all duration-200"
              title="Spotlight"
            >
              <User className="h-5 w-5" />
            </button>
          )}
          {onPin && (
            <button
              onClick={onPin}
              className="p-3 rounded-xl bg-white/20 backdrop-blur-sm border border-white/20 text-white hover:bg-white/30 transition-all duration-200"
              title="Pin"
            >
              <Maximize className="h-5 w-5" />
            </button>
          )}
          <button className="p-3 rounded-xl bg-white/20 backdrop-blur-sm border border-white/20 text-white hover:bg-white/30 transition-all duration-200">
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}

export default VideoCardWithBackground;
