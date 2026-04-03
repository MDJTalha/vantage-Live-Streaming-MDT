'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Sparkles, X, FileText, Video, Calendar, Clock, Users, ArrowRight, Loader2, MessageSquare, CheckCircle2, TrendingUp } from 'lucide-react';

interface SearchResult {
  type: 'meeting' | 'recording' | 'ai-insight';
  title: string;
  description: string;
  date?: string;
  participants?: number;
  duration?: string;
  relevance: number;
  icon: React.ReactNode;
}

interface AISearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

const mockMeetings = [
  { id: '1', name: 'Q1 Board Meeting', code: 'board-q1-2026', date: '2026-04-01', participants: 12, duration: '1h 30m', status: 'ended' },
  { id: '2', name: 'Investor Update Call', code: 'investor-apr', date: '2026-04-03', participants: 8, duration: '45m', status: 'scheduled' },
  { id: '3', name: 'Executive Strategy Session', code: 'strategy-2026', date: '2026-03-28', participants: 6, duration: '2h', status: 'ended' },
  { id: '4', name: 'Weekly Team Standup', code: 'standup-w14', date: '2026-04-02', participants: 25, duration: '30m', status: 'ended' },
  { id: '5', name: 'Product Launch Review', code: 'launch-review', date: '2026-03-25', participants: 15, duration: '1h', status: 'ended' },
];

const mockRecordings = [
  { id: 'r1', title: 'Q1 Board Meeting Recording', date: '2026-04-01', duration: '1h 30m', size: '2.4 GB' },
  { id: 'r2', title: 'Executive Strategy Session', date: '2026-03-28', duration: '2h', size: '3.1 GB' },
  { id: 'r3', title: 'Weekly Team Standup', date: '2026-04-02', duration: '30m', size: '450 MB' },
];

const aiResponses: Record<string, string> = {
  default: "I've analyzed your meeting history and found relevant results. Here's what I discovered based on your search.",
  meeting: "I found several meetings matching your query. The most relevant ones are listed below with their details.",
  recording: "I've searched through your recordings and found matches. You can access them from the recordings library.",
  summary: "Based on your meeting history, here's a summary of your recent activity and key insights.",
  action: "I've extracted action items from your recent meetings. Here are the pending tasks that need your attention.",
};

export default function AISearchModal({ isOpen, onClose, initialQuery = '' }: AISearchModalProps) {
  const [query, setQuery] = useState(initialQuery);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [aiResponse, setAiResponse] = useState('');
  const [showAIResponse, setShowAIResponse] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialQuery && isOpen) {
      setQuery(initialQuery);
      handleSearch(initialQuery);
    }
  }, [initialQuery, isOpen]);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setAiResponse('');
      setShowAIResponse(false);
      return;
    }

    setIsSearching(true);
    setResults([]);
    setAiResponse('');
    setShowAIResponse(false);

    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const q = searchQuery.toLowerCase();
    const newResults: SearchResult[] = [];

    // Search meetings
    const matchingMeetings = mockMeetings.filter(m =>
      m.name.toLowerCase().includes(q) ||
      m.code.toLowerCase().includes(q) ||
      m.date.includes(q)
    );

    matchingMeetings.forEach(m => {
      newResults.push({
        type: 'meeting',
        title: m.name,
        description: `Code: ${m.code} · ${m.date}`,
        date: m.date,
        participants: m.participants,
        duration: m.duration,
        relevance: 95,
        icon: <Video className="h-5 w-5" />,
      });
    });

    // Search recordings
    const matchingRecordings = mockRecordings.filter(r =>
      r.title.toLowerCase().includes(q) ||
      r.date.includes(q)
    );

    matchingRecordings.forEach(r => {
      newResults.push({
        type: 'recording',
        title: r.title,
        description: `${r.duration} · ${r.size}`,
        date: r.date,
        duration: r.duration,
        relevance: 85,
        icon: <FileText className="h-5 w-5" />,
      });
    });

    // Add AI insight if query suggests it
    if (q.includes('summary') || q.includes('insight') || q.includes('action') || q.includes('what') || q.includes('how')) {
      setShowAIResponse(true);
      let responseKey = 'default';
      if (q.includes('summary')) responseKey = 'summary';
      else if (q.includes('action')) responseKey = 'action';
      else if (q.includes('meeting')) responseKey = 'meeting';
      else if (q.includes('recording')) responseKey = 'recording';
      setAiResponse(aiResponses[responseKey]);
    }

    // If no results, add a helpful message
    if (newResults.length === 0 && !showAIResponse) {
      setShowAIResponse(true);
      setAiResponse(`I couldn't find exact matches for "${searchQuery}", but here are some suggestions:\n• Try searching by meeting name or code\n• Use keywords like "summary" or "action items"\n• Search by date (e.g., "April 2026")`);
    }

    setResults(newResults);
    setIsSearching(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4" onKeyDown={handleKeyDown}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Search Input */}
        <div className="p-4 border-b border-slate-800">
          <form onSubmit={handleSubmit} className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search meetings, recordings, or ask AI..."
                className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching || !query.trim()}
              className="px-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium flex items-center gap-2 transition-all"
            >
              {isSearching ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Sparkles className="h-5 w-5" />
              )}
              <span className="hidden sm:inline">AI Search</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </form>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {isSearching ? (
            <div className="p-8 text-center">
              <Loader2 className="h-8 w-8 text-blue-400 animate-spin mx-auto mb-4" />
              <p className="text-slate-400">AI is searching across your meetings and recordings...</p>
            </div>
          ) : results.length === 0 && !aiResponse ? (
            <div className="p-8 text-center">
              <Search className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 mb-2">Start typing to search</p>
              <p className="text-sm text-slate-500">Search meetings, recordings, or ask AI a question</p>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {/* AI Response */}
              {showAIResponse && aiResponse && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white mb-1">AI Assistant</p>
                      <p className="text-sm text-slate-300 whitespace-pre-line">{aiResponse}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Results List */}
              {results.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    {results.length} Result{results.length !== 1 ? 's' : ''} Found
                  </p>
                  <div className="space-y-2">
                    {results.map((result, i) => (
                      <div
                        key={i}
                        className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-blue-500/50 transition-all cursor-pointer group"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            result.type === 'meeting' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                          }`}>
                            {result.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-white group-hover:text-blue-300 transition-colors truncate">
                                {result.title}
                              </h4>
                              <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                                result.type === 'meeting' ? 'bg-blue-500/20 text-blue-300' : 'bg-purple-500/20 text-purple-300'
                              }`}>
                                {result.type === 'meeting' ? 'Meeting' : 'Recording'}
                              </span>
                            </div>
                            <p className="text-sm text-slate-400">{result.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                              {result.participants && (
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" /> {result.participants} participants
                                </span>
                              )}
                              {result.duration && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" /> {result.duration}
                                </span>
                              )}
                              {result.date && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" /> {result.date}
                                </span>
                              )}
                            </div>
                          </div>
                          <ArrowRight className="h-5 w-5 text-slate-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">Esc</kbd> Close</span>
            <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">Enter</kbd> Search</span>
          </div>
          <span>Powered by VANTAGE AI</span>
        </div>
      </div>
    </div>
  );
}
