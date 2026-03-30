'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Card } from '@vantage/ui';
import {
  Building2,
  CheckCircle,
  ArrowRight,
  Loader2,
  Mail,
  X
} from 'lucide-react';
import { onboardingService, type Organization } from '@/services/OnboardingService';

type OnboardingStep = 'welcome' | 'create-org' | 'invite-team' | 'configure' | 'complete';

export default function OrganizationOnboarding() {
  const router = useRouter();
  useAuth();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [organization, setOrganization] = useState<Organization | null>(null);

  // Form states
  const [orgName, setOrgName] = useState('');
  const [orgSlug, setOrgSlug] = useState('');
  const [inviteEmails, setInviteEmails] = useState<string[]>(['']);
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'pro' | 'enterprise'>('free');

  useEffect(() => {
    checkExistingOrg();
  }, []);

  async function checkExistingOrg() {
    try {
      setIsLoading(true);
      const org = await onboardingService.getMyOrganization();
      setOrganization(org);
      setCurrentStep('complete');
    } catch (error) {
      // No organization exists, start onboarding
      try {
        await onboardingService.getSetupProgress();
      } catch (e) {
        console.log('Starting fresh onboarding');
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateOrganization() {
    if (!orgName || !orgSlug) {
      alert('Please fill in all fields');
      return;
    }

    try {
      setIsSubmitting(true);
      const org = await onboardingService.createOrganization({
        name: orgName,
        slug: orgSlug,
      });
      setOrganization(org);
      await onboardingService.completeSetup('create-organization');
      setCurrentStep('invite-team');
    } catch (error: any) {
      alert(error.message || 'Failed to create organization');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleInviteTeam() {
    const validEmails = inviteEmails.filter(e => e && e.includes('@'));
    
    for (const email of validEmails) {
      try {
        await onboardingService.inviteTeamMember({
          email,
          role: 'member',
        });
      } catch (error) {
        console.error(`Failed to invite ${email}:`, error);
      }
    }

    await onboardingService.completeSetup('invite-team');
    setCurrentStep('configure');
  }

  async function handleSelectPlan(plan: 'free' | 'pro' | 'enterprise') {
    try {
      setIsSubmitting(true);
      if (plan !== 'free') {
        await onboardingService.upgradePlan(plan);
      }
      await onboardingService.completeSetup('select-plan');
      setSelectedPlan(plan);
      setCurrentStep('complete');
    } catch (error: any) {
      alert(error.message || 'Failed to select plan');
    } finally {
      setIsSubmitting(false);
    }
  }

  const addInviteEmail = () => {
    setInviteEmails([...inviteEmails, '']);
  };

  const removeInviteEmail = (index: number) => {
    setInviteEmails(inviteEmails.filter((_, i) => i !== index));
  };

  const updateInviteEmail = (index: number, value: string) => {
    const updated = [...inviteEmails];
    updated[index] = value;
    setInviteEmails(updated);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        {/* Progress Indicator */}
        {currentStep !== 'welcome' && currentStep !== 'complete' && (
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {['Create Org', 'Invite Team', 'Configure', 'Complete'].map((label, index) => {
                const steps = ['create-org', 'invite-team', 'configure', 'complete'];
                const isActive = steps.indexOf(currentStep) >= index;
                const isCurrent = steps.indexOf(currentStep) === index;

                return (
                  <div key={label} className="flex items-center">
                    <div className={`flex items-center ${index > 0 ? 'ml-4' : ''}`}>
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-amber-600 text-white'
                            : 'bg-slate-700 text-slate-400'
                        }`}
                      >
                        {isActive ? (
                          isCurrent ? (
                            index + 1
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )
                        ) : (
                          index + 1
                        )}
                      </div>
                      <span
                        className={`ml-2 text-sm font-medium ${
                          isCurrent ? 'text-white' : 'text-slate-400'
                        }`}
                      >
                        {label}
                      </span>
                    </div>
                    {index < 3 && (
                      <div
                        className={`w-12 h-0.5 mx-4 ${
                          isActive ? 'bg-amber-600' : 'bg-slate-700'
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Welcome Step */}
        {currentStep === 'welcome' && (
          <Card className="bg-slate-800/50 border-slate-700 p-8 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/20">
              <Building2 className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Welcome to VANTAGE</h1>
            <p className="text-slate-400 mb-8 max-w-md mx-auto">
              Get started by creating your organization. Invite your team and start hosting professional meetings.
            </p>
            <Button
              onClick={() => setCurrentStep('create-org')}
              className="bg-amber-600 hover:bg-amber-500 text-white px-8 py-3"
            >
              Get Started
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </Card>
        )}

        {/* Create Organization Step */}
        {currentStep === 'create-org' && (
          <Card className="bg-slate-800/50 border-slate-700 p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Create Your Organization</h2>
              <p className="text-slate-400">This will be your company or team name</p>
            </div>

            <div className="space-y-6 max-w-md mx-auto">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Organization Name
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => {
                      setOrgName(e.target.value);
                      setOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
                    }}
                    placeholder="Acme Inc"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Organization Slug
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">vantage.live/</span>
                  <input
                    type="text"
                    value={orgSlug}
                    onChange={(e) => setOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'))}
                    placeholder="acme-inc"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-24 pr-4 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">This will be part of your organization URL</p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep('welcome')}
                  className="flex-1 border-slate-700 text-slate-300"
                >
                  Back
                </Button>
                <Button
                  onClick={handleCreateOrganization}
                  disabled={isSubmitting || !orgName || !orgSlug}
                  className="flex-1 bg-amber-600 hover:bg-amber-500 text-white"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Continue'}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Invite Team Step */}
        {currentStep === 'invite-team' && (
          <Card className="bg-slate-800/50 border-slate-700 p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Invite Your Team</h2>
              <p className="text-slate-400">Add team members to collaborate</p>
            </div>

            <div className="space-y-4 max-w-md mx-auto">
              {inviteEmails.map((email, index) => (
                <div key={index} className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => updateInviteEmail(index, e.target.value)}
                      placeholder="colleague@company.com"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                  {inviteEmails.length > 1 && (
                    <Button
                      variant="ghost"
                      onClick={() => removeInviteEmail(index)}
                      className="text-slate-400 hover:text-red-400 h-10 w-10 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}

              <Button
                variant="outline"
                onClick={addInviteEmail}
                className="w-full border-slate-700 text-slate-300 border-dashed"
              >
                + Add Another Email
              </Button>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep('create-org')}
                  className="flex-1 border-slate-700 text-slate-300"
                >
                  Back
                </Button>
                <Button
                  onClick={handleInviteTeam}
                  className="flex-1 bg-amber-600 hover:bg-amber-500 text-white"
                >
                  Continue
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Configure Step - Plan Selection */}
        {currentStep === 'configure' && (
          <Card className="bg-slate-800/50 border-slate-700 p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Choose Your Plan</h2>
              <p className="text-slate-400">Select the best plan for your team</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
              <PlanCard
                name="Free"
                price="$0"
                period="forever"
                description="Perfect for small teams"
                features={[
                  'Up to 10 participants',
                  '45 min group meetings',
                  'Unlimited 1:1 meetings',
                  'Basic chat & screen share',
                ]}
                selected={selectedPlan === 'free'}
                onSelect={() => handleSelectPlan('free')}
              />
              <PlanCard
                name="Pro"
                price="$12"
                period="per host/month"
                description="For growing teams"
                features={[
                  'Up to 100 participants',
                  '24 hour meetings',
                  'Recording & transcripts',
                  'Polls & Q&A',
                  'Admin dashboard',
                ]}
                highlighted
                selected={selectedPlan === 'pro'}
                onSelect={() => handleSelectPlan('pro')}
              />
              <PlanCard
                name="Enterprise"
                price="Custom"
                period="contact us"
                description="For large organizations"
                features={[
                  'Up to 500 participants',
                  'Unlimited everything',
                  'SSO & MFA',
                  'Advanced analytics',
                  'Priority support',
                  'Custom branding',
                ]}
                selected={selectedPlan === 'enterprise'}
                onSelect={() => handleSelectPlan('enterprise')}
              />
            </div>
          </Card>
        )}

        {/* Complete Step */}
        {currentStep === 'complete' && organization && (
          <Card className="bg-slate-800/50 border-slate-700 p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-green-600/20 border border-green-600/30 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">You're All Set!</h1>
            <p className="text-slate-400 mb-8">
              Your organization <span className="text-white font-semibold">{organization.name}</span> is ready to go.
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => router.push('/dashboard')}
                className="bg-amber-600 hover:bg-amber-500 text-white"
              >
                Go to Dashboard
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/create-room')}
                className="border-slate-700 text-slate-300"
              >
                Create a Room
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

// Plan Card Component
function PlanCard({
  name,
  price,
  period,
  description,
  features,
  highlighted,
  selected,
  onSelect,
}: {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all ${
        highlighted
          ? 'bg-amber-600/10 border-amber-600'
          : selected
          ? 'bg-slate-700/50 border-amber-600'
          : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
      }`}
      onClick={onSelect}
    >
      {highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-amber-600 text-white text-xs font-medium">
          Most Popular
        </div>
      )}

      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-white mb-2">{name}</h3>
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-3xl font-bold text-white">{price}</span>
          <span className="text-sm text-slate-400">{period}</span>
        </div>
        <p className="text-xs text-slate-400 mt-2">{description}</p>
      </div>

      <ul className="space-y-2 mb-6">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2 text-sm text-slate-300">
            <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
            {feature}
          </li>
        ))}
      </ul>

      <Button
        className={`w-full ${
          highlighted
            ? 'bg-amber-600 hover:bg-amber-500 text-white'
            : selected
            ? 'bg-amber-600/20 border border-amber-600 text-amber-400'
            : 'bg-slate-700 hover:bg-slate-600 text-white'
        }`}
      >
        {selected ? 'Selected' : 'Select Plan'}
      </Button>
    </div>
  );
}
