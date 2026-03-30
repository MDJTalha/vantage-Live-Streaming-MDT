'use client';

import { useState, useEffect } from 'react';
import { Button } from '@vantage/ui';

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

  useEffect(() => {
    fetchConsents();
  }, []);

  async function fetchConsents() {
    try {
      const response = await fetch('/api/v1/gdpr/consent', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setConsents(data.data);
      }
    } catch (error) {
      console.error('Error fetching consents:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function updateConsent(consentType: string, granted: boolean) {
    try {
      const response = await fetch('/api/v1/gdpr/consent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ consentType, granted }),
      });

      if (response.ok) {
        fetchConsents();
      }
    } catch (error) {
      console.error('Error updating consent:', error);
    }
  }

  async function requestExport() {
    setExportStatus('processing');
    
    try {
      const response = await fetch('/api/v1/gdpr/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ email: 'user@example.com' }),
      });

      if (response.ok) {
        setExportStatus('completed');
      } else {
        setExportStatus('failed');
      }
    } catch (error) {
      setExportStatus('failed');
    }
  }

  async function deleteAccount() {
    if (deleteConfirm !== 'DELETE') return;

    try {
      const response = await fetch('/api/v1/gdpr/account', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (response.ok) {
        localStorage.removeItem('accessToken');
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Error deleting account:', error);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold">Privacy Settings</h1>

      {/* Consent Management */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Data Permissions</h2>
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
      </section>

      {/* Data Export */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Download Your Data</h2>
        <p className="text-gray-600 mb-4">
          Get a copy of all your data stored in VANTAGE. This includes your profile, 
          meetings, messages, and settings.
        </p>
        <Button
          variant="primary"
          onClick={requestExport}
          disabled={exportStatus === 'processing'}
        >
          {exportStatus === 'processing' ? 'Processing...' : 'Request Data Export'}
        </Button>
        {exportStatus === 'completed' && (
          <p className="text-green-600 mt-2">
            Export request submitted. You'll receive an email when ready.
          </p>
        )}
        {exportStatus === 'failed' && (
          <p className="text-red-600 mt-2">
            Export request failed. Please try again.
          </p>
        )}
      </section>

      {/* Account Deletion */}
      <section className="bg-white rounded-lg shadow p-6 border border-red-200">
        <h2 className="text-xl font-semibold mb-4 text-red-600">Delete Your Account</h2>
        <p className="text-gray-600 mb-4">
          This action is irreversible. All your data will be permanently deleted.
        </p>
        <div className="space-y-4">
          <input
            type="text"
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder="Type DELETE to confirm"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
          <Button
            variant="destructive"
            onClick={deleteAccount}
            disabled={deleteConfirm !== 'DELETE'}
          >
            Permanently Delete Account
          </Button>
        </div>
      </section>
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
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <div>
        <h3 className="font-medium">{title}</h3>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <button
        onClick={() => onToggle(!granted)}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          granted ? 'bg-blue-600' : 'bg-gray-300'
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
