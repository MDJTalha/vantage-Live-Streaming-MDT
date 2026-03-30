'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@vantage/ui';
import { Video, ArrowLeft, DoorOpen } from 'lucide-react';

export default function JoinRoomPage() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState('');
  const [participantName, setParticipantName] = useState('');

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomCode.trim()) {
      router.push(`/room/${roomCode.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Back Button */}
        <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')} className="text-blue-300 hover:text-white">
          <ArrowLeft className="h-5 w-5" />
        </Button>

        {/* Card */}
        <div className="rounded-2xl bg-[#1e293b] border border-blue-500/20 p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center mx-auto">
              <DoorOpen className="h-8 w-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Join Meeting</h1>
              <p className="text-blue-200 text-sm mt-1">
                Enter the room code to join a meeting
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleJoin} className="space-y-4">
            <Input
              type="text"
              label="Room Code"
              placeholder="e.g., calm-tiger-123"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              className="uppercase tracking-wider bg-[#0f172a] border-blue-500/30 text-white placeholder:text-blue-300/50 focus:border-blue-400"
            />

            <Input
              type="text"
              label="Your Name"
              placeholder="Enter your name"
              value={participantName}
              onChange={(e) => setParticipantName(e.target.value)}
              className="bg-[#0f172a] border-blue-500/30 text-white placeholder:text-blue-300/50 focus:border-blue-400"
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full bg-blue-600 hover:bg-blue-500"
              disabled={!roomCode.trim()}
            >
              <Video className="h-5 w-5 mr-2" />
              Join Meeting
            </Button>
          </form>

          <div className="text-center text-sm text-blue-200">
            Don't have a room code?{' '}
            <button
              onClick={() => router.push('/create-room')}
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              Create a meeting
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
