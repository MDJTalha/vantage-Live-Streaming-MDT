'use client';

import { useState, useEffect } from 'react';
import { X, Save, Mic, Video, Calendar, Clock } from 'lucide-react';
import podcastService, { type PodcastEpisode } from '@/services/PodcastService';

interface EditEpisodeModalProps {
  episode: PodcastEpisode;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function EditEpisodeModal({ episode, isOpen, onClose, onSave }: EditEpisodeModalProps) {
  const [title, setTitle] = useState(episode.title);
  const [description, setDescription] = useState(episode.description || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTitle(episode.title);
    setDescription(episode.description || '');
    setError(null);
  }, [episode]);

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await podcastService.updateEpisode(episode.id, {
        title: title.trim(),
        description: description.trim(),
      });
      onSave();
      onClose();
    } catch (err) {
      setError('Failed to save changes');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Not recorded';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'draft':
        return 'bg-slate-800 text-slate-400 border-slate-700';
      case 'recording':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'scheduled':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-slate-900 rounded-xl border border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
              {episode.recordingType === 'video' ? (
                <Video className="h-5 w-5 text-white" />
              ) : (
                <Mic className="h-5 w-5 text-white" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-medium text-slate-200">Edit Episode</h2>
              <p className="text-xs text-slate-500">Modify episode details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(episode.status)}`}>
              {episode.status}
            </span>
            {episode.publishedAt && (
              <span className="text-xs text-slate-500">
                Published {new Date(episode.publishedAt).toLocaleDateString()}
              </span>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Episode Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
              placeholder="Episode title"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all resize-none"
              placeholder="What is this episode about?"
            />
          </div>

          {/* Episode Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-slate-500" />
                <span className="text-xs text-slate-500">Duration</span>
              </div>
              <p className="text-sm font-medium text-slate-300">{formatDuration(episode.duration)}</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-slate-500" />
                <span className="text-xs text-slate-500">Created</span>
              </div>
              <p className="text-sm font-medium text-slate-300">
                {new Date(episode.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Guests */}
          {episode.guests && episode.guests.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Guests
              </label>
              <div className="flex flex-wrap gap-2">
                {episode.guests.map((guest, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 text-xs font-medium rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400"
                  >
                    {guest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Recording Type */}
          <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
            <div className="flex items-center gap-2">
              {episode.recordingType === 'video' ? (
                <Video className="h-4 w-4 text-purple-400" />
              ) : (
                <Mic className="h-4 w-4 text-purple-400" />
              )}
              <span className="text-sm text-slate-400">Recording Type:</span>
              <span className="text-sm font-medium text-slate-300 capitalize">
                {episode.recordingType === 'video' ? 'Video Podcast' : 'Audio Only'}
              </span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-300 hover:border-slate-600 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 text-sm font-medium rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditEpisodeModal;
