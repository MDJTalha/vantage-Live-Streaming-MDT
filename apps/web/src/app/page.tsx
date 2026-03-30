'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@vantage/ui';
import { Video, ShieldCheck, Sparkles, Monitor, Globe, Lock, Users, Zap, CheckCircle2, ArrowRight, Menu, X } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setMobileMenuOpen(false);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500/20 border-t-blue-500 mx-auto" />
          <p className="text-blue-200 animate-pulse">Loading VANTAGE...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#020617] text-white">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#020617]/95 backdrop-blur-xl border-b border-blue-500/20' : 'bg-transparent'}`}>
        <div className="flex justify-between items-center px-6 md:px-16 py-4">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Video className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg text-white hidden sm:block">VANTAGE Executive</span>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <button onClick={() => scrollToSection('platform')} className="px-4 py-2 text-sm font-medium text-white hover:bg-blue-500/20 rounded-lg transition-all">Platform</button>
            <button onClick={() => scrollToSection('security')} className="px-4 py-2 text-sm font-medium text-white hover:bg-blue-500/20 rounded-lg transition-all">Security</button>
            <button onClick={() => scrollToSection('pricing')} className="px-4 py-2 text-sm font-medium text-white hover:bg-blue-500/20 rounded-lg transition-all">Pricing</button>
            <button onClick={() => scrollToSection('resources')} className="px-4 py-2 text-sm font-medium text-white hover:bg-blue-500/20 rounded-lg transition-all">Resources</button>
            <Button variant="primary" size="sm" onClick={() => router.push('/signup')} className="bg-blue-600 hover:bg-blue-500">Request Demo</Button>
          </div>
          <button className="md:hidden p-2 text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-[#020617] border-b border-blue-500/20 p-6 space-y-4">
            <button onClick={() => scrollToSection('platform')} className="block text-white py-2">Platform</button>
            <button onClick={() => scrollToSection('security')} className="block text-white py-2">Security</button>
            <button onClick={() => scrollToSection('pricing')} className="block text-white py-2">Pricing</button>
            <button onClick={() => scrollToSection('resources')} className="block text-white py-2">Resources</button>
            <Button variant="primary" size="md" onClick={() => router.push('/signup')} className="w-full bg-blue-600">Request Demo</Button>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 md:px-16 text-center">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/30">
            <Sparkles className="h-4 w-4 text-blue-400" />
            <span className="text-sm text-blue-200">Trusted by Fortune 500 Leadership Teams</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
            Where the World's Most <span className="text-blue-400">Important Meetings</span> Happen
          </h1>
          <p className="text-lg sm:text-xl text-blue-200 max-w-3xl mx-auto leading-relaxed">
            Secure, intelligent, and beautifully designed meeting infrastructure built for boards, executives, and global leadership teams.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-8">
            <Button variant="primary" size="xl" onClick={() => router.push('/signup')} className="bg-blue-600 hover:bg-blue-500">
              Get Started Free <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
            <Button variant="outline" size="xl" onClick={() => router.push('/login')} className="border-blue-500/50 text-white hover:bg-blue-500/20">Sign In</Button>
          </div>
          <div className="flex flex-wrap justify-center gap-6 pt-12 text-sm text-blue-200">
            <div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-green-400" /><span>Enterprise Security</span></div>
            <div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-green-400" /><span>SOC 2 Compliant</span></div>
            <div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-green-400" /><span>GDPR Ready</span></div>
            <div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-green-400" /><span>99.99% Uptime SLA</span></div>
          </div>
        </div>
      </section>

      {/* Stats Section - FIXED: Dark backgrounds with visible text */}
      <section className="py-16 px-6 md:px-16 bg-[#0a0f1f]">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-7xl mx-auto">
          <div className="text-center p-6 rounded-2xl bg-[#1e293b] border border-blue-500/20">
            <Users className="h-8 w-8 text-blue-400 mx-auto mb-3" />
            <div className="text-3xl md:text-4xl font-bold text-white mb-2">50,000+</div>
            <div className="text-sm text-blue-300">Active Users</div>
          </div>
          <div className="text-center p-6 rounded-2xl bg-[#1e293b] border border-blue-500/20">
            <Video className="h-8 w-8 text-blue-400 mx-auto mb-3" />
            <div className="text-3xl md:text-4xl font-bold text-white mb-2">500,000+</div>
            <div className="text-sm text-blue-300">Meetings Hosted</div>
          </div>
          <div className="text-center p-6 rounded-2xl bg-[#1e293b] border border-blue-500/20">
            <Zap className="h-8 w-8 text-blue-400 mx-auto mb-3" />
            <div className="text-3xl md:text-4xl font-bold text-white mb-2">99.99%</div>
            <div className="text-sm text-blue-300">Uptime SLA</div>
          </div>
          <div className="text-center p-6 rounded-2xl bg-[#1e293b] border border-blue-500/20">
            <ShieldCheck className="h-8 w-8 text-blue-400 mx-auto mb-3" />
            <div className="text-3xl md:text-4xl font-bold text-white mb-2">&lt;50ms</div>
            <div className="text-sm text-blue-300">Avg Latency</div>
          </div>
        </div>
      </section>

      {/* Features Grid - FIXED: Dark cards with visible text */}
      <section id="platform" className="py-20 px-6 md:px-16 bg-[#020617]">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Platform Features</h2>
          <p className="text-blue-200 max-w-2xl mx-auto">Everything you need for executive-level meetings</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          <div className="p-6 rounded-2xl bg-[#1e293b] border border-blue-500/20">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4">
              <ShieldCheck className="h-6 w-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-3">Enterprise Security</h3>
            <p className="text-sm text-blue-200">End-to-end encrypted communications with enterprise-grade compliance.</p>
          </div>
          <div className="p-6 rounded-2xl bg-[#1e293b] border border-blue-500/20">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4">
              <Monitor className="h-6 w-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-3">Crystal Video</h3>
            <p className="text-sm text-blue-200">Ultra-low latency streaming with cinematic clarity for boardrooms.</p>
          </div>
          <div className="p-6 rounded-2xl bg-[#1e293b] border border-blue-500/20">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4">
              <Globe className="h-6 w-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-3">Global Infrastructure</h3>
            <p className="text-sm text-blue-200">Distributed meeting architecture optimized for international teams.</p>
          </div>
          <div className="p-6 rounded-2xl bg-[#1e293b] border border-blue-500/20">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4">
              <Lock className="h-6 w-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-3">Board-Level Privacy</h3>
            <p className="text-sm text-blue-200">Private meeting rooms with advanced access controls and audit trails.</p>
          </div>
        </div>
      </section>

      {/* Security Section - FIXED */}
      <section id="security" className="py-20 px-6 md:px-16 bg-[#0a0f1f]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Enterprise-Grade Security</h2>
            <p className="text-blue-200 max-w-2xl mx-auto">Built for organizations with the highest security requirements.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-[#1e293b] border border-blue-500/20">
              <Lock className="h-8 w-8 text-blue-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">End-to-End Encryption</h3>
              <p className="text-sm text-blue-200">AES-256 encryption for all video, audio, and data transmission.</p>
            </div>
            <div className="p-6 rounded-2xl bg-[#1e293b] border border-blue-500/20">
              <ShieldCheck className="h-8 w-8 text-blue-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">SOC 2 Type II</h3>
              <p className="text-sm text-blue-200">Certified compliance with industry-leading security standards.</p>
            </div>
            <div className="p-6 rounded-2xl bg-[#1e293b] border border-blue-500/20">
              <CheckCircle2 className="h-8 w-8 text-blue-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">GDPR Compliant</h3>
              <p className="text-sm text-blue-200">Full compliance with European data protection regulations.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section - FIXED */}
      <section id="pricing" className="py-20 px-6 md:px-16 bg-[#020617]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Simple, Transparent Pricing</h2>
            <p className="text-blue-200 max-w-2xl mx-auto">Choose the plan that fits your organization's needs.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="p-6 rounded-2xl bg-[#1e293b] border border-blue-500/20 flex flex-col h-full">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">Starter</h3>
                <p className="text-sm text-blue-200 mb-4">For small teams</p>
                <div className="text-3xl font-bold text-white mb-6">$29<span className="text-sm font-normal text-blue-300">/month</span></div>
                <ul className="space-y-3 text-sm text-blue-200">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />Up to 50 participants</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />HD Video & Audio</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />Screen Sharing</li>
                </ul>
              </div>
              <Button variant="primary" onClick={() => router.push('/signup')} className="w-full bg-blue-600 hover:bg-blue-500 mt-6">Get Started</Button>
            </div>
            <div className="p-6 rounded-2xl bg-[#1e293b] border-2 border-blue-500 relative flex flex-col h-full">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-blue-600 text-xs font-bold text-white">Popular</div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">Professional</h3>
                <p className="text-sm text-blue-200 mb-4">For growing businesses</p>
                <div className="text-3xl font-bold text-white mb-6">$99<span className="text-sm font-normal text-blue-300">/month</span></div>
                <ul className="space-y-3 text-sm text-blue-200">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />Up to 200 participants</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />4K Video Support</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />AI Transcription</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />Recording & Analytics</li>
                </ul>
              </div>
              <Button variant="primary" onClick={() => router.push('/signup')} className="w-full bg-blue-600 hover:bg-blue-500 mt-6">Get Started</Button>
            </div>
            <div className="p-6 rounded-2xl bg-[#1e293b] border border-blue-500/20 flex flex-col h-full">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">Enterprise</h3>
                <p className="text-sm text-blue-200 mb-4">For large organizations</p>
                <div className="text-3xl font-bold text-white mb-6">Custom</div>
                <ul className="space-y-3 text-sm text-blue-200">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />Unlimited participants</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />Custom Integrations</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />Dedicated Support</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />SLA Guarantee</li>
                </ul>
              </div>
              <Button variant="primary" onClick={() => router.push('/login')} className="w-full bg-blue-600 hover:bg-blue-500 mt-6">Contact Sales</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Resources Section - FIXED */}
      <section id="resources" className="py-20 px-6 md:px-16 bg-[#0a0f1f]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Learn More About VANTAGE</h2>
            <p className="text-blue-200 max-w-2xl mx-auto">Documentation, guides, and resources to help you succeed.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div onClick={() => router.push('/dashboard')} className="p-5 rounded-2xl bg-[#1e293b] border border-blue-500/20 cursor-pointer hover:border-blue-400 hover:bg-[#1e293b]/80 transition-all duration-300 group">
              <h3 className="font-bold text-white mb-2">📚 Documentation</h3>
              <p className="text-sm text-blue-200 mb-4">Complete API reference and integration guides.</p>
              <span className="text-sm text-blue-400 group-hover:text-blue-300 font-medium">Explore Docs →</span>
            </div>
            <div onClick={() => router.push('/dashboard')} className="p-5 rounded-2xl bg-[#1e293b] border border-blue-500/20 cursor-pointer hover:border-blue-400 hover:bg-[#1e293b]/80 transition-all duration-300 group">
              <h3 className="font-bold text-white mb-2">🎥 Video Tutorials</h3>
              <p className="text-sm text-blue-200 mb-4">Step-by-step guides for hosts and participants.</p>
              <span className="text-sm text-blue-400 group-hover:text-blue-300 font-medium">Watch Videos →</span>
            </div>
            <div onClick={() => router.push('/dashboard')} className="p-5 rounded-2xl bg-[#1e293b] border border-blue-500/20 cursor-pointer hover:border-blue-400 hover:bg-[#1e293b]/80 transition-all duration-300 group">
              <h3 className="font-bold text-white mb-2">💬 Community</h3>
              <p className="text-sm text-blue-200 mb-4">Join our community forum and connect with users.</p>
              <span className="text-sm text-blue-400 group-hover:text-blue-300 font-medium">Join Community →</span>
            </div>
            <div onClick={() => router.push('/dashboard')} className="p-5 rounded-2xl bg-[#1e293b] border border-blue-500/20 cursor-pointer hover:border-blue-400 hover:bg-[#1e293b]/80 transition-all duration-300 group">
              <h3 className="font-bold text-white mb-2">📞 Support</h3>
              <p className="text-sm text-blue-200 mb-4">24/7 enterprise support for all your needs.</p>
              <span className="text-sm text-blue-400 group-hover:text-blue-300 font-medium">Contact Support →</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 md:px-16 border-t border-blue-500/20 bg-[#020617]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Video className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-white">VANTAGE Executive</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => scrollToSection('platform')} className="text-sm text-blue-200 hover:text-white transition-all">Platform</button>
            <button onClick={() => scrollToSection('security')} className="text-sm text-blue-200 hover:text-white transition-all">Security</button>
            <button onClick={() => scrollToSection('pricing')} className="text-sm text-blue-200 hover:text-white transition-all">Pricing</button>
            <button onClick={() => scrollToSection('resources')} className="text-sm text-blue-200 hover:text-white transition-all">Resources</button>
          </div>
          <p className="text-sm text-blue-300">© 2026 VANTAGE Executive. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
