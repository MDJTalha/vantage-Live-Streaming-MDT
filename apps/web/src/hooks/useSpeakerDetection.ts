'use client';

import { useEffect, useState, useCallback } from 'react';

export interface SpeakerData {
  id: string;
  name: string;
  isSpeaking: boolean;
  volume: number;
  lastSpokenAt?: Date;
}

interface UseSpeakerDetectionOptions {
  threshold?: number;
  interval?: number;
}

/**
 * Speaker Detection Hook
 * Detects active speakers using audio analysis
 */
export function useSpeakerDetection(
  audioStream: MediaStream | null,
  options: UseSpeakerDetectionOptions = {}
) {
  const { threshold = 0.01, interval = 100 } = options;
  
  const [speakers, setSpeakers] = useState<SpeakerData[]>([]);
  const [activeSpeaker, setActiveSpeaker] = useState<SpeakerData | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);

  useEffect(() => {
    if (!audioStream) return;

    setIsDetecting(true);

    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(audioStream);
    
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;
    microphone.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    let animationFrame: number;
    let lastEmit = 0;

    const detectVolume = () => {
      analyser.getByteFrequencyData(dataArray);
      
      // Calculate average volume
      const sum = dataArray.reduce((a, b) => a + b, 0);
      const average = sum / dataArray.length;
      const volume = average / 255;

      const now = Date.now();
      
      if (now - lastEmit > interval) {
        const isSpeaking = volume > threshold;
        
        setActiveSpeaker(prev => {
          if (isSpeaking) {
            return {
              id: 'local',
              name: 'You',
              isSpeaking: true,
              volume,
              lastSpokenAt: new Date(),
            };
          }
          return prev?.isSpeaking ? { ...prev, isSpeaking: false } : null;
        });

        lastEmit = now;
      }

      animationFrame = requestAnimationFrame(detectVolume);
    };

    detectVolume();

    return () => {
      cancelAnimationFrame(animationFrame);
      audioContext.close();
      setIsDetecting(false);
    };
  }, [audioStream, threshold, interval]);

  // Register remote speaker
  const registerSpeaker = useCallback((id: string, name: string) => {
    setSpeakers(prev => {
      if (prev.find(s => s.id === id)) return prev;
      return [...prev, { id, name, isSpeaking: false, volume: 0 }];
    });
  }, []);

  // Update speaker volume from WebSocket
  const updateSpeakerVolume = useCallback((id: string, volume: number, isSpeaking: boolean) => {
    setSpeakers(prev => prev.map(s => 
      s.id === id ? { ...s, volume, isSpeaking, lastSpokenAt: isSpeaking ? new Date() : s.lastSpokenAt } : s
    ));

    if (isSpeaking) {
      setActiveSpeaker({ id, name: speakers.find(s => s.id === id)?.name || 'Participant', isSpeaking: true, volume });
    }
  }, [speakers]);

  // Remove speaker
  const removeSpeaker = useCallback((id: string) => {
    setSpeakers(prev => prev.filter(s => s.id !== id));
  }, []);

  return {
    speakers,
    activeSpeaker,
    isDetecting,
    registerSpeaker,
    updateSpeakerVolume,
    removeSpeaker,
  };
}

export default useSpeakerDetection;
