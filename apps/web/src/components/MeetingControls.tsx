'use client';

import { Button, Badge, Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@vantage/ui';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Monitor, 
  MonitorOff,
  MessageSquare,
  Hand,
  Circle,
  PhoneOff,
  Users,
  MoreHorizontal,
  Settings,
  Smile,
  Pause
} from 'lucide-react';

interface MeetingControlsProps {
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  isChatOpen: boolean;
  isRecording: boolean;
  isHandRaised: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onToggleChat: () => void;
  onLeave: () => void;
  onRecord?: () => void;
  onRaiseHand?: () => void;
  onToggleParticipants?: () => void;
  onReactions?: () => void;
}

export function MeetingControls({
  isAudioEnabled,
  isVideoEnabled,
  isScreenSharing,
  isChatOpen,
  isRecording,
  isHandRaised,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onToggleChat,
  onLeave,
  onRecord,
  onRaiseHand,
  onToggleParticipants,
  onReactions,
}: MeetingControlsProps) {
  return (
    <footer className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-t border-gray-700 px-4 py-4">
      <div className="flex items-center justify-between">
        {/* Left Section - Main Controls */}
        <div className="flex items-center gap-2">
          <TooltipProvider>
            {/* Audio Toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isAudioEnabled ? 'secondary' : 'destructive'}
                  size="xl"
                  onClick={onToggleAudio}
                  className="w-14 h-14 rounded-2xl shadow-lg"
                >
                  {isAudioEnabled ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isAudioEnabled ? 'Mute (M)' : 'Unmute (M)'}
              </TooltipContent>
            </Tooltip>

            {/* Video Toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isVideoEnabled ? 'secondary' : 'destructive'}
                  size="xl"
                  onClick={onToggleVideo}
                  className="w-14 h-14 rounded-2xl shadow-lg"
                >
                  {isVideoEnabled ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isVideoEnabled ? 'Stop Video (V)' : 'Start Video (V)'}
              </TooltipContent>
            </Tooltip>

            {/* Screen Share */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isScreenSharing ? 'primary' : 'secondary'}
                  size="xl"
                  onClick={onToggleScreenShare}
                  className="w-14 h-14 rounded-2xl shadow-lg"
                >
                  {isScreenSharing ? <MonitorOff className="h-6 w-6" /> : <Monitor className="h-6 w-6" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isScreenSharing ? 'Stop Sharing (S)' : 'Share Screen (S)'}
              </TooltipContent>
            </Tooltip>

            {/* Raise Hand */}
            {onRaiseHand && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isHandRaised ? 'primary' : 'secondary'}
                    size="xl"
                    onClick={onRaiseHand}
                    className="w-14 h-14 rounded-2xl shadow-lg"
                  >
                    <Hand className="h-6 w-6" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isHandRaised ? 'Lower Hand' : 'Raise Hand (H)'}
                </TooltipContent>
              </Tooltip>
            )}

            {/* Reactions */}
            {onReactions && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="xl"
                    onClick={onReactions}
                    className="w-14 h-14 rounded-2xl shadow-lg"
                  >
                    <Smile className="h-6 w-6" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Send Reaction (E)
                </TooltipContent>
              </Tooltip>
            )}
          </TooltipProvider>
        </div>

        {/* Center Section - Recording Indicator */}
        <div className="flex items-center gap-4">
          {isRecording && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-destructive/20 border border-destructive/30 animate-pulse">
              <div className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
              <span className="text-sm font-medium text-destructive">Recording</span>
              <span className="text-xs text-destructive/70">00:00:00</span>
            </div>
          )}
        </div>

        {/* Right Section - Additional Controls */}
        <div className="flex items-center gap-2">
          <TooltipProvider>
            {/* Participants */}
            {onToggleParticipants && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="xl"
                    onClick={onToggleParticipants}
                    className="w-14 h-14 rounded-2xl shadow-lg relative"
                  >
                    <Users className="h-6 w-6" />
                    <Badge variant="primary" size="sm" className="absolute -top-1 -right-1">
                      12
                    </Badge>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Participants
                </TooltipContent>
              </Tooltip>
            )}

            {/* Chat */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isChatOpen ? 'primary' : 'secondary'}
                  size="xl"
                  onClick={onToggleChat}
                  className="w-14 h-14 rounded-2xl shadow-lg relative"
                >
                  <MessageSquare className="h-6 w-6" />
                  <Badge variant="destructive" size="sm" className="absolute -top-1 -right-1">
                    3
                  </Badge>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isChatOpen ? 'Close Chat (C)' : 'Open Chat (C)'}
              </TooltipContent>
            </Tooltip>

            {/* Record */}
            {onRecord && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isRecording ? 'destructive' : 'secondary'}
                    size="xl"
                    onClick={onRecord}
                    className="w-14 h-14 rounded-2xl shadow-lg"
                  >
                    {isRecording ? <Pause className="h-6 w-6" /> : <Circle className="h-6 w-6" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isRecording ? 'Pause Recording' : 'Start Recording'}
                </TooltipContent>
              </Tooltip>
            )}

            {/* More Options */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="xl"
                  className="w-14 h-14 rounded-2xl shadow-lg"
                >
                  <MoreHorizontal className="h-6 w-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                More Options
              </TooltipContent>
            </Tooltip>

            {/* Settings */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="xl"
                  className="w-14 h-14 rounded-2xl shadow-lg"
                >
                  <Settings className="h-6 w-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Settings
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Leave Button */}
        <div className="pl-4 border-l border-gray-700">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="destructive"
                  size="xl"
                  onClick={onLeave}
                  className="w-14 h-14 rounded-2xl shadow-lg hover:scale-105 transition-transform"
                >
                  <PhoneOff className="h-6 w-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Leave Meeting
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Keyboard Shortcuts Bar */}
      <div className="mt-3 pt-3 border-t border-gray-700 flex items-center justify-center gap-6 text-xs text-muted-foreground">
        <kbd className="px-2 py-1 rounded bg-gray-800 border border-gray-700">M</kbd>
        <span>Mute</span>
        <kbd className="px-2 py-1 rounded bg-gray-800 border border-gray-700">V</kbd>
        <span>Video</span>
        <kbd className="px-2 py-1 rounded bg-gray-800 border border-gray-700">S</kbd>
        <span>Share</span>
        <kbd className="px-2 py-1 rounded bg-gray-800 border border-gray-700">C</kbd>
        <span>Chat</span>
        <kbd className="px-2 py-1 rounded bg-gray-800 border border-gray-700">H</kbd>
        <span>Hand</span>
      </div>
    </footer>
  );
}

export default MeetingControls;
