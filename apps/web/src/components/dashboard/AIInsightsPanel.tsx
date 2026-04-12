'use client';

import { Sparkles, Brain, TrendingUp, CheckCircle2, Video, FileText, Target, ArrowRight } from 'lucide-react';

interface AIInsights {
  dailyBriefing: string[];
  pendingActionItems: number;
  meetingsToday: number;
  recordingsReady: number;
  sentimentTrend: 'positive' | 'neutral' | 'negative';
  productivityScore: number;
}

interface AIInsightsPanelProps {
  insights: AIInsights | null;
}

export function AIInsightsPanel({ insights }: AIInsightsPanelProps) {
  if (!insights) {
    return (
      <div className="rounded-2xl bg-slate-900/50 border border-slate-800 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-lg font-bold text-white">AI Insights</h2>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-slate-700 border-t-purple-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const getSentimentColor = (trend: string) => {
    switch (trend) {
      case 'positive': return 'text-emerald-400';
      case 'neutral': return 'text-amber-400';
      case 'negative': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  const getSentimentIcon = (trend: string) => {
    switch (trend) {
      case 'positive': return <TrendingUp className="h-5 w-5 text-emerald-400" />;
      case 'neutral': return <TrendingUp className="h-5 w-5 text-amber-400" />;
      case 'negative': return <TrendingUp className="h-5 w-5 text-red-400" />;
      default: return <TrendingUp className="h-5 w-5 text-slate-400" />;
    }
  };

  return (
    <div className="rounded-2xl bg-slate-900/50 border border-slate-800 overflow-hidden">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">AI Insights</h2>
            <p className="text-xs text-slate-500">Powered by Vantage AI</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Daily Briefing */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-white">Daily Briefing</h3>
          </div>
          <div className="space-y-2">
            {insights.dailyBriefing.map((item, index) => (
              <div
                key={index}
                className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-sm text-slate-300"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Video className="h-4 w-4 text-blue-400" />
              <span className="text-xs text-slate-400">Meetings Today</span>
            </div>
            <p className="text-2xl font-bold text-white">{insights.meetingsToday}</p>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-amber-400" />
              <span className="text-xs text-slate-400">Action Items</span>
            </div>
            <p className="text-2xl font-bold text-white">{insights.pendingActionItems}</p>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-emerald-400" />
              <span className="text-xs text-slate-400">Recordings Ready</span>
            </div>
            <p className="text-2xl font-bold text-white">{insights.recordingsReady}</p>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-purple-400" />
              <span className="text-xs text-slate-400">Productivity</span>
            </div>
            <p className="text-2xl font-bold text-white">{insights.productivityScore}%</p>
          </div>
        </div>

        {/* Sentiment Trend */}
        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getSentimentIcon(insights.sentimentTrend)}
              <div>
                <p className="text-sm font-semibold text-white">Sentiment Trend</p>
                <p className={`text-xs ${getSentimentColor(insights.sentimentTrend)} capitalize`}>
                  {insights.sentimentTrend}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${
                insights.sentimentTrend === 'positive' ? 'bg-emerald-400' :
                insights.sentimentTrend === 'neutral' ? 'bg-amber-400' : 'bg-red-400'
              }`} />
              <div className={`w-2 h-2 rounded-full ${
                insights.sentimentTrend === 'positive' ? 'bg-emerald-400' :
                insights.sentimentTrend === 'neutral' ? 'bg-amber-400' : 'bg-red-400'
              } opacity-60`} />
              <div className={`w-2 h-2 rounded-full ${
                insights.sentimentTrend === 'positive' ? 'bg-emerald-400' :
                insights.sentimentTrend === 'neutral' ? 'bg-amber-400' : 'bg-red-400'
              } opacity-30`} />
            </div>
          </div>
        </div>

        {/* View Full Report Link */}
        <button className="w-full p-3 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 hover:border-purple-500/40 transition-all flex items-center justify-between group">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-400" />
            <span className="text-sm font-semibold text-white">View Full AI Report</span>
          </div>
          <ArrowRight className="h-4 w-4 text-purple-400 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}
