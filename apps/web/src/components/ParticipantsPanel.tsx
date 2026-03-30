'use client';

interface ParticipantsPanelProps {
  participants: Array<{
    id: string;
    name?: string;
    role: 'host' | 'cohost' | 'participant' | 'viewer';
    isSpeaking: boolean;
    isVideoEnabled: boolean;
    isAudioEnabled: boolean;
  }>;
  localParticipantId: string;
  isHost: boolean;
  isCohost: boolean;
  onPromote?: (participantId: string) => void;
  onDemote?: (participantId: string) => void;
  onRemove?: (participantId: string) => void;
  onMute?: (participantId: string) => void;
  onStopVideo?: (participantId: string) => void;
}

export function ParticipantsPanel({
  participants,
  localParticipantId,
  isHost,
  isCohost,
  onPromote,
  onDemote,
  onRemove,
  onMute,
  onStopVideo,
}: ParticipantsPanelProps) {
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'host':
        return 'bg-purple-600 text-white';
      case 'cohost':
        return 'bg-blue-600 text-white';
      case 'viewer':
        return 'bg-gray-600 text-gray-300';
      default:
        return 'bg-gray-700 text-gray-300';
    }
  };

  return (
    <div className="w-72 bg-gray-800 border-l border-gray-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-white font-semibold">Participants</h2>
        <p className="text-sm text-gray-400">{participants.length} people</p>
      </div>

      {/* Participant List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2" role="list">
        {participants.map((participant) => {
          const isLocal = participant.id === localParticipantId;
          const canModerate = (isHost || isCohost) && !isLocal;

          return (
            <div
              key={participant.id}
              className="bg-gray-700 rounded-lg p-3 space-y-2"
              role="listitem"
              aria-label={`${participant.name || 'Participant'} - ${participant.role}`}
            >
              {/* Name and Role */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {participant.name?.charAt(0).toUpperCase() || 'P'}
                    </span>
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">
                      {participant.name || 'Participant'}
                      {isLocal && ' (You)'}
                    </p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${getRoleBadgeColor(
                        participant.role
                      )}`}
                    >
                      {participant.role}
                    </span>
                  </div>
                </div>
                {participant.isSpeaking && (
                  <span className="text-green-500 text-lg">🎤</span>
                )}
              </div>

              {/* Status Icons */}
              <div className="flex items-center space-x-2 text-sm">
                {!participant.isAudioEnabled && (
                  <span className="text-red-400" title="Muted">🔇</span>
                )}
                {!participant.isVideoEnabled && (
                  <span className="text-red-400" title="Camera off">📷</span>
                )}
              </div>

              {/* Host Controls */}
              {canModerate && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-600">
                  {onMute && (
                    <button
                      onClick={() => onMute(participant.id)}
                      className="text-xs text-gray-300 hover:text-white"
                      aria-label={`${participant.isAudioEnabled ? 'Mute' : 'Unmute'} ${participant.name || 'participant'}`}
                    >
                      {participant.isAudioEnabled ? 'Mute' : 'Unmute'}
                    </button>
                  )}
                  {onStopVideo && (
                    <button
                      onClick={() => onStopVideo(participant.id)}
                      className="text-xs text-gray-300 hover:text-white"
                      aria-label={`${participant.isVideoEnabled ? 'Stop video for' : 'Start video for'} ${participant.name || 'participant'}`}
                    >
                      {participant.isVideoEnabled ? 'Stop Video' : 'Start Video'}
                    </button>
                  )}
                  {isHost && onPromote && participant.role === 'participant' && (
                    <button
                      onClick={() => onPromote(participant.id)}
                      className="text-xs text-blue-400 hover:text-blue-300"
                      aria-label={`Promote ${participant.name || 'participant'} to co-host`}
                    >
                      Make Co-host
                    </button>
                  )}
                  {isHost && onDemote && participant.role === 'cohost' && (
                    <button
                      onClick={() => onDemote(participant.id)}
                      className="text-xs text-blue-400 hover:text-blue-300"
                      aria-label={`Demote ${participant.name || 'participant'} from co-host`}
                    >
                      Remove Co-host
                    </button>
                  )}
                  {isHost && onRemove && (
                    <button
                      onClick={() => onRemove(participant.id)}
                      className="text-xs text-red-400 hover:text-red-300"
                      aria-label={`Remove ${participant.name || 'participant'} from room`}
                    >
                      Remove
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ParticipantsPanel;
