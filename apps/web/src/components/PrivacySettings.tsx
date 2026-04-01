'use client';

import { useState, useEffect } from 'react';
import { Button, Badge } from '@vantage/ui';
import { CheckCircle, AlertCircle, Download, Trash2, Loader2 } from 'lucide-react';

interface Consent {
  consentType: string;
  granted: boolean;
  grantedAt: string;
  withdrawnAt?: string;
}

export function PrivacySettings() {
  const [consents, setConsents] = useState<Consent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [exportStatus, setExportStatus] = useState<string>('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchConsents();
  }, []);

  async function fetchConsents() {
    try {
      // In production, fetch from API
      // For now, use mock data
      setConsents([
        { consentType: 'marketing', granted: false, grantedAt: '' },
        { consentType: 'analytics', granted: true, grantedAt: new Date().toISOString() },
        { consentType: 'recording', granted: true, grantedAt: new Date().toISOString() },
        { consentType: 'transcription', granted: false, grantedAt: '' },
      ]);
    } catch (error) {
      console.error('Error fetching consents:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function updateConsent(consentType: string, granted: boolean) {
    try {
      // In production, POST to API
      // For now, update local state
      setConsents(prev =>
        prev.map(c =>
          c.consentType === consentType
            ? { ...c, granted, grantedAt: granted ? new Date().toISOString() : '' }
            : c
        )
      );
    } catch (error) {
      console.error('Error updating consent:', error);
    }
  }

  async function requestExport() {
    setExportStatus('processing');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      setExportStatus('completed');
    } catch (error) {
      setExportStatus('failed');
    }
  }

  async function deleteAccount() {
    if (deleteConfirm !== 'DELETE') return;

    setIsDeleting(true);
    try {
      // In production, DELETE account via API
      alert('Account deletion would happen here');
      setIsDeleting(false);
      setDeleteConfirm('');
    } catch (error) {
      console.error('Error deleting account:', error);
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 space-y-6">
      {/* Consent Management */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Data Permissions</h3>
        <div className="space-y-4">
          <ConsentToggle
            title="Marketing Communications"
            description="Receive emails about new features and updates"
            consentType="marketing"
            granted={consents.find(c => c.consentType === 'marketing')?.granted ?? false}
            onToggle={(granted) => updateConsent('marketing', granted)}
          />
          <ConsentToggle
            title="Analytics"
            description="Help improve VANTAGE with usage data"
            consentType="analytics"
            granted={consents.find(c => c.consentType === 'analytics')?.granted ?? false}
            onToggle={(granted) => updateConsent('analytics', granted)}
          />
          <ConsentToggle
            title="Meeting Recording"
            description="Allow hosts to record meetings you join"
            consentType="recording"
            granted={consents.find(c => c.consentType === 'recording')?.granted ?? false}
            onToggle={(granted) => updateConsent('recording', granted)}
          />
          <ConsentToggle
            title="AI Transcription"
            description="Enable automatic transcription of meetings"
            consentType="transcription"
            granted={consents.find(c => c.consentType === 'transcription')?.granted ?? false}
            onToggle={(granted) => updateConsent('transcription', granted)}
          />
        </div>
      </div>

      {/* Data Export */}
      <div className="border-t border-slate-700 pt-6">
        <h3 className="text-lg font-semibold text-white mb-2">Download Your Data</h3>
        <p className="text-sm text-slate-400 mb-4">
          Get a copy of all your data stored in VANTAGE. This includes your profile,
          meetings, messages, and settings.
        </p>
        <Button
          onClick={requestExport}
          disabled={exportStatus === 'processing'}
          className="bg-amber-600 hover:bg-amber-500 text-white"
        >
          {exportStatus === 'processing' ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Request Data Export
            </>
          )}
        </Button>
        {exportStatus === 'completed' && (
          <div className="mt-3 p-3 rounded-lg bg-green-600/10 border border-green-600/30 text-green-400 text-sm flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Export request submitted. You'll receive an email when ready.
          </div>
        )}
        {exportStatus === 'failed' && (
          <div className="mt-3 p-3 rounded-lg bg-red-600/10 border border-red-600/30 text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Export request failed. Please try again.
          </div>
        )}
      </div>

      {/* Account Deletion */}
      <div className="border-t border-slate-700 pt-6">
        <h3 className="text-lg font-semibold text-red-400 mb-2 flex items-center gap-2">
          <Trash2 className="h-5 w-5" />
          Delete Your Account
        </h3>
        <p className="text-sm text-slate-400 mb-4">
          This action is irreversible. All your data will be permanently deleted.
        </p>
        <div className="space-y-3">
          <input
            type="text"
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder="Type DELETE to confirm"
            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-red-500/50"
          />
          <Button
            variant="destructive"
            onClick={deleteAccount}
            disabled={deleteConfirm !== 'DELETE' || isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Permanently Delete Account
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface ConsentToggleProps {
  title: string;
  description: string;
  consentType: string;
  granted: boolean;
  onToggle: (granted: boolean) => void;
}

function ConsentToggle({ title, description, granted, onToggle }: ConsentToggleProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-700 last:border-0">
      <div className="flex-1">
        <h3 className="font-medium text-white">{title}</h3>
        <p className="text-sm text-slate-400 mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => onToggle(!granted)}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          granted ? 'bg-amber-600' : 'bg-slate-600'
        }`}
      >
        <div
          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
            granted ? 'translate-x-7' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

export default PrivacySettings;
