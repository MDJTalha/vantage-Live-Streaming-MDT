'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Book, Code, Zap, Shield, Globe, Search, ChevronRight, FileText, Terminal, Layers, Lock } from 'lucide-react';
import { useState } from 'react';

const docCategories = [
  {
    icon: <Book className="h-6 w-6" />,
    title: 'Getting Started',
    description: 'Quick start guides and setup tutorials',
    articles: ['Installation Guide', 'Quick Start Tutorial', 'Configuration Basics', 'Your First Meeting'],
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: <Code className="h-6 w-6" />,
    title: 'API Reference',
    description: 'Complete REST and WebSocket API docs',
    articles: ['Authentication', 'Rooms API', 'Users API', 'Webhooks'],
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: 'Security',
    description: 'Encryption, compliance, and best practices',
    articles: ['End-to-End Encryption', 'SOC 2 Compliance', 'GDPR Guide', 'Security Best Practices'],
    color: 'from-emerald-500 to-green-500',
  },
  {
    icon: <Globe className="h-6 w-6" />,
    title: 'Integrations',
    description: 'Connect VANTAGE with your tools',
    articles: ['Slack Integration', 'Calendar Sync', 'SSO Setup', 'Custom Webhooks'],
    color: 'from-amber-500 to-orange-500',
  },
  {
    icon: <Terminal className="h-6 w-6" />,
    title: 'SDKs & Libraries',
    description: 'Client libraries for all platforms',
    articles: ['JavaScript SDK', 'React Components', 'iOS SDK', 'Android SDK'],
    color: 'from-red-500 to-rose-500',
  },
  {
    icon: <Layers className="h-6 w-6" />,
    title: 'Architecture',
    description: 'System design and infrastructure',
    articles: ['System Overview', 'Scalability Guide', 'Disaster Recovery', 'Performance Tuning'],
    color: 'from-indigo-500 to-violet-500',
  },
];

const popularArticles = [
  { title: 'How to create a meeting room', category: 'Getting Started', readTime: '3 min' },
  { title: 'Setting up SSO with SAML', category: 'Security', readTime: '8 min' },
  { title: 'API Authentication Guide', category: 'API Reference', readTime: '5 min' },
  { title: 'Integrating with Slack', category: 'Integrations', readTime: '6 min' },
  { title: 'Recording and Transcription', category: 'Features', readTime: '4 min' },
  { title: 'Managing User Permissions', category: 'Security', readTime: '7 min' },
];

export default function DocsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredArticles = popularArticles.filter(
    (a) =>
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Book className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-white">VANTAGE Docs</h1>
                  <p className="text-xs text-blue-300">Documentation & Guides</p>
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
            Documentation
          </h1>
          <p className="text-lg text-blue-200">
            Complete API reference, integration guides, and tutorials to help you build with VANTAGE.
          </p>
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-400" />
            <input
              type="text"
              placeholder="Search documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-[#1e293b] border border-blue-500/30 rounded-xl text-white placeholder:text-blue-300/50 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
        </div>
      </section>

      {/* Popular Articles */}
      <section className="px-6 pb-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-400" />
            Popular Articles
          </h2>
          <div className="space-y-3">
            {filteredArticles.map((article, i) => (
              <button
                key={i}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-[#1e293b] border border-blue-500/20 hover:border-blue-400 hover:bg-[#1e293b]/80 transition-all text-left group"
              >
                <div className="flex items-center gap-4">
                  <FileText className="h-5 w-5 text-blue-400" />
                  <div>
                    <p className="font-medium text-white group-hover:text-blue-300 transition-colors">{article.title}</p>
                    <p className="text-sm text-blue-300">{article.category} · {article.readTime} read</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-blue-400 group-hover:translate-x-1 transition-transform" />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Doc Categories */}
      <section className="px-6 pb-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-xl font-bold text-white mb-6">Browse by Category</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {docCategories.map((cat, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-[#1e293b] border border-blue-500/20 hover:border-blue-400 transition-all group cursor-pointer"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center mb-4 text-white group-hover:scale-110 transition-transform`}>
                  {cat.icon}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{cat.title}</h3>
                <p className="text-sm text-blue-200 mb-4">{cat.description}</p>
                <ul className="space-y-2">
                  {cat.articles.map((article, j) => (
                    <li key={j} className="text-sm text-blue-300 hover:text-white transition-colors cursor-pointer flex items-center gap-2">
                      <ChevronRight className="h-3 w-3" />
                      {article}
                    </li>
                  ))}
                </ul>
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
