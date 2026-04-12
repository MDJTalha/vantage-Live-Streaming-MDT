'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@vantage/ui';
import { Sparkles, Database, Brain, CheckCircle, AlertTriangle, Search, ArrowLeft } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface AuditResult {
  audit_timestamp: string;
  issues_found: number;
  issues_by_table: Record<string, number>;
  detailed_issues: any;
  ai_recommendations: string;
}

export default function AIDataCorrection() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  // Auth guard - redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Show loading or redirect state
  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617]">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500/20 border-t-blue-500" />
      </div>
    );
  }

  const [isRunning, setIsRunning] = useState(false);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [corrections, setCorrections] = useState<any[]>([]);
  const [aiResponse, setAiResponse] = useState('');

  const runDataAudit = async () => {
    setIsRunning(true);
    try {
      const response = await fetch(`${API_URL}/api/v1/ai/audit-quality`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      const data = await response.json();
      setAuditResult(data.audit);
    } catch (error) {
      console.error('Error running audit:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const correctMeetingData = async (meetingId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/ai/correct-meeting/${meetingId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      setCorrections(prev => [...prev, data]);
    } catch (error) {
      console.error('Error correcting meeting:', error);
    }
  };

  const enhanceRecordings = async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/ai/enhance-recordings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      const data = await response.json();
      alert(`Enhanced ${data.recordingsEnhanced} recordings with AI tags!`);
    } catch (error) {
      console.error('Error enhancing recordings:', error);
    }
  };

  const buildKnowledgeGraph = async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/ai/build-knowledge`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      const data = await response.json();
      alert(`Built knowledge graph from ${data.meetingsProcessed} meetings!`);
    } catch (error) {
      console.error('Error building knowledge graph:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617]">
      {/* Header with back button */}
      <header className="border-b border-blue-500/20 bg-[#0a0f1f]/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 rounded-lg hover:bg-blue-500/10 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-blue-300" />
            </button>
            <div className="flex items-center gap-3">
              <Brain className="h-8 w-8 text-blue-400" />
              <div>
                <h1 className="text-2xl font-bold text-white">AI Data Correction</h1>
                <p className="text-sm text-blue-200">
                  Autonomous AI agents for data quality, correction, and knowledge extraction
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-8">

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Button
            onClick={runDataAudit}
            disabled={isRunning}
            className="h-24 flex flex-col gap-2 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600"
          >
            <Search className="h-6 w-6" />
            <span>Run Data Audit</span>
          </Button>

          <Button
            onClick={enhanceRecordings}
            className="h-24 flex flex-col gap-2 bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600"
          >
            <Sparkles className="h-6 w-6" />
            <span>Enhance Recordings</span>
          </Button>

          <Button
            onClick={buildKnowledgeGraph}
            className="h-24 flex flex-col gap-2 bg-gradient-to-br from-green-600 to-green-700 hover:from-green-500 hover:to-green-600"
          >
            <Database className="h-6 w-6" />
            <span>Build Knowledge</span>
          </Button>

          <Button
            onClick={() => correctMeetingData('demo-meeting-id')}
            className="h-24 flex flex-col gap-2 bg-gradient-to-br from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600"
          >
            <CheckCircle className="h-6 w-6" />
            <span>Fix Meeting Data</span>
          </Button>
        </div>

        {/* Audit Results */}
        {auditResult && (
          <div className="bg-[#1e293b] border border-blue-500/20 rounded-2xl p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              Data Quality Audit Results
            </h2>

            <div className="grid md:grid-cols-4 gap-4 mb-6">
              <div className="bg-[#0f172a] rounded-lg p-4">
                <p className="text-2xl font-bold text-white">{auditResult.issues_found}</p>
                <p className="text-sm text-blue-300">Total Issues</p>
              </div>
              {Object.entries(auditResult.issues_by_table).map(([table, count]) => (
                <div key={table} className="bg-[#0f172a] rounded-lg p-4">
                  <p className="text-2xl font-bold text-white">{count}</p>
                  <p className="text-sm text-blue-300 capitalize">{table}</p>
                </div>
              ))}
            </div>

            <div className="bg-[#0f172a] rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-300 mb-2">AI Recommendations</h3>
              <p className="text-white whitespace-pre-wrap">{auditResult.ai_recommendations}</p>
            </div>
          </div>
        )}

        {/* Corrections Log */}
        {corrections.length > 0 && (
          <div className="bg-[#1e293b] border border-blue-500/20 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Corrections Applied</h2>
            <div className="space-y-3">
              {corrections.map((correction, idx) => (
                <div key={idx} className="bg-[#0f172a] rounded-lg p-4">
                  <p className="text-white">Meeting: {correction.meetingId}</p>
                  <div className="mt-2 space-y-1">
                    {correction.corrections?.map((c: any, i: number) => (
                      <p key={i} className="text-sm text-blue-300">
                        • {c.field}: {c.old} → {c.new} ({c.reason})
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Chat */}
        <div className="mt-8 bg-[#1e293b] border border-blue-500/20 rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-400" />
            Ask AI About Your Data
          </h2>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Ask about meetings, users, recordings..."
              className="flex-1 bg-[#0f172a] border border-blue-500/20 rounded-xl px-4 py-3 text-white placeholder:text-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              value={aiResponse}
              onChange={(e) => setAiResponse(e.target.value)}
            />
            <Button className="bg-purple-600 hover:bg-purple-500">
              Ask AI
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
