'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Play, Clock, BookOpen, Star, Users, ChevronRight, Video, Monitor, Mic, Shield } from 'lucide-react';
import { useState } from 'react';

const tutorialCategories = [
  { name: 'All', count: 24 },
  { name: 'Getting Started', count: 8 },
  { name: 'Host Guides', count: 6 },
  { name: 'Participant Guides', count: 5 },
  { name: 'Advanced Features', count: 5 },
];

const tutorials = [
  {
    title: 'Getting Started with VANTAGE',
    description: 'Learn the basics of creating and joining meetings in under 5 minutes.',
    duration: '4:32',
    category: 'Getting Started',
    views: '12.5K',
    thumbnail: 'from-blue-600 to-cyan-600',
    icon: <Video className="h-8 w-8" />,
  },
  {
    title: 'Hosting Your First Meeting',
    description: 'Step-by-step guide to setting up and running a professional meeting.',
    duration: '8:15',
    category: 'Host Guides',
    views: '8.3K',
    thumbnail: 'from-purple-600 to-pink-600',
    icon: <Monitor className="h-8 w-8" />,
  },
  {
    title: 'Screen Sharing & Collaboration',
    description: 'Master screen sharing, whiteboard, and real-time collaboration tools.',
    duration: '6:45',
    category: 'Advanced Features',
    views: '6.1K',
    thumbnail: 'from-emerald-600 to-green-600',
    icon: <Monitor className="h-8 w-8" />,
  },
  {
    title: 'Audio & Video Best Practices',
    description: 'Optimize your audio and video settings for the best meeting experience.',
    duration: '5:20',
    category: 'Participant Guides',
    views: '9.7K',
    thumbnail: 'from-amber-600 to-orange-600',
    icon: <Mic className="h-8 w-8" />,
  },
  {
    title: 'Security & Privacy Settings',
    description: 'Configure security settings to protect your meetings and data.',
    duration: '7:10',
    category: 'Advanced Features',
    views: '5.4K',
    thumbnail: 'from-red-600 to-rose-600',
    icon: <Shield className="h-8 w-8" />,
  },
  {
    title: 'Recording & Transcription',
    description: 'Learn how to record meetings and use AI-powered transcription.',
    duration: '6:00',
    category: 'Advanced Features',
    views: '7.2K',
    thumbnail: 'from-indigo-600 to-violet-600',
    icon: <Video className="h-8 w-8" />,
  },
];

export default function TutorialsPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredTutorials = activeCategory === 'All'
    ? tutorials
    : tutorials.filter((t) => t.category === activeCategory);

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#020617]/95 backdrop-blur-xl border-b border-blue-500/20">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="p-2 text-blue-300 hover:text-white hover:bg-blue-500/20 rounded-lg transition-all"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Play className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-white">Video Tutorials</h1>
                  <p className="text-xs text-blue-300">Learn VANTAGE step by step</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 text-sm font-medium text-blue-300 hover:text-white hover:bg-blue-500/20 rounded-lg transition-all"
              >
                Dashboard
              </button>
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 rounded-lg transition-all"
              >
                Home
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 px-6 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold">
            Video Tutorials
          </h1>
          <p className="text-lg text-blue-200">
            Step-by-step guides for hosts and participants. Learn everything you need to run successful meetings.
          </p>
          <div className="flex items-center justify-center gap-8 text-sm text-blue-300">
            <span className="flex items-center gap-2"><Play className="h-4 w-4" /> 24 Videos</span>
            <span className="flex items-center gap-2"><Clock className="h-4 w-4" /> 2.5 Hours Total</span>
            <span className="flex items-center gap-2"><Users className="h-4 w-4" /> 50K+ Views</span>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="px-6 pb-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap gap-3 justify-center">
            {tutorialCategories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setActiveCategory(cat.name)}
                className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeCategory === cat.name
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-[#1e293b] text-blue-300 hover:text-white hover:bg-[#1e293b]/80 border border-blue-500/20'
                }`}
              >
                {cat.name}
                <span className="ml-2 text-xs opacity-70">({cat.count})</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Tutorial Grid */}
      <section className="px-6 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTutorials.map((tutorial, i) => (
              <div
                key={i}
                className="group rounded-2xl bg-[#1e293b] border border-blue-500/20 overflow-hidden hover:border-blue-400 transition-all cursor-pointer"
              >
                {/* Thumbnail */}
                <div className={`relative h-48 bg-gradient-to-br ${tutorial.thumbnail} flex items-center justify-center`}>
                  <div className="text-white/80 group-hover:text-white group-hover:scale-110 transition-all">
                    {tutorial.icon}
                  </div>
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 group-hover:scale-110 transition-all">
                      <Play className="h-8 w-8 text-white ml-1" />
                    </div>
                  </div>
                  <div className="absolute bottom-3 right-3 px-2 py-1 rounded-md bg-black/60 text-xs font-medium">
                    {tutorial.duration}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 text-xs font-medium">
                      {tutorial.category}
                    </span>
                    <span className="text-xs text-blue-400">{tutorial.views} views</span>
                  </div>
                  <h3 className="font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">
                    {tutorial.title}
                  </h3>
                  <p className="text-sm text-blue-200 mb-4 line-clamp-2">
                    {tutorial.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <button className="text-sm font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1 group/btn">
                      Watch Now
                      <ChevronRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                    <button className="p-2 text-blue-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-all">
                      <Star className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-blue-500/20 text-center text-sm text-blue-300">
        <p>© 2026 VANTAGE Executive. All rights reserved.</p>
      </footer>
    </div>
  );
}
