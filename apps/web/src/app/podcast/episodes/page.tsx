'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import podcastService, { type PodcastEpisode } from '@/services/PodcastService';
import { EditEpisodeModal } from '@/components/EditEpisodeModal';
import {
  ArrowLeft, Mic, Video, MoreVertical, Edit2, Trash2, Play, Plus,
  Search, Filter, Calendar, Clock, Users, Download
} from 'lucide-react';

interface Episode extends PodcastEpisode {}

interface EpisodeWithAnalytics extends Episode {
  views?: number;
  likes?: number;
}

export default function EpisodesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'scheduled'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'duration' | 'title'>('date');
  const [editingEpisode, setEditingEpisode] = useState<PodcastEpisode | null>(null);
  const [showMenu, setShowMenu] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadEpisodes();
    }
  }, [user]);

  async function loadEpisodes() {
    setIsLoading(true);
    try {
      const userEpisodes = await podcastService.getEpisodes(user!.id);
      setEpisodes(userEpisodes);
    } catch (error) {
      console.error('Error loading episodes:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(episodeId: string) {
    if (!confirm('Are you sure you want to delete this episode?')) return;
    
    try {
      await podcastService.deleteEpisode(episodeId);
      await loadEpisodes();
    } catch (error) {
      console.error('Failed to delete episode:', error);
      alert('Failed to delete episode');
    }
  }

  async function handlePublish(episodeId: string) {
    try {
      await podcastService.publishEpisode(episodeId);
      await loadEpisodes();
      alert('Episode published successfully!');
    } catch (error) {
      console.error('Failed to publish episode:', error);
      alert('Failed to publish episode');
    }
  }

  const filteredEpisodes = episodes.filter((episode) => {
    const matchesSearch = episode.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || episode.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sortedEpisodes = [...filteredEpisodes].sort((a, b) => {
    if (sortBy === 'date' && a.createdAt && b.createdAt) {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === 'duration' && (a.duration || 0) && (b.duration || 0)) {
      return (b.duration || 0) - (a.duration || 0);
    }
    if (sortBy === 'title') {
      return a.title.localeCompare(b.title);
    }
    return 0;
  });

  const stats = {
    total: episodes.length,
    published: episodes.filter(e => e.status === 'published').length,
    drafts: episodes.filter(e => e.status === 'draft').length,
    scheduled: episodes.filter(e => e.status === 'scheduled').length,
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/podcast')}
                className="p-2 text-slate-500 hover:text-slate-300 hover:bg-slate-900 rounded-md transition-all"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                  <Video className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h1 className="text-sm font-medium text-slate-300">All Episodes</h1>
                  <p className="text-xs text-slate-600">Manage your podcast library</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => router.push('/podcast/new')}
              className="px-4 py-1.5 text-xs font-medium rounded-md bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:opacity-90 transition-all flex items-center gap-1.5"
            >
              <Plus className="h-3 w-3" />
              New Episode
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="p-5 rounded-lg bg-slate-900/50 border border-slate-800">
            <p className="text-2xl font-medium text-slate-300">{stats.total}</p>
            <p className="text-xs text-slate-600">Total Episodes</p>
          </div>
          <div className="p-5 rounded-lg bg-slate-900/50 border border-slate-800">
            <p className="text-2xl font-medium text-slate-300">{stats.published}</p>
            <p className="text-xs text-slate-600">Published</p>
          </div>
          <div className="p-5 rounded-lg bg-slate-900/50 border border-slate-800">
            <p className="text-2xl font-medium text-slate-300">{stats.drafts}</p>
            <p className="text-xs text-slate-600">Drafts</p>
          </div>
          <div className="p-5 rounded-lg bg-slate-900/50 border border-slate-800">
            <p className="text-2xl font-medium text-slate-300">{stats.scheduled}</p>
            <p className="text-xs text-slate-600">Scheduled</p>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-lg bg-slate-900/50 border border-slate-800 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 h-4 w-4 text-slate-600" />
                <input
                  type="text"
                  placeholder="Search episodes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-md text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 transition-all"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                  className="appearance-none pl-9 pr-8 py-2 bg-slate-800 border border-slate-700 rounded-md text-sm text-slate-300 focus:outline-none focus:border-purple-500/50 transition-all cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="published">Published</option>
                  <option value="draft">Drafts</option>
                </select>
                <Filter className="absolute left-3 h-4 w-4 text-slate-600" />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="appearance-none px-4 py-2 bg-slate-800 border border-slate-700 rounded-md text-sm text-slate-300 focus:outline-none focus:border-purple-500/50 transition-all cursor-pointer"
              >
                <option value="date">Sort by Date</option>
                <option value="duration">Sort by Duration</option>
                <option value="views">Sort by Views</option>
              </select>
            </div>
          </div>
        </div>

        {/* Episodes List */}
        <div className="rounded-lg bg-slate-900/50 border border-slate-800 overflow-hidden">
          <div className="divide-y divide-slate-800">
            {sortedEpisodes.length === 0 ? (
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
              sortedEpisodes.map((episode) => (
                <EpisodeCard
                  key={episode.id}
                  episode={episode}
                  showMenu={showMenu === episode.id}
                  onToggleMenu={() => setShowMenu(showMenu === episode.id ? null : episode.id)}
                  onEdit={() => setEditingEpisode(episode)}
                  onDelete={() => handleDelete(episode.id)}
                  onPublish={() => handlePublish(episode.id)}
                />
              ))
            )}
          </div>
        </div>
      </main>

      {/* Edit Modal */}
      {editingEpisode && (
        <EditEpisodeModal
          episode={editingEpisode}
          isOpen={!!editingEpisode}
          onClose={() => setEditingEpisode(null)}
          onSave={loadEpisodes}
        />
      )}
    </div>
  );
}

function EpisodeCard({
  episode,
  showMenu,
  onToggleMenu,
  onEdit,
  onDelete,
  onPublish,
}: {
  episode: Episode;
  showMenu: boolean;
  onToggleMenu: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onPublish: () => void;
}) {
  const formatDuration = (seconds?: number) => {
    if (!seconds) return null;
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-4 hover:bg-slate-800/30 transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
            {episode.status === 'published' ? (
              <Play className="h-8 w-8 text-purple-400" />
            ) : episode.status === 'recording' ? (
              <Mic className="h-8 w-8 text-red-400" />
            ) : (
              <Video className="h-8 w-8 text-slate-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-sm font-medium text-slate-300 truncate">{episode.title}</h4>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                episode.status === 'published' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                episode.status === 'recording' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                episode.status === 'scheduled' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                'bg-slate-800 text-slate-400 border border-slate-700'
              }`}>
                {episode.status}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-600">
              {episode.createdAt && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(episode.createdAt).toLocaleDateString()}
                </span>
              )}
              {formatDuration(episode.duration) && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDuration(episode.duration)}
                </span>
              )}
              {episode.guests && episode.guests.length > 0 && (
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {episode.guests.length} guest{episode.guests.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {episode.recordingUrl && (
            <a
              href={episode.recordingUrl}
              download
              className="p-2 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-md transition-all"
              title="Download"
            >
              <Download className="h-4 w-4" />
            </a>
          )}
          <button
            onClick={onEdit}
            className="p-2 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-md transition-all"
            title="Edit"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <div className="relative">
            <button
              onClick={onToggleMenu}
              className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-md transition-all"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-1 w-48 bg-slate-900 border border-slate-800 rounded-md shadow-xl overflow-hidden z-50">
                <button
                  onClick={onEdit}
                  className="w-full px-3 py-2 text-left text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-300 transition-all flex items-center gap-2"
                >
                  <Edit2 className="h-3 w-3" />
                  Edit Details
                </button>
                {episode.status === 'draft' && (
                  <button
                    onClick={onPublish}
                    className="w-full px-3 py-2 text-left text-xs text-green-400 hover:bg-slate-800 transition-all flex items-center gap-2 border-t border-slate-800"
                  >
                    <Play className="h-3 w-3" />
                    Publish Now
                  </button>
                )}
                <button
                  onClick={onDelete}
                  className="w-full px-3 py-2 text-left text-xs text-slate-500 hover:bg-slate-800 hover:text-slate-400 transition-all flex items-center gap-2 border-t border-slate-800"
                >
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
