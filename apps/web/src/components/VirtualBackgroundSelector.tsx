'use client';

import { useState } from 'react';
import { Button } from '@vantage/ui';

interface BackgroundOption {
  id: string;
  name: string;
  type: 'none' | 'blur' | 'image';
  thumbnail?: string;
  imageUrl?: string;
}

const PRESET_BACKGROUNDS: BackgroundOption[] = [
  { id: 'none', name: 'None', type: 'none' },
  { id: 'blur-1', name: 'Blur Light', type: 'blur', thumbnail: '🌫️' },
  { id: 'blur-2', name: 'Blur Strong', type: 'blur', thumbnail: '🌫️🌫️' },
  { id: 'office', name: 'Office', type: 'image', thumbnail: '🏢' },
  { id: 'home', name: 'Home', type: 'image', thumbnail: '🏠' },
  { id: 'nature', name: 'Nature', type: 'image', thumbnail: '🌲' },
  { id: 'beach', name: 'Beach', type: 'image', thumbnail: '🏖️' },
  { id: 'space', name: 'Space', type: 'image', thumbnail: '🚀' },
];

interface VirtualBackgroundSelectorProps {
  onSelect: (background: BackgroundOption) => void;
  selectedBackground?: BackgroundOption;
}

export function VirtualBackgroundSelector({
  onSelect,
  selectedBackground,
}: VirtualBackgroundSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (background: BackgroundOption) => {
    onSelect(background);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Button
        variant="secondary"
        size="lg"
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full"
      >
        🖼️
      </Button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 bg-gray-800 rounded-lg p-4 shadow-xl border border-gray-700 w-80">
          <h3 className="text-white font-semibold mb-3">Virtual Background</h3>
          
          <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto">
            {PRESET_BACKGROUNDS.map((bg) => (
              <button
                key={bg.id}
                onClick={() => handleSelect(bg)}
                className={`aspect-square rounded-lg flex items-center justify-center text-2xl transition-all ${
                  selectedBackground?.id === bg.id
                    ? 'ring-2 ring-blue-500 bg-blue-600'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
                title={bg.name}
              >
                {bg.thumbnail || '📷'}
              </button>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-gray-700">
            <label className="block text-sm text-gray-400 mb-2">
              Or upload your own
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const url = URL.createObjectURL(file);
                  handleSelect({
                    id: 'custom',
                    name: 'Custom',
                    type: 'image',
                    imageUrl: url,
                  });
                }
              }}
              className="w-full text-sm text-gray-400 file:mr-2 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default VirtualBackgroundSelector;
