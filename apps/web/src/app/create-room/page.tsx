'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@vantage/ui';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Video, Check, Lock, CheckCircle2 } from 'lucide-react';

function generateRoomId(): string {
  const adjectives = ['swift', 'calm', 'bright', 'wise', 'bold', 'keen', 'free', 'true', 'rapid', 'sharp'];
  const nouns = ['eagle', 'tiger', 'wolf', 'hawk', 'lion', 'bear', 'fox', 'owl', 'dragon', 'phoenix'];
  return `${adjectives[Math.floor(Math.random() * adjectives.length)]}-${nouns[Math.floor(Math.random() * nouns.length)]}-${Math.floor(Math.random() * 1000)}`;
}

export default function CreateRoomPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [roomName, setRoomName] = useState('');
  const [description, setDescription] = useState('');
  const [requirePassword, setRequirePassword] = useState(false);
  const [password, setPassword] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(100);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsCreating(true);

    try {
      const roomCode = generateRoomId();
      
      // Try API first
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        const response = await fetch(`${apiUrl}/api/v1/rooms`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
          body: JSON.stringify({
            name: roomName || 'Untitled Meeting',
            description,
            settings: {
              maxParticipants,
              allowChat: true,
              allowScreenShare: true,
              allowRecording: true,
              requirePassword,
              password: requirePassword ? password : undefined,
            },
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error?.message || 'Failed to create room');
        }

        setSuccess('Room created successfully! Redirecting...');
        setTimeout(() => {
          router.push(`/room/${data.data.code || roomCode}`);
        }, 1000);
        return;
      } catch (apiError) {
        console.log('API unavailable, using demo mode');
      }

      // Demo mode fallback - create room in localStorage
      const newRoom = {
        id: 'room-' + Date.now(),
        name: roomName || 'Untitled Meeting',
        description,
        code: roomCode,
        hostId: user?.id || 'demo-user',
        status: 'active',
        participants: 1,
        maxParticipants,
        settings: {
          allowChat: true,
          allowScreenShare: true,
          allowRecording: true,
          requirePassword,
          password: requirePassword ? password : undefined,
        },
        createdAt: new Date().toISOString(),
      };

      const savedRooms = JSON.parse(localStorage.getItem('myRooms') || '[]');
      savedRooms.push(newRoom);
      localStorage.setItem('myRooms', JSON.stringify(savedRooms));

      // Also add to active rooms
      const activeRooms = JSON.parse(localStorage.getItem('activeRooms') || '[]');
      activeRooms.push(newRoom);
      localStorage.setItem('activeRooms', JSON.stringify(activeRooms));

      setSuccess('Room created successfully! Redirecting...');
      setTimeout(() => {
        router.push(`/room/${roomCode}`);
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to create room. Please try again.');
      setIsCreating(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      <header className="bg-[#0a0f1f] border-b border-blue-500/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')} className="text-blue-300 hover:text-white">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Video className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-white">VANTAGE Executive</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="rounded-2xl bg-[#1e293b] border border-blue-500/20 p-8 space-y-6">
            <div className="mb-4">
              <h2 className="text-3xl font-bold text-white mb-2">Create Meeting Room</h2>
              <p className="text-blue-200">Set up your virtual meeting space</p>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm" role="alert">
                {error}
              </div>
            )}
            {success && (
              <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm flex items-center gap-2" role="status">
                <CheckCircle2 className="h-5 w-5" />
                {success}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-5">
              <Input
                type="text"
                label="Meeting Name"
                placeholder="e.g., Q1 Board Meeting"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="bg-[#0f172a] border-blue-500/30 text-white placeholder:text-blue-300/50 focus:border-blue-400"
              />

              <div className="space-y-2">
                <label className="text-sm font-semibold text-blue-200">Description (Optional)</label>
                <textarea
                  className="w-full rounded-xl bg-[#0f172a] border border-blue-500/30 px-4 py-3 text-white placeholder:text-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                  placeholder="Add a description..."
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <Input
                type="number"
                label="Max Participants"
                placeholder="100"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(Number(e.target.value))}
                min={2}
                max={10000}
                className="bg-[#0f172a] border-blue-500/30 text-white placeholder:text-blue-300/50 focus:border-blue-400"
              />

              <div className="flex items-center gap-3 p-4 rounded-xl bg-[#0f172a] border border-blue-500/20">
                <input
                  type="checkbox"
                  id="requirePassword"
                  checked={requirePassword}
                  onChange={(e) => setRequirePassword(e.target.checked)}
                  className="w-4 h-4 rounded border-blue-500/30 bg-[#1e293b] text-blue-600 focus:ring-blue-500/50"
                />
                <label htmlFor="requirePassword" className="flex items-center gap-2 cursor-pointer text-blue-200">
                  <Lock className="h-4 w-4 text-blue-400" />
                  <span>Require password to join</span>
                </label>
              </div>

              {requirePassword && (
                <Input
                  type="text"
                  label="Meeting Password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-[#0f172a] border-blue-500/30 text-white placeholder:text-blue-300/50 focus:border-blue-400"
                />
              )}

              <div className="p-6 rounded-xl bg-[#0f172a] border border-blue-500/20">
                <h3 className="text-lg font-semibold text-white mb-4">Included Features:</h3>
                <div className="grid grid-cols-2 gap-3">
                  {['HD Video & Audio', 'Screen Sharing', 'Real-time Chat', 'Recording'].map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-blue-200">
                      <Check className="h-4 w-4 text-green-400" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/dashboard')}
                  className="flex-1 border-blue-500/30 text-white hover:bg-blue-500/20"
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1 bg-blue-600 hover:bg-blue-500"
                  disabled={isCreating}
                  isLoading={isCreating}
                >
                  {isCreating ? 'Creating...' : 'Create Room'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
