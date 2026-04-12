'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  Video, Calendar, Users, BarChart3, Mic, Settings, LogOut,
  Home, Brain, Library, Shield, Sparkles, ChevronDown, Menu, X
} from 'lucide-react';
import { useState } from 'react';

interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  requiresAuth?: boolean;
  requiresRole?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <Home className="h-4 w-4" />, requiresAuth: true },
  { label: 'Create Room', href: '/create-room', icon: <Video className="h-4 w-4" />, requiresAuth: true },
  { label: 'Schedule', href: '/schedule-room', icon: <Calendar className="h-4 w-4" />, requiresAuth: true },
  { label: 'Join', href: '/join', icon: <Users className="h-4 w-4" /> },
  { label: 'Recordings', href: '/recordings', icon: <Library className="h-4 w-4" />, requiresAuth: true },
  { label: 'Analytics', href: '/analytics', icon: <BarChart3 className="h-4 w-4" />, requiresAuth: true },
  { label: 'Podcast', href: '/podcast', icon: <Mic className="h-4 w-4" />, requiresAuth: true },
  { label: 'AI Tools', href: '/ai-data-correction', icon: <Brain className="h-4 w-4" />, requiresAuth: true },
  { label: 'Admin', href: '/admin', icon: <Shield className="h-4 w-4" />, requiresAuth: true, requiresRole: 'ADMIN' },
];

export function NavigationHeader() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const handleNavigate = (href: string) => {
    router.push(href);
    setMobileMenuOpen(false);
  };

  // Filter nav items based on auth and role requirements
  const filteredItems = NAV_ITEMS.filter(item => {
    if (item.requiresAuth && !user) return false;
    if (item.requiresRole && user?.role !== item.requiresRole) return false;
    return true;
  });

  return (
    <header className="sticky top-0 z-50 border-b border-blue-500/20 bg-[#0a0f1f]/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={() => handleNavigate('/')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Video className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg text-white hidden sm:block">VANTAGE</span>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {filteredItems.map(item => (
              <button
                key={item.href}
                onClick={() => handleNavigate(item.href)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-blue-200 hover:text-white hover:bg-blue-500/10 transition-all"
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>

          {/* User Menu / Auth Buttons */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-500/10 transition-all"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden md:block text-sm text-blue-200">{user.name}</span>
                  <ChevronDown className={`h-4 w-4 text-blue-300 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-xl bg-[#1e293b] border border-blue-500/30 shadow-xl overflow-hidden">
                    {/* User Info */}
                    <div className="p-4 border-b border-blue-500/20">
                      <p className="font-semibold text-white">{user.name}</p>
                      <p className="text-sm text-blue-300">{user.email}</p>
                      <p className="text-xs text-blue-400 mt-1">Role: {user.role}</p>
                    </div>

                    {/* Menu Items */}
                    <div className="p-2">
                      <button
                        onClick={() => {
                          handleNavigate('/account/profile');
                          setUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-blue-200 hover:text-white hover:bg-blue-500/10 transition-all"
                      >
                        <Settings className="h-4 w-4" />
                        Profile Settings
                      </button>
                      <button
                        onClick={() => {
                          handleNavigate('/account/billing');
                          setUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-blue-200 hover:text-white hover:bg-blue-500/10 transition-all"
                      >
                        <Sparkles className="h-4 w-4" />
                        Billing & Plan
                      </button>
                      <button
                        onClick={() => {
                          handleNavigate('/executive-dashboard');
                          setUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-blue-200 hover:text-white hover:bg-blue-500/10 transition-all"
                      >
                        <Shield className="h-4 w-4" />
                        Executive Dashboard
                      </button>
                    </div>

                    {/* Logout */}
                    <div className="p-2 border-t border-blue-500/20">
                      <button
                        onClick={() => {
                          handleLogout();
                          setUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleNavigate('/login')}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-blue-200 hover:text-white transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => handleNavigate('/signup')}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-blue-200 hover:text-white hover:bg-blue-500/10 transition-all"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="lg:hidden py-4 border-t border-blue-500/20">
            <div className="space-y-1">
              {filteredItems.map(item => (
                <button
                  key={item.href}
                  onClick={() => handleNavigate(item.href)}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-blue-200 hover:text-white hover:bg-blue-500/10 transition-all"
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>
          </nav>
        )}
      </div>

      {/* Click outside to close user menu */}
      {userMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setUserMenuOpen(false)}
        />
      )}
    </header>
  );
}
