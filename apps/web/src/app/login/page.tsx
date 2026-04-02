'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Input } from '@vantage/ui';
import { Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle2, Video, Sparkles, Shield, Users, Copy, Check } from 'lucide-react';

// Credential Copy Component - FIXED with high contrast
function CredentialCopy({ value, label, type = 'text' }: { value: string; label: string; type?: 'text' | 'password' }) {
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isPassword = type === 'password';
  const isVisible = !isPassword || showPassword;

  return (
    <button
      type="button"
      onClick={copyToClipboard}
      className="flex-1 group relative flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[#1e293b] border border-blue-500/30 hover:border-blue-400 transition-all duration-200 text-left"
    >
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-blue-300 uppercase tracking-wide font-semibold">{label}</p>
        <p className="text-sm font-mono text-white font-bold truncate">{isVisible ? value : '••••••••'}</p>
      </div>
      <div className="flex items-center gap-1">
        {isPassword && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowPassword(!showPassword);
            }}
            className="p-1 rounded hover:bg-blue-500/20 text-blue-300 hover:text-white transition-colors"
          >
            {showPassword ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          </button>
        )}
        <div className={`p-1 rounded transition-all duration-200 ${copied ? 'bg-green-500/20 text-green-400' : 'text-blue-300 group-hover:text-white'}`}>
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </div>
      </div>
    </button>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { login, user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setMounted(true);
    
    // Redirect if already logged in
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (!email || !password) {
        setError('Please fill in all fields');
        setIsLoading(false);
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError('Please enter a valid email address');
        setIsLoading(false);
        return;
      }

      if (password.length < 8) {
        setError('Password must be at least 8 characters');
        setIsLoading(false);
        return;
      }

      // Call real authentication API
      const result = await login(email, password);

      if (result.success) {
        setSuccess('Login successful! Redirecting...');
        // Router push happens in auth context
      } else {
        setError(result.error || 'Login failed. Please check your credentials.');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick login handler removed - using direct login instead

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617]">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500/20 border-t-blue-500" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#020617] text-white flex items-center justify-center px-6 py-12">
      {/* Main Card */}
      <div className="w-full max-w-6xl overflow-hidden rounded-2xl bg-[#0a0f1f] border border-blue-500/20 shadow-2xl">
        <div className="flex flex-col lg:flex-row">
          {/* Demo Credentials Side - Left */}
          <div className="hidden lg:flex flex-1 border-r border-blue-500/20 p-8 md:p-12 bg-[#0f172a]">
            <div className="w-full max-w-md mx-auto">
              <div className="relative overflow-hidden rounded-2xl bg-[#1e293b] border border-blue-500/30 h-full">
                <div className="relative p-6 space-y-5">
                  {/* Header */}
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <div className="p-1.5 rounded-lg bg-blue-500/20">
                      <Sparkles className="h-4 w-4 text-blue-400" />
                    </div>
                    <span>Demo Credentials</span>
                    <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold">Click to copy</span>
                  </div>

                  {/* Credential Cards */}
                  <div className="grid gap-3">
                    {/* Admin */}
                    <div className="group p-3 rounded-xl bg-[#0f172a] border border-blue-500/30 hover:border-blue-400 transition-all duration-300">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1 rounded bg-blue-500/20">
                          <Shield className="h-3.5 w-3.5 text-blue-300" />
                        </div>
                        <span className="text-xs font-bold text-white">Administrator</span>
                      </div>
                      <div className="flex gap-2">
                        <CredentialCopy value="admin@vantage.live" label="Email" />
                        <CredentialCopy value="@admin@123#" label="Password" type="password" />
                      </div>
                    </div>

                    {/* Host */}
                    <div className="group p-3 rounded-xl bg-[#0f172a] border border-blue-500/30 hover:border-purple-400 transition-all duration-300">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1 rounded bg-purple-500/20">
                          <Video className="h-3.5 w-3.5 text-purple-300" />
                        </div>
                        <span className="text-xs font-bold text-white">Host</span>
                      </div>
                      <div className="flex gap-2">
                        <CredentialCopy value="host@vantage.live" label="Email" />
                        <CredentialCopy value="@host@123#" label="Password" type="password" />
                      </div>
                    </div>

                    {/* User */}
                    <div className="group p-3 rounded-xl bg-[#0f172a] border border-blue-500/30 hover:border-cyan-400 transition-all duration-300">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1 rounded bg-cyan-500/20">
                          <Users className="h-3.5 w-3.5 text-cyan-300" />
                        </div>
                        <span className="text-xs font-bold text-white">Participant</span>
                      </div>
                      <div className="flex gap-2">
                        <CredentialCopy value="user@vantage.live" label="Email" />
                        <CredentialCopy value="@user@123#" label="Password" type="password" />
                      </div>
                    </div>
                  </div>

                  {/* Quick Login Tips */}
                  <div className="pt-3 border-t border-blue-500/20">
                    <div className="flex items-start gap-2 text-xs text-blue-200">
                      <CheckCircle2 className="h-3.5 w-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
                      <span>Click any credential to copy, then paste into the form on the right</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Side - Right */}
          <div className="flex-1 p-8 md:p-12 lg:max-w-[480px] bg-[#020617]">
            <div className="max-w-md mx-auto space-y-6">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Video className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold text-lg text-white">VANTAGE Executive</span>
              </div>

              {/* Header */}
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-white">Sign In</h1>
                <p className="text-blue-200 text-sm">Enter your credentials to access your account</p>
              </div>

              {/* Error/Success Messages */}
              {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm" role="alert">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm flex items-center gap-2" role="status">
                  <CheckCircle2 className="h-5 w-5" />
                  {success}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
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
                    type={showPassword ? 'text' : 'password'}
                    label="Password"
                    placeholder="Enter your password"
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

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full bg-blue-600 hover:bg-blue-500"
                  disabled={isLoading}
                  isLoading={isLoading}
                >
                  {isLoading ? (
                    'Processing...'
                  ) : (
                    <>
                      Sign In
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
                  <span className="bg-[#020617] px-2 text-blue-300">Or continue with</span>
                </div>
              </div>

              {/* OAuth Buttons */}
              <div className="grid grid-cols-3 gap-3">
                {/* Google */}
                <button
                  type="button"
                  onClick={() => {
                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
                    window.location.href = `${apiUrl}/api/v1/auth/oauth/google`;
                  }}
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
                  onClick={() => {
                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
                    window.location.href = `${apiUrl}/api/v1/auth/oauth/microsoft`;
                  }}
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
                  onClick={() => {
                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
                    window.location.href = `${apiUrl}/api/v1/auth/oauth/saml/login`;
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#1e293b] border border-blue-500/30 hover:border-blue-400 hover:bg-[#1e293b]/80 transition-all text-white text-sm font-medium"
                >
                  <Shield className="h-5 w-5 text-blue-400" />
                  SSO
                </button>
              </div>

              {/* Toggle to Signup */}
              <div className="flex items-center justify-center gap-4 text-sm text-blue-200 pt-4 border-t border-blue-500/20">
                <span>Don't have an account?</span>
                <button
                  type="button"
                  onClick={() => router.push('/signup')}
                  className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                >
                  Sign Up
                </button>
              </div>
            </div>
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
