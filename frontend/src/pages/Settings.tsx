import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  User as UserIcon,
  Bell,
  Sparkles,
  Shield,
  Save,
  CheckCircle2,
  Building,
  Mail,
  Zap,
  Lock,
  Image as ImageIcon,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const Settings: React.FC = () => {
  const { user, updateUser, changePassword } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [role, setRole] = useState('');
  const [avatar, setAvatar] = useState('');
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    priorityReminders: true,
    followupAlerts: true,
    contextAutoSave: true,
  });

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setDepartment(user.department || '');
      setRole(user.role || '');
      setAvatar(user.avatar || '');
      if (user.preferences) {
        setPreferences({
          emailNotifications: user.preferences.emailNotifications ?? true,
          priorityReminders: user.preferences.priorityReminders ?? true,
          followupAlerts: user.preferences.followupAlerts ?? true,
          contextAutoSave: user.preferences.contextAutoSave ?? true,
        });
      }
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const res = await api.users.update({
        name,
        department,
        role,
        avatar,
        preferences,
      });

      if (res.success) {
        updateUser({
          name,
          department,
          role,
          avatar,
          preferences,
        });
        showToast('Settings and profile updated successfully!', 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to save settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPassError('Please fill in all password fields.');
      return;
    }

    if (newPassword.length < 8) {
      setPassError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError('New passwords do not match.');
      return;
    }

    try {
      setIsChangingPass(true);
      await changePassword({ currentPassword, newPassword, confirmPassword });
      showToast('Password changed successfully!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPassError(err.message || 'Failed to change password. Please check your current password.');
    } finally {
      setIsChangingPass(false);
    }
  };

  const togglePref = (key: keyof typeof preferences) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const presetAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80',
  ];

  if (isLoading) {
    return <LoadingSpinner message="Loading user profile settings..." />;
  }

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto animate-page-enter">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <SettingsIcon className="w-7 h-7 text-brand-400" />
          Settings & Profile
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 mt-1">
          Manage your user profile, security credentials, and AI companion behaviors.
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile Details Card */}
        <form onSubmit={handleSaveProfile} className="bg-white rounded-3xl p-6 sm:p-8 border border-cream-300 shadow-card space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-cream-200">
            <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-ink-900">Profile Information</h2>
              <p className="text-xs text-ink-500">Your identity within your OfficeCompanion workspace.</p>
            </div>
          </div>

          {/* Avatar Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-ink-600">
              Profile Picture / Avatar
            </label>
            <div className="flex items-center gap-4 flex-wrap">
              {avatar ? (
                <img
                  src={avatar}
                  alt="Avatar"
                  className="w-14 h-14 rounded-2xl object-cover ring-2 ring-brand-500 shadow-sm"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 text-white flex items-center justify-center font-bold text-lg ring-2 ring-brand-400">
                  {name ? name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}

              <div className="flex-1 min-w-[200px] space-y-2">
                <input
                  type="text"
                  placeholder="Paste custom image URL..."
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  className="w-full px-3.5 py-2 bg-cream-50 border border-cream-300 rounded-xl text-xs sm:text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-ink-400 font-medium">Or pick a preset:</span>
                  {presetAvatars.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setAvatar(url)}
                      className="w-7 h-7 rounded-lg overflow-hidden border border-cream-300 hover:border-brand-500 transition-all hover:scale-105 cursor-pointer"
                    >
                      <img src={url} alt="Preset" className="w-full h-full object-cover" />
                    </button>
                  ))}
                  {avatar && (
                    <button
                      type="button"
                      onClick={() => setAvatar('')}
                      className="text-[11px] text-red-600 hover:text-red-700 underline font-medium ml-1"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-ink-600">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-cream-50 border border-cream-300 rounded-xl text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-ink-600">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-ink-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-cream-100/60 border border-cream-300 rounded-xl text-sm text-ink-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-ink-600">
                Department
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-ink-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. Engineering, Marketing, Operations"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-cream-50 border border-cream-300 rounded-xl text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-ink-600">
                Role / Title
              </label>
              <input
                type="text"
                placeholder="e.g. Engineering Lead, Product Manager"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-cream-50 border border-cream-300 rounded-xl text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-brand-500/20 active:scale-95 transition-all disabled:opacity-70 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving Profile...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>

        {/* Security & Password Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-cream-300 shadow-card space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-cream-200">
            <div className="w-10 h-10 rounded-xl bg-ink-100 text-ink-800 flex items-center justify-center font-bold">
              <KeyRound className="w-5 h-5 text-ink-700" />
            </div>
            <div>
              <h2 className="text-base font-bold text-ink-900">Security & Authentication</h2>
              <p className="text-xs text-ink-500">Manage your sign-in methods and password.</p>
            </div>
          </div>

          {user?.authProvider === 'google' ? (
            <div className="p-4 rounded-2xl bg-brand-50/60 border border-brand-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <div>
                  <div className="text-xs font-bold text-ink-900">Signed in with Google OAuth</div>
                  <div className="text-[11px] text-ink-500">Your account authentication is secured through Google identity.</div>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
                Connected
              </span>
            </div>
          ) : (
            <form onSubmit={handlePasswordChange} className="space-y-4">
              {passError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-700">
                  {passError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-ink-600">
                    Current Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-ink-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-cream-50 border border-cream-300 rounded-xl text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-ink-600">
                    New Password (min 8)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-ink-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-cream-50 border border-cream-300 rounded-xl text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-ink-600">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-ink-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-cream-50 border border-cream-300 rounded-xl text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isChangingPass}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-ink-900 hover:bg-ink-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm active:scale-95 transition-all disabled:opacity-70 cursor-pointer"
                >
                  <Shield className="w-4 h-4" />
                  <span>{isChangingPass ? 'Updating Password...' : 'Update Password'}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* AI & Intelligence Preferences Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-cream-300 shadow-card space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-cream-200">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-ink-900">AI & Context Assistant</h2>
              <p className="text-xs text-ink-500">Configure AI prioritization behaviors and auto-recovery.</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Toggle 1 */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-cream-50 border border-cream-200">
              <div className="space-y-0.5 pr-4">
                <div className="text-sm font-bold text-ink-900 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Auto-Save Active Work Context
                </div>
                <p className="text-xs text-ink-500">
                  Automatically preserve notes, completed steps, and next steps when switching tasks.
                </p>
              </div>
              <button
                type="button"
                onClick={() => togglePref('contextAutoSave')}
                className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-0.5 cursor-pointer ${
                  preferences.contextAutoSave ? 'bg-brand-600' : 'bg-cream-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                    preferences.contextAutoSave ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Toggle 2 */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-cream-50 border border-cream-200">
              <div className="space-y-0.5 pr-4">
                <div className="text-sm font-bold text-ink-900 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-brand-600" />
                  Real-time Priority Reminders
                </div>
                <p className="text-xs text-ink-500">
                  Notify when a high-impact task's deadline is approaching or priority shifts.
                </p>
              </div>
              <button
                type="button"
                onClick={() => togglePref('priorityReminders')}
                className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-0.5 cursor-pointer ${
                  preferences.priorityReminders ? 'bg-brand-600' : 'bg-cream-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                    preferences.priorityReminders ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Toggle 3 */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-cream-50 border border-cream-200">
              <div className="space-y-0.5 pr-4">
                <div className="text-sm font-bold text-ink-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Follow-up Commitment Alerts
                </div>
                <p className="text-xs text-ink-500">
                  Alert on due and overdue colleague commitments extracted via AI.
                </p>
              </div>
              <button
                type="button"
                onClick={() => togglePref('followupAlerts')}
                className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-0.5 cursor-pointer ${
                  preferences.followupAlerts ? 'bg-brand-600' : 'bg-cream-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                    preferences.followupAlerts ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
