'use client';

import { useState } from 'react';
import { Button } from '@vantage/ui';

interface TranscriptSegment {
  id: string;
  text: string;
  speaker: string;
  timestamp: string;
}

interface LiveTranscriptProps {
  roomId: string;
  isRecording?: boolean;
}

export function LiveTranscript({ roomId, isRecording = false }: LiveTranscriptProps) {
  const [segments] = useState<TranscriptSegment[]>([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [language, setLanguage] = useState('en');

  // In production, connect to WebSocket for real-time transcription
  const startTranscription = async () => {
    setIsTranscribing(true);
    
    // Connect to transcription service
    // socket.emit('start-transcription', { roomId, language });
  };

  const stopTranscription = async () => {
    setIsTranscribing(false);
    // socket.emit('stop-transcription', { roomId });
  };

  const exportTranscript = () => {
    const text = segments
      .map(s => `[${s.timestamp}] ${s.speaker}: ${s.text}`)
      .join('\n');
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${roomId}-${Date.now()}.txt`;
    a.click();
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">Live Transcript</h3>
        <div className="flex items-center space-x-2">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-gray-700 text-white text-sm px-2 py-1 rounded"
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="zh">Chinese</option>
            <option value="ja">Japanese</option>
          </select>
          
          {isTranscribing ? (
            <Button variant="destructive" size="sm" onClick={stopTranscription}>
              Stop
            </Button>
          ) : (
            <Button variant="primary" size="sm" onClick={startTranscription}>
              Start
            </Button>
          )}
          
          {segments.length > 0 && (
            <Button variant="secondary" size="sm" onClick={exportTranscript}>
              Export
            </Button>
          )}
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm">
        {isTranscribing && segments.length === 0 && (
          <div className="text-gray-400 text-center py-8">
            <div className="animate-pulse">Listening...</div>
          </div>
        )}

        {!isTranscribing && segments.length === 0 && (
          <div className="text-gray-500 text-center py-8">
            Click "Start" to begin transcription
          </div>
        )}

        {segments.map((segment) => (
          <div key={segment.id} className="mb-2">
            <span className="text-gray-500">[{segment.timestamp}]</span>
            <span className="text-blue-400 ml-2">{segment.speaker}:</span>
            <span className="text-gray-300 ml-2">{segment.text}</span>
          </div>
        ))}
      </div>

      {isRecording && (
        <div className="mt-2 flex items-center text-red-500 text-sm">
          <span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse" />
          Recording with transcription
        </div>
      )}
    </div>
  );
}

export default LiveTranscript;
