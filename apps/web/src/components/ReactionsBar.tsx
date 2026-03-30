'use client';

import { useState } from 'react';
import { Button } from '@vantage/ui';

interface ReactionsBarProps {
  onReaction: (emoji: string) => void;
}

const REACTIONS = [
  { emoji: '👍', label: 'Like' },
  { emoji: '👎', label: 'Dislike' },
  { emoji: '❤️', label: 'Love' },
  { emoji: '😂', label: 'Laugh' },
  { emoji: '😮', label: 'Surprised' },
  { emoji: '😢', label: 'Sad' },
  { emoji: '🎉', label: 'Celebrate' },
  { emoji: '🔥', label: 'Fire' },
  { emoji: '👏', label: 'Applause' },
  { emoji: '✋', label: 'Raise Hand' },
];

export function ReactionsBar({ onReaction }: ReactionsBarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleReaction = (emoji: string) => {
    onReaction(emoji);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {isOpen && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-800 rounded-lg p-2 shadow-xl border border-gray-700">
          <div className="grid grid-cols-5 gap-1">
            {REACTIONS.map((reaction) => (
              <button
                key={reaction.emoji}
                onClick={() => handleReaction(reaction.emoji)}
                className="text-2xl hover:scale-125 transition-transform p-1"
                title={reaction.label}
              >
                {reaction.emoji}
              </button>
            ))}
          </div>
        </div>
      )}
      <Button
        variant="secondary"
        size="lg"
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full"
      >
        😊
      </Button>
    </div>
  );
}

export default ReactionsBar;
