'use client';

import { useState } from 'react';
import { Button } from '@vantage/ui';

interface WaitingRoomProps {
  participants: Array<{
    id: string;
    guestName?: string;
    guestEmail?: string;
    joinedAt: Date;
  }>;
  onAdmit: (participantId: string) => void;
  onDeny: (participantId: string) => void;
  onAdmitAll: () => void;
}

export function WaitingRoom({
  participants,
  onAdmit,
  onDeny,
  onAdmitAll,
}: WaitingRoomProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (participants.length === 0) return null;

  return (
    <div className="fixed bottom-20 right-4 w-80 bg-gray-800 rounded-lg shadow-xl border border-gray-700 overflow-hidden">
      {/* Header */}
      <div
        className="bg-warning px-4 py-3 flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-label={`${isExpanded ? 'Collapse' : 'Expand'} waiting room with ${participants.length} participants`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
      >
        <div className="flex items-center space-x-2">
          <span className="text-xl" aria-hidden="true">🚪</span>
          <span className="text-white font-semibold">Waiting Room</span>
          <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full" aria-label={`${participants.length} participants waiting`}>
            {participants.length}
          </span>
        </div>
        <span className="text-white text-xl" aria-hidden="true">{isExpanded ? '▼' : '▲'}</span>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
          {participants.map((participant) => (
            <div
              key={participant.id}
              className="bg-gray-700 rounded-lg p-3 flex items-center justify-between"
            >
              <div>
                <p className="text-white font-medium">
                  {participant.guestName || 'Guest'}
                </p>
                {participant.guestEmail && (
                  <p className="text-gray-400 text-sm">{participant.guestEmail}</p>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => onDeny(participant.id)}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                  aria-label={`Deny entry for ${participant.guestName || 'guest'}`}
                >
                  Deny
                </button>
                <button
                  onClick={() => onAdmit(participant.id)}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                  aria-label={`Admit ${participant.guestName || 'guest'} to the room`}
                >
                  Admit
                </button>
              </div>
            </div>
          ))}

          {participants.length > 1 && (
            <Button
              variant="primary"
              size="sm"
              onClick={onAdmitAll}
              className="w-full"
              aria-label={`Admit all ${participants.length} participants`}
            >
              Admit All
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default WaitingRoom;
