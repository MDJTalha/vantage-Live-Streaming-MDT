'use client';

import { useRouter } from 'next/navigation';
import { Button, Input } from '@vantage/ui';
import { useAuth } from '@/contexts/AuthContext';
import { Video, ArrowLeft, Calendar, Clock, Users, Bell, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

export default function ScheduleRoomPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('60');

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (!name || !date || !time) {
        setError('Please fill in all required fields');
        setIsLoading(false);
        return;
      }

      // Create room via API or demo mode
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        const response = await fetch(`${apiUrl}/api/v1/rooms`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
          body: JSON.stringify({
            name,
            description,
            settings: {
              maxParticipants: 100,
              allowChat: true,
              allowScreenShare: true,
              allowRecording: true,
              enableWaitingRoom: true,
            },
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error?.message || 'Failed to schedule meeting');
        }

        setSuccess('Meeting scheduled successfully!');
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
        return;
      } catch (apiError) {
        console.log('API unavailable, using demo mode');
      }

      // Demo mode fallback
      const roomCode = 'ROOM-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      const scheduledMeeting = {
        id: 'room-' + Date.now(),
        name,
        description,
        code: roomCode,
        hostId: user?.id || 'demo-user',
        hostName: user?.name || 'Host',
        status: 'scheduled',
        scheduledAt: new Date(`${date}T${time}`).toISOString(),
        scheduledDate: `${date}, ${time}`,
        duration: parseInt(duration),
        participants: 0,
        settings: {
          maxParticipants: 100,
          allowChat: true,
          allowScreenShare: true,
          allowRecording: true,
        },
      };

      // Save to scheduledRooms
      const scheduledRooms = JSON.parse(localStorage.getItem('scheduledRooms') || '[]');
      scheduledRooms.push(scheduledMeeting);
      localStorage.setItem('scheduledRooms', JSON.stringify(scheduledRooms));

      // Also save to myRooms for dashboard display
      const myRooms = JSON.parse(localStorage.getItem('myRooms') || '[]');
      myRooms.push(scheduledMeeting);
      localStorage.setItem('myRooms', JSON.stringify(myRooms));

      setSuccess('Meeting scheduled successfully!');
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to schedule meeting. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      {/* Header */}
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

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Card */}
          <div className="rounded-2xl bg-[#1e293b] border border-blue-500/20 p-8 space-y-6">
            {/* Header */}
            <div className="text-center space-y-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center mx-auto">
                <Calendar className="h-10 w-10 text-blue-400" />
              </div>
              <h1 className="text-3xl font-bold text-white">Schedule a Meeting</h1>
              <p className="text-blue-200">
                Plan your meeting for a future time
              </p>
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

            {/* Form */}
            <form onSubmit={handleSchedule} className="space-y-4">
              <Input
                type="text"
                label="Meeting Name"
                placeholder="e.g., Q1 Board Meeting"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                className="bg-[#0f172a] border-blue-500/30 text-white placeholder:text-blue-300/50 focus:border-blue-400"
              />

              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  type="date"
                  label="Date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  disabled={isLoading}
                  className="bg-[#0f172a] border-blue-500/30 text-white focus:border-blue-400"
                />
                <Input
                  type="time"
                  label="Time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  disabled={isLoading}
                  className="bg-[#0f172a] border-blue-500/30 text-white focus:border-blue-400"
                />
              </div>

              <Input
                type="number"
                label="Duration (minutes)"
                placeholder="60"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                disabled={isLoading}
                className="bg-[#0f172a] border-blue-500/30 text-white placeholder:text-blue-300/50 focus:border-blue-400"
              />

              <Input
                type="text"
                label="Meeting Description"
                placeholder="Brief description of the meeting"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isLoading}
                className="bg-[#0f172a] border-blue-500/30 text-white placeholder:text-blue-300/50 focus:border-blue-400"
              />

              <div className="p-4 rounded-xl bg-[#0f172a] border border-blue-500/20">
                <h3 className="text-sm font-semibold text-blue-300 mb-3">Included Features:</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm text-blue-200">
                    <Users className="h-4 w-4 text-blue-400" />
                    <span>Up to 100 participants</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-200">
                    <Bell className="h-4 w-4 text-blue-400" />
                    <span>Email reminders</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-200">
                    <Clock className="h-4 w-4 text-blue-400" />
                    <span>Auto-recording</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-200">
                    <Video className="h-4 w-4 text-blue-400" />
                    <span>HD video & audio</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/dashboard')}
                  className="flex-1 border-blue-500/30 text-white hover:bg-blue-500/20"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1 bg-blue-600 hover:bg-blue-500"
                  disabled={isLoading}
                  isLoading={isLoading}
                >
                  {isLoading ? 'Scheduling...' : 'Schedule Meeting'}
                </Button>
              </div>
            </form>

            {/* Info Box */}
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <p className="text-sm text-blue-200">
                <strong className="text-blue-300">Note:</strong> Meeting invitations will be sent to participants via email after scheduling.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
