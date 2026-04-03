'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Phone, Mail, MessageSquare, Clock, Shield, Zap, Headphones, ChevronRight, Send, CheckCircle2, Building2 } from 'lucide-react';
import { useState, useEffect } from 'react';

const supportChannels = [
  {
    icon: <Headphones className="h-8 w-8" />,
    title: 'Live Chat',
    description: 'Get instant help from our support team',
    availability: 'Available 24/7',
    color: 'from-blue-500 to-cyan-500',
    action: 'Start Chat',
  },
  {
    icon: <Mail className="h-8 w-8" />,
    title: 'Email Support',
    description: 'Send us a detailed message',
    availability: 'Response within 4 hours',
    color: 'from-purple-500 to-pink-500',
    action: 'Send Email',
  },
  {
    icon: <Phone className="h-8 w-8" />,
    title: 'Phone Support',
    description: 'Speak directly with a specialist',
    availability: 'Mon-Fri, 9AM-6PM EST',
    color: 'from-emerald-500 to-green-500',
    action: 'Call Now',
  },
  {
    icon: <MessageSquare className="h-8 w-8" />,
    title: 'Community Forum',
    description: 'Get help from other users',
    availability: 'Always available',
    color: 'from-amber-500 to-orange-500',
    action: 'Visit Forum',
  },
];

const faqs = [
  {
    question: 'How do I reset my password?',
    answer: 'Go to the login page and click "Forgot Password". Enter your email and we\'ll send you a reset link.',
  },
  {
    question: 'What browsers are supported?',
    answer: 'VANTAGE works on Chrome, Firefox, Safari, and Edge. We recommend using the latest version for the best experience.',
  },
  {
    question: 'How many participants can join a meeting?',
    answer: 'Starter plans support up to 50 participants, Professional up to 200, and Enterprise plans have unlimited capacity.',
  },
  {
    question: 'Can I record my meetings?',
    answer: 'Yes! Recording is available on Professional and Enterprise plans. Recordings are stored securely and can be downloaded or shared.',
  },
  {
    question: 'Is VANTAGE SOC 2 compliant?',
    answer: 'Yes, VANTAGE is SOC 2 Type II certified and GDPR compliant. We take security seriously and undergo regular audits.',
  },
];

export default function SupportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSalesInquiry = searchParams.get('sales') === 'true';

  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: isSalesInquiry ? 'Enterprise Plan Inquiry' : '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (isSalesInquiry) {
      setContactForm((prev) => ({ ...prev, subject: 'Enterprise Plan Inquiry' }));
    }
  }, [isSalesInquiry]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
    setContactForm({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#020617]/95 backdrop-blur-xl border-b border-blue-500/20">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="p-2 text-blue-300 hover:text-white hover:bg-blue-500/20 rounded-lg transition-all"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                  <Headphones className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-white">Support Center</h1>
                  <p className="text-xs text-blue-300">We're here to help</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 text-sm font-medium text-blue-300 hover:text-white hover:bg-blue-500/20 rounded-lg transition-all"
              >
                Dashboard
              </button>
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 rounded-lg transition-all"
              >
                Home
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Sales Inquiry Banner */}
      {isSalesInquiry && (
        <section className="px-6 pt-8">
          <div className="max-w-3xl mx-auto p-6 rounded-2xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Enterprise Sales Inquiry</h2>
                <p className="text-sm text-blue-200 mb-3">
                  You're interested in our Enterprise plan with unlimited participants, custom integrations, dedicated support, and SLA guarantee.
                </p>
                <p className="text-sm text-blue-300">
                  Fill out the contact form below and our sales team will reach out within 24 hours with a custom quote.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Hero */}
      <section className="py-16 px-6 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold">
            How can we help?
          </h1>
          <p className="text-lg text-blue-200">
            24/7 enterprise support for all your needs. Our team is ready to assist you.
          </p>
          <div className="flex items-center justify-center gap-8 text-sm text-blue-300">
            <span className="flex items-center gap-2"><Clock className="h-4 w-4" /> Avg. Response: 2 hours</span>
            <span className="flex items-center gap-2"><Shield className="h-4 w-4" /> 99.9% Satisfaction</span>
            <span className="flex items-center gap-2"><Zap className="h-4 w-4" /> Enterprise SLA</span>
          </div>
        </div>
      </section>

      {/* Support Channels */}
      <section className="px-6 pb-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-xl font-bold text-white mb-6 text-center">Choose Your Support Channel</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {supportChannels.map((channel, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-[#1e293b] border border-blue-500/20 hover:border-blue-400 transition-all group cursor-pointer text-center"
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${channel.color} flex items-center justify-center mx-auto mb-4 text-white group-hover:scale-110 transition-transform`}>
                  {channel.icon}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{channel.title}</h3>
                <p className="text-sm text-blue-200 mb-3">{channel.description}</p>
                <p className="text-xs text-blue-400 mb-4">{channel.availability}</p>
                <button className="w-full py-2.5 rounded-xl bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white font-medium text-sm transition-all">
                  {channel.action}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="px-6 pb-16">
        <div className="max-w-2xl mx-auto">
          <div className="p-8 rounded-2xl bg-[#1e293b] border border-blue-500/20">
            <h2 className="text-2xl font-bold text-white mb-2">Send us a message</h2>
            <p className="text-blue-200 mb-6">Fill out the form below and we'll get back to you within 4 hours.</p>

            {submitted && (
              <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Message sent successfully! We'll respond within 4 hours.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-blue-200 mb-2">Name</label>
                  <input
                    type="text"
                    required
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0f172a] border border-blue-500/30 rounded-xl text-white placeholder:text-blue-300/50 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-200 mb-2">Email</label>
                  <input
                    type="email"
                    required
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0f172a] border border-blue-500/30 rounded-xl text-white placeholder:text-blue-300/50 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder="you@company.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">Subject</label>
                <input
                  type="text"
                  required
                  value={contactForm.subject}
                  onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0f172a] border border-blue-500/30 rounded-xl text-white placeholder:text-blue-300/50 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  placeholder="How can we help?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">Message</label>
                <textarea
                  required
                  rows={5}
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0f172a] border border-blue-500/30 rounded-xl text-white placeholder:text-blue-300/50 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                  placeholder="Describe your issue or question..."
                />
              </div>
              <button
                type="submit"
                className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all flex items-center justify-center gap-2"
              >
                <Send className="h-5 w-5" />
                Send Message
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 pb-20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="rounded-xl bg-[#1e293b] border border-blue-500/20 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-[#1e293b]/80 transition-all"
                >
                  <span className="font-medium text-white pr-4">{faq.question}</span>
                  <ChevronRight className={`h-5 w-5 text-blue-400 flex-shrink-0 transition-transform ${openFaq === i ? 'rotate-90' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-blue-200 text-sm border-t border-blue-500/10 pt-4">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-blue-500/20 text-center text-sm text-blue-300">
        <p>© 2026 VANTAGE Executive. All rights reserved.</p>
      </footer>
    </div>
  );
}
