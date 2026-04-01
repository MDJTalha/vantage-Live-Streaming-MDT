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
  Clock,
  Video,
  FileText,
  Activity,
  Trash2,
  X
} from 'lucide-react';
import { profileService, type UserProfile } from '@/services/ProfileService';
import { MFAManagement } from '@/components/MFAManagement';
import { PrivacySettings } from '@/components/PrivacySettings';

interface RecentActivity {
  id: string;
  type: 'meeting' | 'recording' | 'login' | 'profile';
  title: string;
  description: string;
  timestamp: string;
  icon: any;
}

export default function ProfileManagement() {
  const router = useRouter();
  const { logout, user: authUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Profile form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    avatarUrl: '',
  });

  // Password change form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Recent activity
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);

  // Messages
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setIsLoading(true);
      const data = await profileService.getProfile();
      setProfile(data);
      setFormData({
        name: data.name || '',
        email: data.email || '',
        avatarUrl: data.avatarUrl || '',
      });
      loadRecentActivity(data);
    } catch (error: any) {
      setError(error.message || 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  }

  function loadRecentActivity(userData: UserProfile) {
    // Simulated recent activity - in production, fetch from API
    const activities: RecentActivity[] = [
      {
        id: '1',
        type: 'meeting',
        title: 'Joined Q1 Planning Meeting',
        description: 'You participated in a 45-minute meeting',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
        icon: Video,
      },
      {
        id: '2',
        type: 'recording',
        title: 'Viewed Recording',
        description: 'Watched "Board Meeting Dec 2025"',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        icon: FileText,
      },
      {
        id: '3',
        type: 'login',
        title: 'Successful Login',
        description: 'Logged in from Chrome on Windows',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
        icon: Shield,
      },
      {
        id: '4',
        type: 'profile',
        title: 'Profile Updated',
        description: 'Changed your profile information',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
        icon: User,
      },
    ];
    setRecentActivities(activities);
  }

  async function handleSaveProfile() {
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      await profileService.updateProfile({
        name: formData.name,
        avatarUrl: formData.avatarUrl || undefined,
      });

      setSuccess('Profile updated successfully');
      await loadProfile();
    } catch (error: any) {
      setError(error.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAvatarUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
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

      // In production, upload to S3/Cloudinary and get URL
      // For now, create a local preview URL
      const previewUrl = URL.createObjectURL(file);
      
      // Update local state
      setFormData({ ...formData, avatarUrl: previewUrl });
      
      // In production, you would upload the file here:
      // const uploadResult = await uploadAvatar(file);
      // setFormData({ ...formData, avatarUrl: uploadResult.url });

      setSuccess('Avatar uploaded successfully');
    } catch (error: any) {
      setError(error.message || 'Failed to upload avatar');
    } finally {
      setIsUploadingAvatar(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  async function handleChangePassword() {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      {/* Header */}
      <header className="bg-gradient-to-b from-[#0a0e1a] to-[#0f172a] border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Account Settings</h1>
                <p className="text-slate-400 text-sm">Manage your profile and security</p>
              </div>
            </div>
            <Button
              onClick={() => router.push('/dashboard')}
              variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Success/Error Messages */}
        {success && (
          <div className="p-4 rounded-lg bg-green-600/10 border border-green-600/30 text-green-400 flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            {success}
          </div>
        )}

        {error && (
          <div className="p-4 rounded-lg bg-red-600/10 border border-red-600/30 text-red-400 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Profile & Security */}
          <div className="lg:col-span-2 space-y-8">
            {/* Profile Section */}
            <section className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <User className="h-5 w-5 text-amber-400" />
                Profile Information
              </h2>

              <div className="space-y-6">
                {/* Avatar */}
                <div className="flex items-center gap-6">
                  <div className="relative">
                    {formData.avatarUrl ? (
                      <img
                        src={formData.avatarUrl}
                        alt="Profile"
                        className="w-24 h-24 rounded-full object-cover border-2 border-amber-500/30"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center border-2 border-amber-500/30">
                        <span className="text-3xl font-bold text-white">
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
                      disabled={isUploadingAvatar}
                      className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center hover:bg-slate-600 transition-colors disabled:opacity-50"
                      title="Upload avatar"
                    >
                      {isUploadingAvatar ? (
                        <Loader2 className="h-4 w-4 animate-spin text-slate-300" />
                      ) : (
                        <Camera className="h-4 w-4 text-slate-300" />
                      )}
                    </button>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white">{formData.name}</h3>
                    <p className="text-slate-400">{formData.email}</p>
                    <Badge className="mt-2 bg-amber-600/20 text-amber-400 border-amber-600/30">
                      {profile?.role || 'User'}
                    </Badge>
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
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
                      />
                    </div>
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
                    <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Avatar URL (optional)
                    </label>
                    <div className="relative">
                      <Camera className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="url"
                        value={formData.avatarUrl}
                        onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                        placeholder="https://example.com/avatar.jpg"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="bg-amber-600 hover:bg-amber-500 text-white"
                  >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
                  </Button>
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
                      className="border-slate-700 text-slate-300"
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
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-10 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        >
                          {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
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
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-10 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <div className="mt-2 flex items-center gap-4 text-xs">
                        <span className={passwordForm.newPassword.length >= 8 ? 'text-green-400' : 'text-slate-500'}>
                          {passwordForm.newPassword.length >= 8 ? '✓' : '○'} Min 8 characters
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
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-10 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
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
                        }}
                        className="border-slate-700 text-slate-300"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* MFA Management */}
              <MFAManagement />
            </section>
          </div>

          {/* Right Column - Recent Activity & Other Settings */}
          <div className="space-y-8">
            {/* Recent Activity (NEW) */}
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
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0">
                        <Icon className="h-5 w-5 text-amber-400" />
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

            {/* Privacy Section */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Key className="h-5 w-5 text-amber-400" />
                Privacy & Data
              </h2>
              <PrivacySettings />
            </section>

            {/* Danger Zone */}
            <section className="bg-red-600/10 border border-red-600/30 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-red-400 mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Danger Zone
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-white">Logout</h3>
                    <p className="text-sm text-slate-400">Sign out from current session</p>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-red-600/20">
                  <div>
                    <h3 className="font-medium text-white">Delete Account</h3>
                    <p className="text-sm text-slate-400">Permanently delete your account and data</p>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => router.push('/account/delete')}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
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
