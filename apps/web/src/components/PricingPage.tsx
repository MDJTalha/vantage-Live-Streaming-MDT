'use client';

import { useState } from 'react';
import { Button } from '@vantage/ui';

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  popular?: boolean;
}

const PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'month',
    features: [
      'Up to 100 participants',
      '45 minute limit',
      'HD video & audio',
      'Screen sharing',
      'Chat & reactions',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 12,
    interval: 'month',
    features: [
      'Up to 500 participants',
      '30 hour limit',
      'Full HD 1080p',
      'Recording & transcripts',
      'Polls & Q&A',
      'Custom backgrounds',
      'Priority support',
    ],
    popular: true,
  },
  {
    id: 'business',
    name: 'Business',
    price: 24,
    interval: 'month',
    features: [
      'Up to 1000 participants',
      'No time limit',
      '4K video support',
      'Cloud recording (100GB)',
      'AI features',
      'Branding customization',
      'SSO integration',
      'Analytics dashboard',
      '24/7 support',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 49,
    interval: 'month',
    features: [
      'Unlimited participants',
      'Everything in Business',
      'Dedicated infrastructure',
      'Custom integrations',
      'SLA guarantee',
      'Account manager',
      'On-premise option',
    ],
  },
];

export function PricingPage() {
  const [interval, setInterval] = useState<'month' | 'year'>('month');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const handleSubscribe = async (planId: string) => {
    setSelectedPlan(planId);
    // In production, redirect to Stripe checkout
    console.log('Subscribe to plan:', planId);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Choose the plan that fits your needs
          </p>

          {/* Interval Toggle */}
          <div className="flex items-center justify-center space-x-4">
            <span className={interval === 'month' ? 'font-semibold' : 'text-gray-500'}>
              Monthly
            </span>
            <button
              onClick={() => setInterval(interval === 'month' ? 'year' : 'month')}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                interval === 'year' ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  interval === 'year' ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={interval === 'year' ? 'font-semibold' : 'text-gray-500'}>
              Yearly <span className="text-green-600 text-sm">(Save 20%)</span>
            </span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {PLANS.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              interval={interval}
              isSelected={selectedPlan === plan.id}
              onSelect={() => handleSubscribe(plan.id)}
            />
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto mt-16">
          <h2 className="text-2xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <FAQItem
              question="Can I change plans later?"
              answer="Yes, you can upgrade or downgrade your plan at any time."
            />
            <FAQItem
              question="What payment methods do you accept?"
              answer="We accept all major credit cards, PayPal, and bank transfers for annual plans."
            />
            <FAQItem
              question="Is there a free trial?"
              answer="Yes, all paid plans come with a 14-day free trial. No credit card required."
            />
            <FAQItem
              question="What happens when I exceed my participant limit?"
              answer="You'll be notified when approaching your limit. Meetings can continue with up to 10% overage."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

interface PricingCardProps {
  plan: PricingPlan;
  interval: 'month' | 'year';
  isSelected: boolean;
  onSelect: () => void;
}

function PricingCard({ plan, interval, isSelected, onSelect }: PricingCardProps) {
  const price = interval === 'year' 
    ? Math.floor(plan.price * 12 * 0.8) 
    : plan.price;

  return (
    <div
      className={`relative bg-white rounded-xl shadow-lg p-6 ${
        plan.popular ? 'ring-2 ring-blue-600 scale-105' : ''
      } ${isSelected ? 'border-2 border-blue-600' : 'border border-gray-200'}`}
    >
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full">
            Most Popular
          </span>
        </div>
      )}

      <div className="text-center mb-6">
        <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
        <div className="flex items-baseline justify-center">
          <span className="text-4xl font-bold">
            ${price}
          </span>
          <span className="text-gray-500 ml-2">
            /{interval === 'year' ? 'year' : 'month'}
          </span>
        </div>
        {interval === 'year' && plan.price > 0 && (
          <p className="text-sm text-green-600 mt-1">
            Save ${plan.price * 12 - price}
          </p>
        )}
      </div>

      <ul className="space-y-3 mb-6">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span className="text-sm text-gray-600">{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        variant={plan.popular ? 'primary' : 'outline'}
        className="w-full"
        onClick={onSelect}
        disabled={isSelected}
      >
        {isSelected ? 'Selected' : plan.price === 0 ? 'Get Started' : 'Start Free Trial'}
      </Button>
    </div>
  );
}

interface FAQItemProps {
  question: string;
  answer: string;
}

function FAQItem({ question, answer }: FAQItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <span className="font-medium">{question}</span>
        <span className="text-xl">{isOpen ? '−' : '+'}</span>
      </button>
      {isOpen && (
        <div className="px-4 pb-4 text-gray-600">
          {answer}
        </div>
      )}
    </div>
  );
}

export default PricingPage;
