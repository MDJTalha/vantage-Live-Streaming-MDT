'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Input } from '@vantage/ui';
import { Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle2, Video, Sparkles, Shield, Zap, User, Check } from 'lucide-react';

const planFeatures: Record<string, { name: string; price: string; features: string[] }> = {
  starter: {
    name: 'Starter',
    price: '$29/month',
    features: ['Up to 50 participants', 'HD Video & Audio', 'Screen Sharing'],
  },
  professional: {
    name: 'Professional',
    price: '$99/month',
    features: ['Up to 200 participants', '4K Video Support', 'AI Transcription', 'Recording & Analytics'],
  },
};

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedPlan = searchParams.get('plan') || '';
  const plan = selectedPlan ? planFeatures[selectedPlan] : null;

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (!name || !email || !password) {
        setError('Please fill in all fields');
        setIsLoading(false);
        return;
      }

      if (password.length < 8) {
        setError('Password must be at least 8 characters');
        setIsLoading(false);
        return;
      }

      if (!agreeToTerms) {
        setError('You must agree to the Terms of Service');
        setIsLoading(false);
        return;
      }

      // Check if user already exists
      const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
      const existingUser = registeredUsers.find((u: any) => u.email === email);
      
      if (existingUser) {
        setError('An account with this email already exists');
        setIsLoading(false);
        return;
      }

      // Create new user
      const newUser = {
        id: 'user-' + Date.now(),
        name,
        email,
        password, // In production, this would be hashed
        role: 'USER',
        createdAt: new Date().toISOString()
      };
      registeredUsers.push(newUser);
      localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));

      // Auto-login after signup
      const mockTokens = {
        accessToken: 'demo-access-token-' + Date.now(),
        refreshToken: 'demo-refresh-token-' + Date.now()
      };

      localStorage.setItem('accessToken', mockTokens.accessToken);
      localStorage.setItem('refreshToken', mockTokens.refreshToken);
      localStorage.setItem('demoUser', JSON.stringify({
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role
      }));

      setSuccess('Account created successfully! Redirecting to dashboard...');

      setTimeout(() => {
        router.push('/dashboard');
      }, 800);

    } catch (err: any) {
      setError(err.message || 'Failed to create account. Please try again.');
      setIsLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617]">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500/20 border-t-blue-500" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#020617] text-white flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md mx-auto">
        <div className="rounded-2xl bg-[#0a0f1f] border border-blue-500/20 p-8 md:p-10 shadow-2xl">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Video className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg text-white">VANTAGE Executive</span>
          </div>

          {/* Header */}
          <div className="space-y-2 mb-6">
            <h1 className="text-3xl font-bold text-white">Create Account</h1>
            <p className="text-blue-200 text-sm">Join VANTAGE and start hosting meetings</p>
          </div>

          {/* Selected Plan Badge */}
          {plan && (
            <div className="mb-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-blue-300">Selected Plan</span>
                <span className="text-lg font-bold text-white">{plan.price}</span>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl font-bold text-white">{plan.name}</span>
                <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 text-xs font-medium">Active</span>
              </div>
              <ul className="space-y-1.5">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-blue-200">
                    <Check className="h-3.5 w-3.5 text-green-400 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Error/Success Messages */}
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm mb-6" role="alert">
              {error}
            </div>
          )}
          {success && (
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm mb-6 flex items-center gap-2" role="status">
              <CheckCircle2 className="h-5 w-5" />
              {success}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              data-testid="signup-name"
              type="text"
              label="Full Name"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              leftIcon={<User className="h-5 w-5 text-blue-400" />}
              disabled={isLoading}
              className="bg-[#1e293b] border-blue-500/30 text-white placeholder:text-blue-300/50 focus:border-blue-400 focus:bg-[#1e293b]"
            />

            <Input
              data-testid="signup-email"
              type="email"
              label="Email Address"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="h-5 w-5 text-blue-400" />}
              disabled={isLoading}
              className="bg-[#1e293b] border-blue-500/30 text-white placeholder:text-blue-300/50 focus:border-blue-400 focus:bg-[#1e293b]"
            />

            <div className="space-y-2">
              <Input
                data-testid="signup-password"
                type={showPassword ? 'text' : 'password'}
                label="Password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="h-5 w-5 text-blue-400" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-blue-300 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                }
                disabled={isLoading}
                className="bg-[#1e293b] border-blue-500/30 text-white placeholder:text-blue-300/50 focus:border-blue-400 focus:bg-[#1e293b]"
              />
            </div>

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="terms"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-blue-500/30 bg-[#1e293b] text-blue-600 focus:ring-blue-500/50"
              />
              <label htmlFor="terms" className="text-sm text-blue-200">
                I agree to the{' '}
                <button type="button" className="text-blue-400 hover:text-blue-300 underline">
                  Terms of Service
                </button>{' '}
                and{' '}
                <button type="button" className="text-blue-400 hover:text-blue-300 underline">
                  Privacy Policy
                </button>
              </label>
            </div>

            <Button
              data-testid="signup-submit"
              type="submit"
              variant="primary"
              size="lg"
              className="w-full bg-blue-600 hover:bg-blue-500"
              disabled={isLoading}
              isLoading={isLoading}
            >
              {isLoading ? (
                'Creating Account...'
              ) : (
                <>
                  Create Account
                  <ArrowRight className="h-5 w-5 ml-2" />
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-blue-500/20"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#020617] px-2 text-blue-300">Or sign up with</span>
            </div>
          </div>

          {/* OAuth Buttons */}
          <div className="grid grid-cols-3 gap-3">
            {/* Google */}
            <button
              type="button"
              onClick={() => alert('Google OAuth is not configured in demo mode.\n\nPlease use the email/password form to create an account.')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#1e293b] border border-blue-500/30 hover:border-blue-400 hover:bg-[#1e293b]/80 transition-all text-white text-sm font-medium"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </button>

            {/* Microsoft */}
            <button
              type="button"
              onClick={() => alert('Microsoft OAuth is not configured in demo mode.\n\nPlease use the email/password form to create an account.')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#1e293b] border border-blue-500/30 hover:border-blue-400 hover:bg-[#1e293b]/80 transition-all text-white text-sm font-medium"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#F25022" d="M1 1h10v10H1z"/>
                <path fill="#00A4EF" d="M1 13h10v10H1z"/>
                <path fill="#7FBA00" d="M13 1h10v10H13z"/>
                <path fill="#FFB900" d="M13 13h10v10H13z"/>
              </svg>
              Microsoft
            </button>

            {/* SAML SSO */}
            <button
              type="button"
              onClick={() => alert('SAML SSO is not configured in demo mode.\n\nPlease use the email/password form to create an account.')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#1e293b] border border-blue-500/30 hover:border-blue-400 hover:bg-[#1e293b]/80 transition-all text-white text-sm font-medium"
            >
              <Shield className="h-5 w-5 text-blue-400" />
              SSO
            </button>
          </div>

          {/* Toggle to Login */}
          <div className="flex items-center justify-center gap-4 text-sm text-blue-200 mt-6 pt-6 border-t border-blue-500/20">
            <span>Already have an account?</span>
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-xl bg-[#1e293b] border border-blue-500/20">
            <Shield className="h-6 w-6 text-blue-400 mx-auto mb-2" />
            <p className="text-xs text-blue-200 font-medium">Secure</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-[#1e293b] border border-blue-500/20">
            <Zap className="h-6 w-6 text-blue-400 mx-auto mb-2" />
            <p className="text-xs text-blue-200 font-medium">Fast Setup</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-[#1e293b] border border-blue-500/20">
            <Sparkles className="h-6 w-6 text-blue-400 mx-auto mb-2" />
            <p className="text-xs text-blue-200 font-medium">Premium</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-6 left-0 right-0 text-center text-xs text-blue-300" role="contentinfo">
        <p>© 2026 VANTAGE Executive. All rights reserved.</p>
      </footer>
    </main>
  );
}
