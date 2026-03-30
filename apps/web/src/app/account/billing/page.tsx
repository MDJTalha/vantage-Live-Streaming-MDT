'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  CheckCircle,
  Plus,
  X,
  CreditCard,
  Users,
  Building2,
} from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  slug: string;
  billingEmail: string;
  subscriptionTier: 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  users?: any[];
}

const UPGRADE_OPTIONS = [
  {
    tier: 'STARTER',
    name: 'Starter Plan',
    price: 99,
    duration: '/month',
    features: [
      'Up to 50 participants',
      'Recording & playback',
      'Polls & Q&A',
      'Screen sharing',
      'Email support',
    ],
    isPopular: false,
  },
  {
    tier: 'PROFESSIONAL',
    name: 'Professional Plan',
    price: 399,
    duration: '/month',
    features: [
      'Up to 500 participants',
      'All Starter features',
      'Live transcription',
      'Advanced analytics',
      'Custom branding',
      'API access',
      'Priority support',
    ],
    isPopular: true,
  },
  {
    tier: 'ENTERPRISE',
    name: 'Enterprise Plan',
    price: 0,
    duration: 'Custom',
    features: [
      'Unlimited participants',
      'All Professional features',
      'Custom integrations',
      'White-label support',
      '24/7 phone support',
      'Dedicated account manager',
      'SLA guarantee',
    ],
    isPopular: false,
  },
];

export default function BillingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'upgrade' | 'billing'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  useEffect(() => {
    if (user) {
      loadOrganization();
    }
  }, [user]);

  async function loadOrganization() {
    try {
      // Try to load from API, fallback to demo data
      const org = await loadDemoOrganization();
      setOrganization(org);
    } catch (error) {
      console.error('Failed to load organization:', error);
      // Set demo data as fallback
      const demoOrg = await loadDemoOrganization();
      setOrganization(demoOrg);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadDemoOrganization(): Promise<Organization> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: 'demo-org-1',
          name: 'Demo Organization',
          slug: 'demo-org',
          billingEmail: user?.email || 'billing@example.com',
          subscriptionTier: 'FREE',
          users: [],
        });
      }, 500);
    });
  }

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) return;
    alert(`Invitation sent to ${inviteEmail}`);
    setInviteEmail('');
    setShowInviteModal(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 text-slate-500 hover:text-slate-300 hover:bg-slate-900 rounded-md transition-all"
              >
                <X className="h-4 w-4 rotate-45" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-slate-200">Billing & Subscription</h1>
                <p className="text-sm text-slate-500">Manage your organization, plan, and team members</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Overview Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Current Plan */}
          <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Current Plan</p>
                <h3 className="text-lg font-semibold text-slate-200 capitalize">{organization?.subscriptionTier}</h3>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              {organization?.subscriptionTier === 'FREE' 
                ? 'Free tier with basic features' 
                : 'Paid subscription active'}
            </p>
          </div>

          {/* Organization */}
          <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Organization</p>
                <h3 className="text-lg font-semibold text-slate-200">{organization?.name}</h3>
              </div>
            </div>
            <p className="text-xs text-slate-500">{organization?.billingEmail}</p>
          </div>

          {/* Team Members */}
          <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <Users className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Team Members</p>
                <h3 className="text-lg font-semibold text-slate-200">{organization?.users?.length || 0}</h3>
              </div>
            </div>
            <button
              onClick={() => setShowInviteModal(true)}
              className="text-xs font-medium text-purple-400 hover:text-purple-300 transition-all flex items-center gap-1"
            >
              <Plus className="h-3 w-3" />
              Invite Member
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex gap-2 border-b border-slate-800">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 text-sm font-medium transition-all ${
                activeTab === 'overview'
                  ? 'text-purple-400 border-b-2 border-purple-500'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('upgrade')}
              className={`px-4 py-2 text-sm font-medium transition-all ${
                activeTab === 'upgrade'
                  ? 'text-purple-400 border-b-2 border-purple-500'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Upgrade Plan
            </button>
            <button
              onClick={() => setActiveTab('billing')}
              className={`px-4 py-2 text-sm font-medium transition-all ${
                activeTab === 'billing'
                  ? 'text-purple-400 border-b-2 border-purple-500'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Billing Settings
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800">
              <h3 className="text-lg font-semibold text-slate-200 mb-4">Plan Features</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {organization?.subscriptionTier === 'FREE' && (
                  <>
                    <FeatureItem status="enabled" label="Up to 10 participants" />
                    <FeatureItem status="enabled" label="45 min group meetings" />
                    <FeatureItem status="enabled" label="Unlimited 1:1 meetings" />
                    <FeatureItem status="disabled" label="Recording" />
                    <FeatureItem status="disabled" label="Chat & Polling" />
                    <FeatureItem status="disabled" label="Analytics" />
                  </>
                )}
                {organization?.subscriptionTier !== 'FREE' && (
                  <p className="text-slate-500 text-sm">Premium features active</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'upgrade' && (
          <div className="grid md:grid-cols-3 gap-6">
            {UPGRADE_OPTIONS.map((option) => (
              <div
                key={option.tier}
                className={`p-6 rounded-xl border transition-all ${
                  option.isPopular
                    ? 'bg-purple-500/10 border-purple-500/50'
                    : 'bg-slate-900/50 border-slate-800'
                }`}
              >
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-slate-200">{option.name}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-slate-200">
                      {option.price === 0 ? 'Custom' : `$${option.price}`}
                    </span>
                    <span className="text-sm text-slate-500">{option.duration}</span>
                  </div>
                </div>
                <ul className="space-y-2 mb-6">
                  {option.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-400">
                      <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  className={`w-full py-2.5 text-sm font-medium rounded-lg transition-all ${
                    option.isPopular
                      ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:opacity-90'
                      : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-300 hover:border-slate-600'
                  }`}
                >
                  {option.price === 0 ? 'Contact Sales' : 'Upgrade'}
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="space-y-6">
            <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800">
              <h3 className="text-lg font-semibold text-slate-200 mb-4">Billing Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Billing Email</label>
                  <input
                    type="email"
                    value={organization?.billingEmail}
                    disabled
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-400 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Organization Name</label>
                  <input
                    type="text"
                    value={organization?.name}
                    disabled
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-400 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-200">Invite Team Member</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-2 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <input
              type="email"
              placeholder="Enter email address"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 transition-all mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowInviteModal(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-300 hover:border-slate-600 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleInviteMember}
                className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:opacity-90 transition-all"
              >
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FeatureItem({ status, label }: { status: 'enabled' | 'disabled'; label: string }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg ${status === 'enabled' ? 'bg-green-500/10' : 'bg-slate-800/50'}`}>
      <CheckCircle
        className={`h-5 w-5 flex-shrink-0 ${
          status === 'enabled' ? 'text-green-400' : 'text-slate-600'
        }`}
      />
      <span className={`text-sm ${status === 'enabled' ? 'text-slate-300' : 'text-slate-500'}`}>{label}</span>
    </div>
  );
}
