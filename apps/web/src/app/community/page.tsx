'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, MessageSquare, Users, TrendingUp, Award, Search, ChevronRight, Star, MessageCircle, Heart, Eye } from 'lucide-react';
import { useState } from 'react';

const communityStats = [
  { icon: <Users className="h-6 w-6" />, value: '15,000+', label: 'Members' },
  { icon: <MessageSquare className="h-6 w-6" />, value: '50,000+', label: 'Discussions' },
  { icon: <TrendingUp className="h-6 w-6" />, value: '1,200+', label: 'Solutions' },
  { icon: <Award className="h-6 w-6" />, value: '500+', label: 'Experts' },
];

const discussionTopics = [
  {
    title: 'Best practices for large meetings (100+ participants)',
    author: 'Sarah Chen',
    avatar: 'SC',
    replies: 24,
    views: 1250,
    likes: 45,
    category: 'Best Practices',
    time: '2 hours ago',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    title: 'How to integrate VANTAGE with Microsoft Teams',
    author: 'James Wilson',
    avatar: 'JW',
    replies: 18,
    views: 890,
    likes: 32,
    category: 'Integrations',
    time: '5 hours ago',
    color: 'from-purple-500 to-pink-500',
  },
  {
    title: 'Troubleshooting audio quality issues',
    author: 'Maria Garcia',
    avatar: 'MG',
    replies: 31,
    views: 2100,
    likes: 67,
    category: 'Troubleshooting',
    time: '1 day ago',
    color: 'from-emerald-500 to-green-500',
  },
  {
    title: 'Feature request: Virtual backgrounds for mobile',
    author: 'Alex Kumar',
    avatar: 'AK',
    replies: 42,
    views: 3400,
    likes: 89,
    category: 'Feature Requests',
    time: '2 days ago',
    color: 'from-amber-500 to-orange-500',
  },
  {
    title: 'Setting up SSO for enterprise deployment',
    author: 'David Park',
    avatar: 'DP',
    replies: 15,
    views: 780,
    likes: 28,
    category: 'Enterprise',
    time: '3 days ago',
    color: 'from-red-500 to-rose-500',
  },
];

const categories = [
  { name: 'All Topics', count: 50000 },
  { name: 'Best Practices', count: 8500 },
  { name: 'Integrations', count: 6200 },
  { name: 'Troubleshooting', count: 12000 },
  { name: 'Feature Requests', count: 9800 },
  { name: 'Enterprise', count: 4500 },
  { name: 'Announcements', count: 350 },
];

export default function CommunityPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All Topics');

  const filteredDiscussions = activeCategory === 'All Topics'
    ? discussionTopics
    : discussionTopics.filter((d) => d.category === activeCategory);

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
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-white">Community</h1>
                  <p className="text-xs text-blue-300">Connect with other users</p>
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
            Community Forum
          </h1>
          <p className="text-lg text-blue-200">
            Join our community forum and connect with users. Share tips, ask questions, and learn from others.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {communityStats.map((stat, i) => (
              <div key={i} className="p-4 rounded-xl bg-[#1e293b] border border-blue-500/20">
                <div className="text-blue-400 flex justify-center mb-2">{stat.icon}</div>
                <div className="text-xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-blue-300">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Search & Categories */}
      <section className="px-6 pb-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-400" />
            <input
              type="text"
              placeholder="Search discussions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-[#1e293b] border border-blue-500/30 rounded-xl text-white placeholder:text-blue-300/50 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setActiveCategory(cat.name)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeCategory === cat.name
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-[#1e293b] text-blue-300 hover:text-white hover:bg-[#1e293b]/80 border border-blue-500/20'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Discussions */}
      <section className="px-6 pb-20">
        <div className="max-w-4xl mx-auto space-y-4">
          {filteredDiscussions.map((discussion, i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-[#1e293b] border border-blue-500/20 hover:border-blue-400 transition-all cursor-pointer group"
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${discussion.color} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                  {discussion.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 text-xs font-medium">
                      {discussion.category}
                    </span>
                    <span className="text-xs text-blue-400">{discussion.time}</span>
                  </div>
                  <h3 className="font-bold text-white mb-1 group-hover:text-blue-300 transition-colors">
                    {discussion.title}
                  </h3>
                  <p className="text-sm text-blue-300">by {discussion.author}</p>
                </div>
                <div className="flex items-center gap-4 text-sm text-blue-400 flex-shrink-0">
                  <span className="flex items-center gap-1"><MessageCircle className="h-4 w-4" /> {discussion.replies}</span>
                  <span className="flex items-center gap-1"><Heart className="h-4 w-4" /> {discussion.likes}</span>
                  <span className="flex items-center gap-1"><Eye className="h-4 w-4" /> {discussion.views}</span>
                </div>
              </div>
            </div>
          ))}

          <button className="w-full py-4 rounded-xl bg-[#1e293b] border border-blue-500/20 text-blue-400 hover:text-white hover:border-blue-400 transition-all font-medium flex items-center justify-center gap-2">
            Load More Discussions
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-blue-500/20 text-center text-sm text-blue-300">
        <p>© 2026 VANTAGE Executive. All rights reserved.</p>
      </footer>
    </div>
  );
}
