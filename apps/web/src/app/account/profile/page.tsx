'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Badge } from '@vantage/ui';
import {
  User,
  Mail,
  Lock,
  Camera,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Shield,
  Key,
  LogOut,
  Activity,
  Trash2,
  Download,
  Video,
  FileText,
  Monitor,
  Globe,
  Smartphone,
  X,
  Edit2,
  Save,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { profileService, type UserProfile } from '@/services/ProfileService';
import { MFAManagement } from '@/components/MFAManagement';
import { PrivacySettings } from '@/components/PrivacySettings';

interface RecentActivity {
  id: string;
  type: 'meeting' | 'recording' | 'login' | 'profile' | 'settings';
  title: string;
  description: string;
  timestamp: string;
  icon: any;
  color: string;
}

interface Session {
  id: string;
  device: string;
  browser: string;
  location: string;
  ip: string;
  lastActive: string;
  current: boolean;
}

export default function ProfileManagement() {
  const router = useRouter();
  const { logout } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Profile state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Avatar upload state
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  
  // Profile form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    avatarUrl: '',
    bio: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [originalData, setOriginalData] = useState<typeof formData | null>(null);
  
  // Password change form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  
  // Sessions state
  const [sessions, setSessions] = useState<Session[]>([]);
  
  // Recent activity
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  
  // Messages with auto-dismiss
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  
  // Auto-dismiss messages after 5 seconds
  useEffect(() => {
    if (success || error || info) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
        setInfo(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [success, error, info]);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setIsLoading(true);
      const data = await profileService.getProfile();
      setProfile(data);
      const profileData = {
        name: data.name || '',
        email: data.email || '',
        avatarUrl: data.avatarUrl || '',
        bio: data.bio || '',
      };
      setFormData(profileData);
      setOriginalData({ ...profileData });
      loadRecentActivity(data);
      loadSessions();
    } catch (error: any) {
      setError(error.message || 'Failed to load profile');
      // If unauthorized, redirect to login
      if (error.message?.includes('Unauthorized')) {
        logout();
        router.push('/login');
      }
    } finally {
      setIsLoading(false);
    }
  }

  function loadSessions() {
    // Mock sessions - in production, fetch from API
    const mockSessions: Session[] = [
      {
        id: '1',
        device: 'Desktop',
        browser: 'Chrome on Windows',
        location: 'New York, USA',
        ip: '192.168.1.1',
        lastActive: new Date().toISOString(),
        current: true,
      },
      {
        id: '2',
        device: 'Mobile',
        browser: 'Safari on iPhone',
        location: 'New York, USA',
        ip: '192.168.1.2',
        lastActive: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        current: false,
      },
    ];
    setSessions(mockSessions);
  }

  function loadRecentActivity(_userData: UserProfile) {
    const activities: RecentActivity[] = [
      {
        id: '1',
        type: 'meeting',
        title: 'Joined Q1 Planning Meeting',
        description: 'You participated in a 45-minute meeting',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        icon: Video,
        color: 'text-blue-400',
      },
      {
        id: '2',
        type: 'recording',
        title: 'Viewed Recording',
        description: 'Watched "Board Meeting Dec 2025"',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        icon: FileText,
        color: 'text-purple-400',
      },
      {
        id: '3',
        type: 'login',
        title: 'Successful Login',
        description: 'Logged in from Chrome on Windows',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        icon: Shield,
        color: 'text-green-400',
      },
      {
        id: '4',
        type: 'settings',
        title: 'Profile Updated',
        description: 'Changed your profile information',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
        icon: User,
        color: 'text-amber-400',
      },
    ];
    setRecentActivities(activities);
  }

  // Form validation
  function validateForm(): boolean {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }
    
    if (formData.bio && formData.bio.length > 500) {
      errors.bio = 'Bio must be less than 500 characters';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  // Password strength calculator
  useEffect(() => {
    const pwd = passwordForm.newPassword;
    let strength = 0;
    
    if (pwd.length >= 8) strength++;
    if (pwd.length >= 12) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^a-zA-Z0-9]/.test(pwd)) strength++;
    
    setPasswordStrength(Math.min(strength, 5));
  }, [passwordForm.newPassword]);

  function validatePasswordForm(): boolean {
    const errors: Record<string, string> = {};
    
    if (!passwordForm.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    
    if (passwordForm.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters';
    } else if (passwordForm.newPassword.length > 100) {
      errors.newPassword = 'Password must be less than 100 characters';
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSaveProfile() {
    if (!validateForm()) return;
    
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      await profileService.updateProfile({
        name: formData.name.trim(),
        avatarUrl: formData.avatarUrl || undefined,
        bio: formData.bio || undefined,
      });

      setOriginalData({ ...formData });
      setSuccess('Profile updated successfully');
      setIsEditing(false);
      await loadProfile();
    } catch (error: any) {
      setError(error.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  }

  function handleEditProfile() {
    setIsEditing(true);
    setFormErrors({});
  }

  function handleCancelEdit() {
    if (originalData) {
      setFormData(originalData);
    }
    setFormErrors({});
    setIsEditing(false);
  }

  function hasUnsavedChanges(): boolean {
    if (!originalData) return false;
    return (
      formData.name !== originalData.name ||
      formData.avatarUrl !== originalData.avatarUrl ||
      formData.bio !== originalData.bio
    );
  }

  // Avatar upload with drag & drop
  async function handleAvatarUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    await processAvatarFile(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    processAvatarFile(file);
  }

  async function processAvatarFile(file: File | undefined) {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, GIF)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    try {
      setIsUploadingAvatar(true);
      setError(null);

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
      setFormData({ ...formData, avatarUrl: previewUrl });

      // In production, upload to S3/Cloudinary here
      // const uploadResult = await uploadAvatar(file);
      // setFormData({ ...formData, avatarUrl: uploadResult.url });

      setSuccess('Avatar selected successfully. Don\'t forget to save changes!');
    } catch (error: any) {
      setError(error.message || 'Failed to process avatar');
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  async function handleChangePassword() {
    if (!validatePasswordForm()) return;

    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      await profileService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      setSuccess('Password changed successfully');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setIsChangingPassword(false);
      setPasswordErrors({});
    } catch (error: any) {
      setError(error.message || 'Failed to change password');
    } finally {
      setIsSaving(false);
    }
  }

  function handleLogout() {
    logout();
    router.push('/');
  }

  async function handleTerminateSession(sessionId: string) {
    try {
      // In production, call API to terminate session
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      setSuccess('Session terminated successfully');
    } catch (error: any) {
      setError('Failed to terminate session');
    }
  }

  async function handleTerminateAllSessions() {
    if (!confirm('Are you sure you want to log out from all other devices?')) return;
    
    try {
      // In production, call API
      setSessions(prev => prev.filter(s => s.current));
      setSuccess('All other sessions terminated');
    } catch (error: any) {
      setError('Failed to terminate sessions');
    }
  }

  async function handleDataExport() {
    try {
      setInfo('Preparing your data export...');
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSuccess('Data export request submitted. You\'ll receive an email when ready.');
    } catch (error: any) {
      setError('Failed to request data export');
    }
  }

  function getTimeAgo(timestamp: string): string {
    const now = new Date();
    const past = new Date(timestamp);
    const diffInMs = now.getTime() - past.getTime();
    const diffInMinutes = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${diffInDays}d ago`;
  }

  function getStrengthLabel() {
    const labels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    const colors = ['text-red-400', 'text-red-400', 'text-yellow-400', 'text-blue-400', 'text-green-400', 'text-emerald-400'];
    return { label: labels[passwordStrength], color: colors[passwordStrength] };
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500 mx-auto" />
          <p className="text-slate-400">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      {/* Header */}
      <header className="bg-gradient-to-b from-[#0a0e1a] to-[#0f172a] border-b border-slate-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Account Settings</h1>
                <p className="text-slate-400 text-sm">Manage your profile, security, and preferences</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => router.push('/dashboard')}
                variant="outline"
                className="border-slate-700 text-slate-300 hover:bg-slate-800 hidden sm:flex"
              >
                Back to Dashboard
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="border-slate-700 text-slate-300 hover:bg-red-600/10 hover:text-red-400 hover:border-red-600/30"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Messages */}
        {success && (
          <div className="p-4 rounded-lg bg-green-600/10 border border-green-600/30 text-green-400 flex items-center justify-between animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              {success}
            </div>
            <button onClick={() => setSuccess(null)} className="hover:text-green-300">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-lg bg-red-600/10 border border-red-600/30 text-red-400 flex items-center justify-between animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              {error}
            </div>
            <button onClick={() => setError(null)} className="hover:text-red-300">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {info && (
          <div className="p-4 rounded-lg bg-blue-600/10 border border-blue-600/30 text-blue-400 flex items-center justify-between animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              {info}
            </div>
            <button onClick={() => setInfo(null)} className="hover:text-blue-300">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Profile & Security */}
          <div className="lg:col-span-2 space-y-8">
            {/* Profile Section */}
            <section className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <User className="h-5 w-5 text-amber-400" />
                  Profile Information
                </h2>
                {!isEditing ? (
                  <Button
                    onClick={handleEditProfile}
                    variant="outline"
                    className="border-slate-700 text-slate-300 hover:bg-slate-700"
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleCancelEdit}
                      variant="outline"
                      className="border-slate-700 text-slate-300"
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveProfile}
                      disabled={isSaving || !hasUnsavedChanges()}
                      className="bg-amber-600 hover:bg-amber-500 text-white"
                    >
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                      Save Changes
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                {/* Avatar Upload */}
                <div className="flex items-start gap-6">
                  <div 
                    className={`relative group ${dragActive ? 'ring-2 ring-amber-500 ring-offset-2 ring-offset-slate-800' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    {avatarPreview || formData.avatarUrl ? (
                      <img
                        src={avatarPreview || formData.avatarUrl}
                        alt="Profile"
                        className="w-28 h-28 rounded-full object-cover border-2 border-amber-500/30 shadow-lg"
                      />
                    ) : (
                      <div className="w-28 h-28 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center border-2 border-amber-500/30 shadow-lg">
                        <span className="text-4xl font-bold text-white">
                          {formData.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingAvatar || !isEditing}
                      className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-slate-700/90 border border-slate-600 flex items-center justify-center hover:bg-slate-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed group-hover:scale-110"
                      title="Upload avatar"
                    >
                      {isUploadingAvatar ? (
                        <Loader2 className="h-4 w-4 animate-spin text-slate-300" />
                      ) : (
                        <Camera className="h-4 w-4 text-slate-300" />
                      )}
                    </button>
                    {dragActive && (
                      <div className="absolute inset-0 rounded-full bg-amber-500/20 backdrop-blur-sm flex items-center justify-center">
                        <Upload className="h-8 w-8 text-amber-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 pt-2">
                    <h3 className="text-lg font-medium text-white">{formData.name}</h3>
                    <p className="text-slate-400 text-sm">{formData.email}</p>
                    <Badge className="mt-2 bg-amber-600/20 text-amber-400 border-amber-600/30">
                      {profile?.role || 'User'}
                    </Badge>
                    {isEditing && (
                      <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                        <ImageIcon className="h-3 w-3" />
                        Drag & drop or click camera to upload
                      </p>
                    )}
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        disabled={!isEditing}
                        className={`w-full bg-slate-900 border rounded-lg pl-10 pr-4 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50 transition-colors ${
                          !isEditing ? 'border-slate-700 cursor-not-allowed' : formErrors.name ? 'border-red-500/50' : 'border-slate-700'
                        }`}
                      />
                    </div>
                    {formErrors.name && (
                      <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {formErrors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="email"
                        value={formData.email}
                        disabled
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-slate-400 cursor-not-allowed"
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Contact support to change email</p>
                  </div>

                  {isEditing && (
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Bio (optional)
                      </label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <textarea
                          value={formData.bio}
                          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                          disabled={!isEditing}
                          placeholder="Tell us about yourself..."
                          rows={3}
                          className={`w-full bg-slate-900 border rounded-lg pl-10 pr-4 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50 transition-colors resize-none ${
                            formErrors.bio ? 'border-red-500/50' : 'border-slate-700'
                          }`}
                        />
                      </div>
                      <div className="flex justify-between mt-1">
                        {formErrors.bio ? (
                          <p className="text-xs text-red-400 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {formErrors.bio}
                          </p>
                        ) : (
                          <span />
                        )}
                        <p className="text-xs text-slate-500">{formData.bio?.length || 0}/500</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Security Section */}
            <section className="space-y-6">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Shield className="h-5 w-5 text-amber-400" />
                Security
              </h2>

              {/* Password Change */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center">
                      <Lock className="h-5 w-5 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-white">Password</h3>
                      <p className="text-sm text-slate-400">Change your account password</p>
                    </div>
                  </div>
                  {!isChangingPassword && (
                    <Button
                      variant="outline"
                      onClick={() => setIsChangingPassword(true)}
                      className="border-slate-700 text-slate-300 hover:bg-slate-700"
                    >
                      Change
                    </Button>
                  )}
                </div>

                {isChangingPassword && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Current Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                          className={`w-full bg-slate-900 border rounded-lg pl-10 pr-10 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50 ${
                            passwordErrors.currentPassword ? 'border-red-500/50' : 'border-slate-700'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        >
                          {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {passwordErrors.currentPassword && (
                        <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {passwordErrors.currentPassword}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                          className={`w-full bg-slate-900 border rounded-lg pl-10 pr-10 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50 ${
                            passwordErrors.newPassword ? 'border-red-500/50' : 'border-slate-700'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-300 ${
                              passwordStrength <= 2 ? 'bg-red-500' : passwordStrength <= 3 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${(passwordStrength / 5) * 100}%` }}
                          />
                        </div>
                        <span className={`text-xs font-medium ${getStrengthLabel().color}`}>
                          {getStrengthLabel().label}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-3 text-xs">
                        <span className={passwordForm.newPassword.length >= 8 ? 'text-green-400' : 'text-slate-500'}>
                          {passwordForm.newPassword.length >= 8 ? '✓' : '○'} 8+ characters
                        </span>
                        <span className={/[A-Z]/.test(passwordForm.newPassword) ? 'text-green-400' : 'text-slate-500'}>
                          {/[A-Z]/.test(passwordForm.newPassword) ? '✓' : '○'} Uppercase
                        </span>
                        <span className={/[0-9]/.test(passwordForm.newPassword) ? 'text-green-400' : 'text-slate-500'}>
                          {/[0-9]/.test(passwordForm.newPassword) ? '✓' : '○'} Number
                        </span>
                        <span className={/[^a-zA-Z0-9]/.test(passwordForm.newPassword) ? 'text-green-400' : 'text-slate-500'}>
                          {/[^a-zA-Z0-9]/.test(passwordForm.newPassword) ? '✓' : '○'} Special char
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                          className={`w-full bg-slate-900 border rounded-lg pl-10 pr-10 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50 ${
                            passwordErrors.confirmPassword ? 'border-red-500/50' : 'border-slate-700'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {passwordForm.confirmPassword && passwordForm.newPassword === passwordForm.confirmPassword && (
                        <p className="mt-1 text-xs text-green-400 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" /> Passwords match
                        </p>
                      )}
                      {passwordErrors.confirmPassword && (
                        <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {passwordErrors.confirmPassword}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button
                        onClick={handleChangePassword}
                        disabled={isSaving || !passwordForm.currentPassword || !passwordForm.newPassword}
                        className="bg-amber-600 hover:bg-amber-500 text-white"
                      >
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update Password'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsChangingPassword(false);
                          setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                          setPasswordErrors({});
                        }}
                        className="border-slate-700 text-slate-300 hover:bg-slate-700"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* MFA Management */}
              <MFAManagement />

              {/* Active Sessions */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-white flex items-center gap-2">
                    <Monitor className="h-5 w-5 text-amber-400" />
                    Active Sessions
                  </h3>
                  {sessions.filter(s => !s.current).length > 0 && (
                    <Button
                      variant="outline"
                      onClick={handleTerminateAllSessions}
                      className="border-slate-700 text-slate-300 text-xs hover:bg-red-600/10 hover:text-red-400"
                    >
                      Log Out All
                    </Button>
                  )}
                </div>

                <div className="space-y-3">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center">
                          {session.device === 'Mobile' ? (
                            <Smartphone className="h-5 w-5 text-amber-400" />
                          ) : (
                            <Monitor className="h-5 w-5 text-amber-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{session.browser}</p>
                          <p className="text-xs text-slate-400">{session.location} • {getTimeAgo(session.lastActive)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {session.current ? (
                          <Badge className="bg-green-600/20 text-green-400 border-green-600/30 text-xs">
                            Current Device
                          </Badge>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTerminateSession(session.id)}
                            className="text-slate-400 hover:text-red-400 hover:bg-red-600/10"
                          >
                            Log Out
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>

          {/* Right Column - Activity & Settings */}
          <div className="space-y-8">
            {/* Recent Activity */}
            <section className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Activity className="h-5 w-5 text-amber-400" />
                  Recent Activity
                </h2>
                <button className="text-xs text-purple-400 hover:text-purple-300 transition-all">
                  View All
                </button>
              </div>

              <div className="space-y-4">
                {recentActivities.map((activity) => {
                  const Icon = activity.icon;
                  return (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-700/30 transition-colors"
                    >
                      <div className={`w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`h-5 w-5 ${activity.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-white truncate">{activity.title}</h3>
                        <p className="text-xs text-slate-400 truncate">{activity.description}</p>
                        <p className="text-xs text-slate-500 mt-1">{getTimeAgo(activity.timestamp)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Privacy & Data */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Key className="h-5 w-5 text-amber-400" />
                Privacy & Data
              </h2>
              <PrivacySettings />
            </section>

            {/* Quick Actions */}
            <section className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-semibold text-white">Quick Actions</h2>
              
              <Button
                onClick={handleDataExport}
                variant="outline"
                className="w-full justify-start border-slate-700 text-slate-300 hover:bg-slate-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Download My Data
              </Button>
              
              <Button
                onClick={() => router.push('/account/billing')}
                variant="outline"
                className="w-full justify-start border-slate-700 text-slate-300 hover:bg-slate-700"
              >
                <Globe className="h-4 w-4 mr-2" />
                Billing & Subscription
              </Button>
            </section>

            {/* Danger Zone */}
            <section className="bg-red-600/10 border border-red-600/30 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-red-400 mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Danger Zone
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-red-600/20">
                  <div>
                    <h3 className="font-medium text-white">Logout</h3>
                    <p className="text-sm text-slate-400">Sign out from current session</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleLogout}
                    className="border-red-600/30 text-red-400 hover:bg-red-600/20"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
                <div>
                  <h3 className="font-medium text-white mb-2">Delete Account</h3>
                  <p className="text-sm text-slate-400 mb-3">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                  <Button
                    variant="destructive"
                    className="w-full"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
