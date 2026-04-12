'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Video, Calendar, Clock, Users, Play, MoreVertical, Edit2, Trash2, X,
  Sparkles, CheckCircle2, AlertCircle, FolderOpen, Plus, Briefcase, DollarSign, Award
} from 'lucide-react';

interface Room {
  id: string;
  name: string;
  code: string;
  status: 'active' | 'scheduled' | 'ended';
  participants: number;
  date?: string;
  duration?: string | number;
  priority?: 'critical' | 'high' | 'normal';
  type?: 'board' | 'investor' | 'executive' | 'team';
  aiSummary?: string;
  aiActionItems?: number;
  aiSentiment?: number;
}

interface MeetingListProps {
  rooms: Room[];
  isLoading: boolean;
  error: string | null;
  activeTab: 'all' | 'active' | 'scheduled';
  searchQuery: string;
  onSetActiveTab: (tab: 'all' | 'active' | 'scheduled') => void;
  onRefresh: () => void;
}

export function MeetingList({
  rooms,
  isLoading,
  error,
  activeTab,
  searchQuery,
  onSetActiveTab,
  onRefresh,
}: MeetingListProps) {
  const router = useRouter();

  const filteredRooms = rooms.filter((room) => {
    const matchesSearch = room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         room.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || room.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const liveMeeting = rooms.find(m => m.status === 'active');

  return (
    <div className="space-y-6">
      {/* Live Meeting Alert */}
      {liveMeeting && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-950/60 via-red-900/40 to-red-950/60 border border-red-500/30 p-6">
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-3xl" />

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                  <Video className="h-7 w-7 text-red-400" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-4 border-slate-950 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-1 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-wider animate-pulse flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    Live Now
                  </span>
                  {liveMeeting.priority === 'critical' && (
                    <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold flex items-center gap-1">
                      Critical
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-white mb-1">{liveMeeting.name}</h3>
                <div className="flex items-center gap-4 text-sm text-slate-400">
                  <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /> {liveMeeting.participants} participants</span>
                  <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {liveMeeting.duration}</span>
                  {liveMeeting.aiSentiment && (
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      94% positive sentiment
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => router.push(`/room/${liveMeeting.code}`)}
              className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-semibold px-8 py-4 rounded-xl shadow-lg shadow-red-500/30 transition-all flex items-center gap-2 group"
            >
              <Play className="h-5 w-5" />
              Join Now
            </button>
          </div>
        </div>
      )}

      {/* Meetings Section */}
      <div className="rounded-2xl bg-slate-900/50 border border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSetActiveTab('all')}
              className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
                activeTab === 'all'
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                  : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800'
              }`}
            >
              All Meetings
            </button>
            <button
              onClick={() => onSetActiveTab('active')}
              className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
                activeTab === 'active'
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => onSetActiveTab('scheduled')}
              className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
                activeTab === 'scheduled'
                  ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
                  : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800'
              }`}
            >
              Scheduled
            </button>
          </div>
          <button
            onClick={() => router.push('/schedule-room')}
            className="text-sm font-semibold text-blue-400 hover:text-blue-300 transition-all flex items-center gap-2"
          >
            <Calendar className="h-4 w-4" />
            Schedule Meeting
          </button>
        </div>

        <div className="divide-y divide-slate-800">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 border-4 border-slate-800 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm text-slate-500">Loading your meetings...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <p className="text-sm text-red-400 mb-4">{error}</p>
              <button onClick={onRefresh} className="text-sm font-medium text-blue-400 hover:text-blue-300">
                Try Again
              </button>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="p-12 text-center">
              <FolderOpen className="h-16 w-16 text-slate-700 mx-auto mb-4" />
              <p className="text-sm text-slate-500 mb-4">No meetings found</p>
              <button
                onClick={() => router.push('/create-room')}
                className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-all flex items-center justify-center gap-2 mx-auto"
              >
                <Plus className="h-4 w-4" />
                Create your first meeting
              </button>
            </div>
          ) : (
            filteredRooms.map((room) => (
              <MeetingCard
                key={room.id}
                room={room}
                onJoin={() => router.push(`/room/${room.code}`)}
                onRefresh={onRefresh}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// Meeting Card Component
function MeetingCard({ room, onJoin, onRefresh }: { room: Room; onJoin: () => void; onRefresh: () => void }) {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleCopyLink = () => {
    const url = `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/room/${room.code}`;
    navigator.clipboard.writeText(url);
  };

  const handleDelete = async () => {
    if (confirm(`Delete "${room.name}"?`)) {
      const success = await meetingService.deleteMeeting(room.code);
      if (success) {
        onRefresh();
      }
    }
  };

  const handleEdit = () => {
    setShowMenu(false);
    setIsEditing(true);
  };

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!showMenu) {
      const rect = e.currentTarget.getBoundingClientRect();
      setMenuPosition({
        top: rect.top - 8,
        right: window.innerWidth - rect.right,
      });
    }
    setShowMenu(!showMenu);
  };

  const getPriorityColor = () => {
    switch (room.priority) {
      case 'critical': return 'from-red-500/20 to-red-600/20 border-red-500/30';
      case 'high': return 'from-amber-500/20 to-amber-600/20 border-amber-500/30';
      default: return 'from-slate-800/50 to-slate-900/50 border-slate-700/50';
    }
  };

  const getTypeIcon = () => {
    switch (room.type) {
      case 'board': return <Briefcase className="h-5 w-5" />;
      case 'investor': return <DollarSign className="h-5 w-5" />;
      case 'executive': return <Award className="h-5 w-5" />;
      default: return <Video className="h-5 w-5" />;
    }
  };

  return (
    <>
      <div className={`p-6 hover:bg-gradient-to-r ${getPriorityColor()} transition-all group`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}>
              {getTypeIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="text-base font-semibold text-white truncate">{room.name}</h4>
                {room.priority === 'critical' && (
                  <span className="px-2 py-1 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold flex-shrink-0">
                    Critical
                  </span>
                )}
                {room.priority === 'high' && (
                  <span className="px-2 py-1 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold flex-shrink-0">
                    High Priority
                  </span>
                )}
                <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border flex-shrink-0 ${
                  room.status === 'active' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' :
                  room.status === 'scheduled' ? 'bg-amber-500/20 border-amber-500/30 text-amber-400' :
                  'bg-slate-700/50 border-slate-600/50 text-slate-400'
                }`}>
                  {room.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block mr-1.5 animate-pulse" />}
                  {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-400 flex-wrap">
                <span className="font-mono bg-slate-800/50 px-2 py-1 rounded-lg border border-slate-700/50">{room.code}</span>
                {room.date && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    {room.date}
                  </span>
                )}
                {room.duration && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    {room.duration}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  {room.participants} participants
                </span>
                {room.aiActionItems !== undefined && room.aiActionItems > 0 && (
                  <span className="flex items-center gap-1.5 text-purple-400">
                    <CheckCircle2 className="h-4 w-4" />
                    {room.aiActionItems} AI action items
                  </span>
                )}
              </div>
              {room.aiSummary && (
                <div className="mt-3 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-slate-300">{room.aiSummary}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onJoin}
              className={`px-6 py-2.5 text-sm font-semibold rounded-xl transition-all flex items-center gap-2 ${
                room.status === 'active'
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg shadow-emerald-500/30'
                  : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-lg shadow-blue-500/30'
              }`}
            >
              <Play className="h-4 w-4" />
              {room.status === 'active' ? 'Join Now' : 'Start'}
            </button>
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                ref={buttonRef}
                onClick={toggleMenu}
                className="p-2 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-xl transition-all"
              >
                <MoreVertical className="h-5 w-5" />
              </button>
              {showMenu && menuPosition && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                  <div
                    className="fixed w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-150"
                    style={{
                      top: menuPosition.top,
                      right: menuPosition.right,
                    }}
                  >
                    <>
                      <button onClick={handleEdit} className="w-full px-4 py-3 text-left text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-all flex items-center gap-3">
                        <Edit2 className="h-4 w-4" />
                        Edit
                      </button>
                      <button onClick={handleCopyLink} className="w-full px-4 py-3 text-left text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-all flex items-center gap-3 border-t border-slate-800">
                        Copy link
                      </button>
                      <button onClick={handleDelete} className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-slate-800 hover:text-red-300 transition-all flex items-center gap-3 border-t border-slate-800">
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <EditMeetingModal
          room={room}
          onClose={() => setIsEditing(false)}
          onSave={async (updatedData: any) => {
            await meetingService.updateMeeting(room.code, updatedData);
            setIsEditing(false);
            onRefresh();
          }}
        />
      )}
    </>
  );
}

// Edit Meeting Modal
function EditMeetingModal({ room, onClose, onSave }: { room: Room; onClose: () => void; onSave: (data: any) => void }) {
  const [name, setName] = useState(room.name || '');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(typeof room.duration === 'number' ? room.duration : 60);
  const [maxParticipants, setMaxParticipants] = useState(100);
  const [allowChat, setAllowChat] = useState(true);
  const [allowScreenShare, setAllowScreenShare] = useState(true);
  const [allowRecording, setAllowRecording] = useState(true);
  const [requirePassword, setRequirePassword] = useState(false);
  const [enableWaitingRoom, setEnableWaitingRoom] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Edit Meeting</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Meeting Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Duration (min)</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 60)}
                min={15}
                max={480}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Max Participants</label>
              <input
                type="number"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(parseInt(e.target.value) || 100)}
                min={2}
                max={10000}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="text-sm font-medium text-slate-300">Meeting Options</label>

            <div className="flex items-center justify-between p-3 bg-slate-800 rounded-xl">
              <span className="text-sm text-slate-300">Allow Chat</span>
              <input type="checkbox" checked={allowChat} onChange={(e) => setAllowChat(e.target.checked)} className="w-5 h-5 rounded border-slate-600 text-blue-600 focus:ring-blue-500" />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-800 rounded-xl">
              <span className="text-sm text-slate-300">Allow Screen Share</span>
              <input type="checkbox" checked={allowScreenShare} onChange={(e) => setAllowScreenShare(e.target.checked)} className="w-5 h-5 rounded border-slate-600 text-blue-600 focus:ring-blue-500" />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-800 rounded-xl">
              <span className="text-sm text-slate-300">Allow Recording</span>
              <input type="checkbox" checked={allowRecording} onChange={(e) => setAllowRecording(e.target.checked)} className="w-5 h-5 rounded border-slate-600 text-blue-600 focus:ring-blue-500" />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-800 rounded-xl">
              <span className="text-sm text-slate-300">Require Password</span>
              <input type="checkbox" checked={requirePassword} onChange={(e) => setRequirePassword(e.target.checked)} className="w-5 h-5 rounded border-slate-600 text-blue-600 focus:ring-blue-500" />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-800 rounded-xl">
              <span className="text-sm text-slate-300">Enable Waiting Room</span>
              <input type="checkbox" checked={enableWaitingRoom} onChange={(e) => setEnableWaitingRoom(e.target.checked)} className="w-5 h-5 rounded border-slate-600 text-blue-600 focus:ring-blue-500" />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button onClick={onClose} className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all">
              Cancel
            </button>
            <button onClick={() => onSave({
              name,
              description,
              duration,
              maxParticipants,
              settings: { allowChat, allowScreenShare, allowRecording, requirePassword, enableWaitingRoom }
            })} className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all">
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Meeting service - connects to API with localStorage fallback for demo mode
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const meetingService = {
  deleteMeeting: async (code: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/api/v1/meetings/${code}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      return response.ok;
    } catch (error) {
      console.error('API delete failed, using localStorage fallback:', error);

      try {
        const rawMeetings = localStorage.getItem('scheduledMeetings');
        if (!rawMeetings) return false;

        const meetings = JSON.parse(rawMeetings);
        const filteredMeetings = meetings.filter((m: any) => m.code !== code && m.id !== code);

        if (filteredMeetings.length !== meetings.length) {
          localStorage.setItem('scheduledMeetings', JSON.stringify(filteredMeetings));
          console.log('Meeting deleted from localStorage');
          window.dispatchEvent(new CustomEvent('meetingsUpdated'));
          return true;
        }
        return false;
      } catch (parseError) {
        console.error('Error deleting from localStorage:', parseError);
        return false;
      }
    }
  },
  updateMeeting: async (code: string, data: any) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/api/v1/meetings/${code}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      return response.ok;
    } catch (error) {
      console.error('API update failed, using localStorage fallback:', error);

      try {
        const rawMeetings = localStorage.getItem('scheduledMeetings');
        if (!rawMeetings) return false;

        const meetings = JSON.parse(rawMeetings);
        const meetingIndex = meetings.findIndex((m: any) => m.code === code || m.id === code);

        if (meetingIndex !== -1) {
          meetings[meetingIndex] = { ...meetings[meetingIndex], ...data };
          localStorage.setItem('scheduledMeetings', JSON.stringify(meetings));
          console.log('Meeting updated in localStorage');
          window.dispatchEvent(new CustomEvent('meetingsUpdated'));
          return true;
        }
        return false;
      } catch (parseError) {
        console.error('Error updating localStorage:', parseError);
        return false;
      }
    }
  },
};
