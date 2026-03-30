'use client';

import { useState, useRef } from 'react';
import { Image, X, Upload } from 'lucide-react';

interface BackgroundOption {
  id: string;
  name: string;
  type: 'none' | 'blur' | 'image';
  thumbnail?: string;
  imageUrl?: string;
  blurStrength?: number;
}

const PRESET_BACKGROUNDS: BackgroundOption[] = [
  { id: 'none', name: 'None', type: 'none' },
  { id: 'blur-1', name: 'Blur Light', type: 'blur', blurStrength: 5, thumbnail: '🌫️' },
  { id: 'blur-2', name: 'Blur Medium', type: 'blur', blurStrength: 10, thumbnail: '🌫️🌫️' },
  { id: 'blur-3', name: 'Blur Strong', type: 'blur', blurStrength: 20, thumbnail: '🌫️🌫️🌫️' },
];

interface VirtualBackgroundPanelProps {
  onBackgroundChange: (options: { type: string; blurStrength?: number; imageUrl?: string }) => void;
  currentBackground?: BackgroundOption;
  isOpen: boolean;
  onClose: () => void;
}

export function VirtualBackgroundPanel({
  onBackgroundChange,
  currentBackground,
  isOpen,
  onClose,
}: VirtualBackgroundPanelProps) {
  const [customImage, setCustomImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelect = (background: BackgroundOption) => {
    onBackgroundChange({
      type: background.type,
      blurStrength: background.blurStrength,
      imageUrl: background.imageUrl || customImage || undefined,
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setCustomImage(imageUrl);
      
      const customBackground: BackgroundOption = {
        id: 'custom',
        name: 'Custom',
        type: 'image',
        imageUrl,
      };
      
      handleSelect(customBackground);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute bottom-full left-0 mb-2 bg-gray-900 rounded-xl p-4 shadow-2xl border border-gray-700 w-96 z-50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold text-lg">Virtual Background</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
          aria-label="Close background panel"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Preset Backgrounds */}
      <div className="space-y-3">
        <div className="text-sm text-gray-400 font-medium">Preset Backgrounds</div>
        <div className="grid grid-cols-4 gap-2">
          {PRESET_BACKGROUNDS.map((bg) => (
            <button
              key={bg.id}
              onClick={() => handleSelect(bg)}
              className={`aspect-square rounded-lg flex flex-col items-center justify-center transition-all ${
                currentBackground?.id === bg.id
                  ? 'ring-2 ring-blue-500 bg-blue-600'
                  : 'bg-gray-800 hover:bg-gray-700'
              }`}
              title={bg.name}
            >
              {bg.thumbnail && <span className="text-2xl mb-1">{bg.thumbnail}</span>}
              <span className="text-xs text-white text-center px-1">{bg.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Image Backgrounds */}
      {customImage && (
        <div className="space-y-3 mt-4 pt-4 border-t border-gray-700">
          <div className="text-sm text-gray-400 font-medium">Custom Background</div>
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => handleSelect({
                id: 'custom',
                name: 'Custom',
                type: 'image',
                imageUrl: customImage,
              })}
              className={`aspect-square rounded-lg flex items-center justify-center transition-all ${
                currentBackground?.id === 'custom'
                  ? 'ring-2 ring-blue-500 bg-blue-600'
                  : 'bg-gray-800 hover:bg-gray-700'
              }`}
              title="Custom Background"
            >
              <Image className="h-8 w-8 text-gray-400" />
            </button>
          </div>
        </div>
      )}

      {/* Upload Button */}
      <div className="space-y-3 mt-4 pt-4 border-t border-gray-700">
        <div className="text-sm text-gray-400 font-medium">Add Your Own</div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-3 px-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          <Upload className="h-5 w-5 text-gray-400" />
          <span className="text-white text-sm font-medium">Upload Image</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>

      {/* Instructions */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="text-xs text-gray-500 text-center">
          💡 Tip: Use high-quality images for best results
        </div>
      </div>
    </div>
  );
}

export default VirtualBackgroundPanel;
