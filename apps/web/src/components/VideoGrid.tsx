'use client';

import { VideoCard } from './VideoCard';
import { SkeletonVideoCard } from '@vantage/ui';
import { Users, LayoutGrid } from 'lucide-react';
import { useState } from 'react';

interface VideoGridProps {
  participants: Array<{
    id: string;
    name: string;
    stream?: MediaStream;
    isLocal?: boolean;
    isSpeaking?: boolean;
    isVideoEnabled?: boolean;
    isAudioEnabled?: boolean;
    isScreenSharing?: boolean;
  }>;
  isLoading?: boolean;
  viewMode?: 'grid' | 'speaker' | 'sidebar';
  onToggleAudio?: (participantId: string) => void;
  onToggleVideo?: (participantId: string) => void;
  onPin?: (participantId: string) => void;
  onSpotlight?: (participantId: string) => void;
}

export function VideoGrid({
  participants,
  isLoading = false,
  viewMode = 'grid',
  onToggleAudio,
  onToggleVideo,
  onPin,
  onSpotlight,
}: VideoGridProps) {
  const [localViewMode, setLocalViewMode] = useState<'grid' | 'speaker' | 'sidebar'>(viewMode as 'grid' | 'speaker' | 'sidebar');

  if (isLoading) {
    return (
      <div className="w-full h-full p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonVideoCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (participants.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto">
            <Users className="h-10 w-10 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">Waiting for participants</h3>
            <p className="text-muted-foreground">
              Share the room code to invite others
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Speaker View - Highlight active speaker
  if (localViewMode === 'speaker') {
    const speaker = participants.find((p) => p.isSpeaking) || participants[0];
    const others = participants.filter((p) => p.id !== speaker.id);

    return (
      <div className="w-full h-full p-4 space-y-4">
        {/* Main Speaker */}
        <div className="w-full aspect-video">
          {speaker.stream && (
            <VideoCard
              key={speaker.id}
              stream={speaker.stream}
              peerId={speaker.id}
              name={speaker.name}
              isLocal={speaker.isLocal}
              isSpeaking={speaker.isSpeaking}
              isVideoEnabled={speaker.isVideoEnabled}
              isAudioEnabled={speaker.isAudioEnabled}
              isScreenSharing={speaker.isScreenSharing}
              onToggleAudio={() => onToggleAudio?.(speaker.id)}
              onToggleVideo={() => onToggleVideo?.(speaker.id)}
              onPin={() => onPin?.(speaker.id)}
              onSpotlight={() => onSpotlight?.(speaker.id)}
            />
          )}
        </div>

        {/* Filmstrip */}
        {others.length > 0 && (
          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
            {others.map((participant) => (
              <div key={participant.id} className="aspect-video">
                {participant.stream && (
                  <VideoCard
                    stream={participant.stream}
                    peerId={participant.id}
                    name={participant.name}
                    isLocal={participant.isLocal}
                    isSpeaking={participant.isSpeaking}
                    isVideoEnabled={participant.isVideoEnabled}
                    isAudioEnabled={participant.isAudioEnabled}
                    isScreenSharing={participant.isScreenSharing}
                    onToggleAudio={() => onToggleAudio?.(participant.id)}
                    onToggleVideo={() => onToggleVideo?.(participant.id)}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Grid View - Responsive based on participant count
  const getGridClass = (count: number) => {
    if (count <= 1) return 'grid-cols-1';
    if (count <= 4) return 'grid-cols-2';
    if (count <= 9) return 'grid-cols-3';
    if (count <= 16) return 'grid-cols-4';
    if (count <= 25) return 'grid-cols-5';
    return 'grid-cols-6';
  };

  return (
    <div className="w-full h-full p-4">
      {/* View Mode Toggle */}
      <div className="flex items-center justify-end gap-2 mb-4">
        <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-muted/50 border border-border">
          <button
            onClick={() => setLocalViewMode('grid')}
            className={`p-2 rounded transition-colors ${
              localViewMode === 'grid' ? 'bg-primary text-white' : 'hover:bg-muted'
            }`}
            title="Grid View"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setLocalViewMode('speaker')}
            className={`p-2 rounded transition-colors ${
              localViewMode === ('speaker' as any) ? 'bg-primary text-white' : 'hover:bg-muted'
            }`}
            title="Speaker View"
          >
            <Users className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Video Grid */}
      <div className={`grid ${getGridClass(participants.length)} gap-4 h-[calc(100%-4rem)]`}>
        {participants.filter(p => p.stream).map((participant) => (
          <VideoCard
            key={participant.id}
            stream={participant.stream!}
            peerId={participant.id}
            name={participant.name}
            isLocal={participant.isLocal}
            isSpeaking={participant.isSpeaking}
            isVideoEnabled={participant.isVideoEnabled}
            isAudioEnabled={participant.isAudioEnabled}
            isScreenSharing={participant.isScreenSharing}
            onToggleAudio={() => onToggleAudio?.(participant.id)}
            onToggleVideo={() => onToggleVideo?.(participant.id)}
            onPin={() => onPin?.(participant.id)}
            onSpotlight={() => onSpotlight?.(participant.id)}
          />
        ))}
      </div>
    </div>
  );
}

export default VideoGrid;
