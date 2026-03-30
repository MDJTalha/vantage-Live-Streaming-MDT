'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import podcastService from '@/services/PodcastService';
import {
  Mic, Video, Plus, BarChart3, FolderOpen, Clock, Play, MoreVertical,
  Copy, Edit2, Trash2, Calendar, ArrowLeft
} from 'lucide-react';

interface Episode {
  id: string;
  title: string;
  status: 'published' | 'draft' | 'recording' | 'scheduled';
  duration?: number;
  createdAt?: string;
  guests?: string[];
}

export default function PodcastPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'published' | 'draft' | 'scheduled'>('all');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadEpisodes();
  }, [user]);

  async function loadEpisodes() {
    setIsLoading(true);
    try {
      const userEpisodes = await podcastService.getEpisodes(user!.id);
      setEpisodes(userEpisodes.map(ep => ({
        id: ep.id,
        title: ep.title,
        status: ep.status,
        duration: ep.duration,
        createdAt: ep.createdAt,
        guests: ep.guests,
      })));
    } catch (error) {
      console.error('Error loading episodes:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const filteredEpisodes = episodes.filter((episode) => {
    if (activeTab === 'all') return true;
    return episode.status === activeTab;
  });

  const stats = {
    total: episodes.length,
    published: episodes.filter(e => e.status === 'published').length,
    drafts: episodes.filter(e => e.status === 'draft').length,
    scheduled: episodes.filter(e => e.status === 'scheduled').length,
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Security Banner */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-2">
        <div className="container mx-auto flex items-center justify-between text-xs">
          <div className="flex items-center gap-4 text-slate-500">
            <span className="flex items-center gap-1.5">🎙️ Podcast Studio</span>
            <span className="flex items-center gap-1.5">🔒 Encrypted</span>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 text-slate-500 hover:text-slate-300 hover:bg-slate-900 rounded-md transition-all"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                  <Mic className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h1 className="text-sm font-medium text-slate-300">Podcast Studio</h1>
                  <p className="text-xs text-slate-600">Manage your episodes</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push('/podcast/new')}
                className="px-4 py-1.5 text-xs font-medium rounded-md bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:opacity-90 transition-all flex items-center gap-1.5"
              >
                <Plus className="h-3 w-3" />
                New Episode
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="p-5 rounded-lg bg-slate-900/50 border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <p className="text-2xl font-medium text-slate-300">{stats.total}</p>
              <div className="w-9 h-9 rounded-md bg-slate-800 flex items-center justify-center">
                <Video className="h-4 w-4 text-slate-500" />
              </div>
            </div>
            <p className="text-xs text-slate-600">Total Episodes</p>
          </div>
          <div className="p-5 rounded-lg bg-slate-900/50 border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <p className="text-2xl font-medium text-slate-300">{stats.published}</p>
              <div className="w-9 h-9 rounded-md bg-slate-800 flex items-center justify-center">
                <Play className="h-4 w-4 text-slate-500" />
              </div>
            </div>
            <p className="text-xs text-slate-600">Published</p>
          </div>
          <div className="p-5 rounded-lg bg-slate-900/50 border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <p className="text-2xl font-medium text-slate-300">{stats.drafts}</p>
              <div className="w-9 h-9 rounded-md bg-slate-800 flex items-center justify-center">
                <Edit2 className="h-4 w-4 text-slate-500" />
              </div>
            </div>
            <p className="text-xs text-slate-600">Drafts</p>
          </div>
          <div className="p-5 rounded-lg bg-slate-900/50 border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <p className="text-2xl font-medium text-slate-300">{stats.scheduled}</p>
              <div className="w-9 h-9 rounded-md bg-slate-800 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-slate-500" />
              </div>
            </div>
            <p className="text-xs text-slate-600">Scheduled</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-3 mb-8">
          <button
            onClick={() => router.push('/podcast/new')}
            className="p-4 rounded-lg bg-slate-900 border border-slate-800 hover:border-purple-500/50 transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-md bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/30 transition-all">
                <Plus className="h-4 w-4 text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-300">Record New</p>
                <p className="text-xs text-slate-600">Start a new episode</p>
              </div>
            </div>
          </button>
          <button
            onClick={() => router.push('/podcast/episodes')}
            className="p-4 rounded-lg bg-slate-900 border border-slate-800 hover:border-purple-500/50 transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-md bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/30 transition-all">
                <FolderOpen className="h-4 w-4 text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-300">All Episodes</p>
                <p className="text-xs text-slate-600">Manage library</p>
              </div>
            </div>
          </button>
          <button
            onClick={() => router.push('/podcast/analytics')}
            className="p-4 rounded-lg bg-slate-900 border border-slate-800 hover:border-purple-500/50 transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-md bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/30 transition-all">
                <BarChart3 className="h-4 w-4 text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-300">Analytics</p>
                <p className="text-xs text-slate-600">Performance insights</p>
              </div>
            </div>
          </button>
        </div>

        {/* Episodes List */}
        <div className="rounded-lg bg-slate-900/50 border border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  activeTab === 'all' ? 'bg-slate-800 text-slate-300' : 'text-slate-600 hover:text-slate-400'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveTab('published')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  activeTab === 'published' ? 'bg-slate-800 text-slate-300' : 'text-slate-600 hover:text-slate-400'
                }`}
              >
                Published
              </button>
              <button
                onClick={() => setActiveTab('draft')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  activeTab === 'draft' ? 'bg-slate-800 text-slate-300' : 'text-slate-600 hover:text-slate-400'
                }`}
              >
                Drafts
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-800">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="w-6 h-6 border-2 border-slate-800 border-t-slate-600 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-slate-600">Loading episodes...</p>
              </div>
            ) : filteredEpisodes.length === 0 ? (
              <div className="p-12 text-center">
                <Video className="h-10 w-10 text-slate-700 mx-auto mb-3" />
                <p className="text-sm text-slate-500 mb-4">No episodes found</p>
                <button
                  onClick={() => router.push('/podcast/new')}
                  className="text-xs font-medium text-purple-400 hover:text-purple-300 transition-all flex items-center justify-center gap-1 mx-auto"
                >
                  <Plus className="h-3 w-3" />
                  Create your first episode
                </button>
              </div>
            ) : (
              filteredEpisodes.map((episode) => (
                <EpisodeCard key={episode.id} episode={episode} />
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function EpisodeCard({ episode }: { episode: Episode }) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="p-4 hover:bg-slate-800/30 transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
            <Mic className="h-6 w-6 text-purple-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-sm font-medium text-slate-300 truncate">{episode.title}</h4>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                episode.status === 'published' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                episode.status === 'draft' ? 'bg-slate-800 text-slate-400 border border-slate-700' :
                'bg-purple-500/20 text-purple-400 border border-purple-500/30'
              }`}>
                {episode.status}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-600">
              {episode.createdAt && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(episode.createdAt).toLocaleDateString()}
                </span>
              )}
              {episode.duration && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {Math.floor(episode.duration / 60)}:{(episode.duration % 60).toString().padStart(2, '0')}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-1.5 text-xs font-medium rounded-md bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-300 hover:border-slate-600 transition-all flex items-center gap-1.5">
            <Play className="h-3 w-3" />
            {episode.status === 'published' ? 'Play' : 'Edit'}
          </button>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-md transition-all"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-1 w-40 bg-slate-900 border border-slate-800 rounded-md shadow-xl overflow-hidden z-50">
                <button className="w-full px-3 py-2 text-left text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-300 transition-all flex items-center gap-2">
                  <Edit2 className="h-3 w-3" />
                  Edit Details
                </button>
                <button className="w-full px-3 py-2 text-left text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-300 transition-all flex items-center gap-2 border-t border-slate-800">
                  <Copy className="h-3 w-3" />
                  Copy Link
                </button>
                <button className="w-full px-3 py-2 text-left text-xs text-slate-500 hover:bg-slate-800 hover:text-slate-400 transition-all flex items-center gap-2 border-t border-slate-800">
                  <Trash2 className="h-3 w-3" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
