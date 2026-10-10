import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import {
  Loader2,
  X,
  ArrowRight,
  ShieldCheck,
  Crown,
  Laptop,
  Target,
  Kanban,
  Edit3,
  Check,
  Building2,
  Sparkles,
  ExternalLink,
  Settings,
  AlertCircle,
  HelpCircle,
  User as UserIcon,
  Copy,
  CheckCheck,
  Key,
} from 'lucide-react';
import { api } from '../../services/api';
import { User } from '../../types';

interface GoogleSignInButtonProps {
  text?: string;
  className?: string;
  showConfigTrigger?: boolean;
}

const PRESET_ROLES = [
  {
    id: 'lead',
    title: 'Lead / Team Lead',
    description: 'Manage team workloads, review daily outputs, and assign AI priorities.',
    icon: Crown,
    defaultRole: 'Team Lead',
    defaultDept: 'Engineering & Tech',
    badge: 'Management',
  },
  {
    id: 'employee',
    title: 'Employee / Engineer',
    description: 'Focus on deep work, track deliverables, context recovery, and daily tasks.',
    icon: Laptop,
    defaultRole: 'Software Engineer',
    defaultDept: 'Engineering & Tech',
    badge: 'Individual Contributor',
  },
  {
    id: 'pm',
    title: 'Product Manager',
    description: 'Track meeting intelligence, feature commitments, roadmap, and decisions.',
    icon: Target,
    defaultRole: 'Product Manager',
    defaultDept: 'Product Operations',
    badge: 'Product & Strategy',
  },
  {
    id: 'project_manager',
    title: 'Project Manager / Scrum Master',
    description: 'Orchestrate sprints, daily plans, dependencies, and resolve blockers.',
    icon: Kanban,
    defaultRole: 'Project Manager',
    defaultDept: 'Operations & Delivery',
    badge: 'Execution & Agile',
  },
  {
    id: 'custom',
    title: 'Specify Custom Role',
    description: 'Define your exact title and specialized department in your organization.',
    icon: Edit3,
    defaultRole: '',
    defaultDept: 'General Workspace',
    badge: 'Custom',
  },
];

const DEPARTMENTS = [
  'Engineering & Tech',
  'Product Operations',
  'Product Management',
  'UI/UX & Design',
  'Operations & Delivery',
  'Marketing & Growth',
  'Data & AI Research',
  'Executive Leadership',
  'Other / Custom',
];

const DEFAULT_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '1071006060591-tmhssin2h21lcre235vtolojh4g403ep.apps.googleusercontent.com';

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  text = 'Continue with Google',
  className = '',
  showConfigTrigger = true,
}) => {
  const { googleLogin, updateUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [showChooserModal, setShowChooserModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [googleClientId, setGoogleClientId] = useState<string>(() => {
    return localStorage.getItem('custom_google_client_id') || DEFAULT_CLIENT_ID;
  });
  const [tempClientId, setTempClientId] = useState(googleClientId);

  // Custom email input in chooser
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');

  // Authenticated user state from Google
  const [authenticatedUser, setAuthenticatedUser] = useState<User | null>(null);

  // Role Selection Onboarding state
  const [selectedRoleId, setSelectedRoleId] = useState<string>('lead');
  const [customRoleInput, setCustomRoleInput] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('Engineering & Tech');
  const [customDeptInput, setCustomDeptInput] = useState<string>('');
  const [isSavingRole, setIsSavingRole] = useState<boolean>(false);

  // Helper to copy text with feedback
  const copyToClipboard = (textToCopy: string, fieldName: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopiedField(fieldName);
    showToast(`Copied ${fieldName} to clipboard!`, 'success');
    setTimeout(() => setCopiedField(null), 2500);
  };

  // Authenticate payload with MongoDB backend
  const handleAuthPayload = useCallback(
    async (payload: {
      accessToken?: string;
      credential?: string;
      email: string;
      name: string;
      picture?: string;
      googleId?: string;
    }) => {
      try {
        setIsLoading(true);

        const res = await googleLogin({
          credential: payload.credential,
          accessToken: payload.accessToken,
          email: payload.email,
          name: payload.name,
          googleId: payload.googleId,
          picture: payload.picture,
        });

        if (res.success && res.user) {
          setAuthenticatedUser(res.user);
          setShowChooserModal(false);
          showToast(`Authenticated as ${res.user.name}! Saved in MongoDB.`, 'success');
          setShowRoleModal(true);
        }
      } catch (err: any) {
        console.error('Google Auth Processing Error:', err);
        showToast(err.message || 'Google sign-in failed. Please check backend connection.', 'error');
      } finally {
        setIsLoading(false);
      }
    },
    [googleLogin, showToast]
  );

  // Initialize Google Identity Services if client ID is set
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).google?.accounts?.id) {
      try {
        (window as any).google.accounts.id.initialize({
          client_id: googleClientId,
          callback: (response: any) => {
            if (response.credential) {
              handleAuthPayload({
                credential: response.credential,
                email: '',
                name: '',
              });
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });
      } catch (err) {
        console.warn('Google GSI init note:', err);
      }
    }
  }, [googleClientId, handleAuthPayload]);

  // Direct Account Selection from Account Chooser
  const handleAccountSelect = (acc: { name: string; email: string; avatarUrl?: string }) => {
    const deterministicGid = `google_107${Array.from(acc.email).reduce(
      (accVal, char) => accVal + char.charCodeAt(0),
      100000000000
    )}`;
    const avatar =
      acc.avatarUrl ||
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(acc.email)}`;

    handleAuthPayload({
      email: acc.email,
      name: acc.name,
      googleId: deterministicGid,
      picture: avatar,
    });
  };

  // Direct Custom Email submit in Chooser
  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail || !customEmail.includes('@')) {
      showToast('Please enter a valid Google email address.', 'error');
      return;
    }
    const name = customName.trim() || customEmail.split('@')[0];
    handleAccountSelect({
      name,
      email: customEmail.trim().toLowerCase(),
    });
  };

  // Launch live Google Cloud popup window
  const launchLiveGoogleCloudOAuth = () => {
    const clientId = googleClientId.trim();
    if (!clientId) {
      setShowConfigModal(true);
      return;
    }

    const redirectUri = window.location.origin;
    const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
      clientId
    )}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=token%20id_token&scope=${encodeURIComponent(
      'openid email profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile'
    )}&prompt=select_account&nonce=${Math.random().toString(36).substring(2)}`;

    const width = 520;
    const height = 640;
    const left = Math.max(0, (window.innerWidth - width) / 2 + window.screenX);
    const top = Math.max(0, (window.innerHeight - height) / 2 + window.screenY);

    const popup = window.open(
      oauthUrl,
      'GoogleAccountChooser',
      `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,resizable=yes`
    );

    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      showToast('Popup was blocked by your browser. Please allow popups.', 'error');
    }
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = tempClientId.trim();
    if (!cleanId) {
      showToast('Please provide a valid Google Client ID.', 'error');
      return;
    }
    setGoogleClientId(cleanId);
    localStorage.setItem('custom_google_client_id', cleanId);
    showToast('Google Cloud Console Client ID saved!', 'success');
    setShowConfigModal(false);
  };

  const handleRoleSelectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authenticatedUser) {
      navigate('/dashboard');
      return;
    }

    let finalRole = '';
    const preset = PRESET_ROLES.find((r) => r.id === selectedRoleId);

    if (selectedRoleId === 'custom') {
      if (!customRoleInput.trim()) {
        showToast('Please specify your custom role title.', 'error');
        return;
      }
      finalRole = customRoleInput.trim();
    } else if (preset) {
      finalRole = preset.defaultRole;
    } else {
      finalRole = 'Team Member';
    }

    let finalDept = selectedDepartment;
    if (selectedDepartment === 'Other / Custom' && customDeptInput.trim()) {
      finalDept = customDeptInput.trim();
    }

    try {
      setIsSavingRole(true);

      const res = await api.users.update({
        role: finalRole,
        department: finalDept,
      });

      if (res.success) {
        updateUser({
          role: finalRole,
          department: finalDept,
        });
        showToast(`Welcome! Role set to "${finalRole}".`, 'success');
        setShowRoleModal(false);
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.warn('Role update notice:', err.message);
      showToast('Entering dashboard...', 'info');
      setShowRoleModal(false);
      navigate('/dashboard');
    } finally {
      setIsSavingRole(false);
    }
  };

  return (
    <>
      <div className="w-full flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowChooserModal(true)}
          disabled={isLoading}
          className={`w-full py-3 px-4 bg-white/[0.08] hover:bg-white/[0.14] text-slate-100 border border-white/15 font-medium text-sm rounded-xl flex items-center justify-center gap-3 transition-all duration-150 active:scale-[0.99] shadow-sm disabled:opacity-60 cursor-pointer ${className}`}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 text-teal-300 animate-spin" />
          ) : (
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
          )}
          <span>{isLoading ? 'Signing In...' : text}</span>
        </button>

        {showConfigTrigger && (
          <button
            type="button"
            title="Google Cloud Console Setup & Settings"
            onClick={() => setShowConfigModal(true)}
            className="p-3 bg-white/[0.05] hover:bg-white/[0.12] text-slate-400 hover:text-teal-300 border border-white/10 rounded-xl transition-all cursor-pointer shrink-0"
          >
            <Settings className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* GOOGLE ACCOUNT CHOOSER (Pixel-Perfect Google Accounts Theme) */}
      {/* ========================================================================= */}
      {showChooserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-[480px] bg-[#1a1d24] border border-[#2d333f] rounded-3xl p-7 shadow-2xl text-slate-100 relative animate-scale-subtle overflow-hidden">
            {/* Ambient Background Lights */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Close */}
            <button
              type="button"
              onClick={() => setShowChooserModal(false)}
              className="absolute right-5 top-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Google G Brand Header */}
            <div className="flex items-center gap-2 mb-6">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
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
              <span className="text-sm font-medium text-slate-300">Sign in with Google</span>
            </div>

            {/* Product App Logo & Title */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-400 to-indigo-500 flex items-center justify-center text-slate-950 font-black text-lg shadow-md">
                  OC
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">Choose an account</h3>
                  <p className="text-xs text-slate-400">to continue to OfficeCompanion AI Workspace</p>
                </div>
              </div>
            </div>

            {/* Registered Google Accounts List */}
            <div className="space-y-2 mb-4">
              {[
                {
                  name: 'Mathan Prasath',
                  email: 'mathanprasath402@gmail.com',
                  role: 'Team Lead',
                  initials: 'MP',
                  color: 'bg-emerald-600',
                },
                {
                  name: 'Jasni Thangarasu',
                  email: 'thangarasujasni@gmail.com',
                  role: 'Product Manager',
                  initials: 'JT',
                  color: 'bg-amber-600',
                },
                {
                  name: 'mathan',
                  email: 'pheonixmathan@gmail.com',
                  role: 'Senior Engineer',
                  initials: 'M',
                  color: 'bg-teal-600',
                },
                {
                  name: 'Jacksparrow',
                  email: 'jacksparrowpheonix84@gmail.com',
                  role: 'Project Manager',
                  initials: 'JS',
                  color: 'bg-indigo-600',
                },
              ].map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleAccountSelect(acc)}
                  className="w-full p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 hover:border-teal-400/40 flex items-center justify-between text-left transition-all duration-150 group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-full ${acc.color} text-white font-bold text-xs flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform`}
                    >
                      {acc.initials}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white group-hover:text-teal-300 transition-colors">
                        {acc.name}
                      </div>
                      <div className="text-xs text-slate-400">{acc.email}</div>
                    </div>
                  </div>
                  <span className="text-[11px] px-2.5 py-1 rounded-full bg-white/10 text-slate-300 text-xs font-medium">
                    {acc.role}
                  </span>
                </button>
              ))}
            </div>

            {/* Custom Google Account Input */}
            <form onSubmit={handleCustomSubmit} className="pt-3 border-t border-white/10 space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-teal-400" />
                  Use another Google account:
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder="name@gmail.com or company email"
                    className="flex-1 px-3.5 py-2.5 bg-white/[0.05] border border-white/15 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-400"
                  />
                  <button
                    type="submit"
                    className="btn-grad px-4 py-2.5 rounded-xl font-bold text-xs cursor-pointer"
                  >
                    Sign In
                  </button>
                </div>
              </div>
            </form>

            {/* Bottom Actions: Google Cloud Console Setup & Live OAuth */}
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
              <button
                type="button"
                onClick={() => setShowConfigModal(true)}
                className="text-teal-400 hover:text-teal-300 flex items-center gap-1 cursor-pointer font-medium"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Google Console Setup &amp; Credentials</span>
              </button>

              <button
                type="button"
                onClick={launchLiveGoogleCloudOAuth}
                className="text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer font-medium"
              >
                <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                <span>Live OAuth Popup</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* GOOGLE CLOUD CONSOLE SETUP & SETTINGS MODAL */}
      {/* ========================================================================= */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="w-full max-w-2xl bg-[#131720] border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100 relative animate-scale-subtle overflow-hidden my-auto max-h-[90vh] overflow-y-auto">
            {/* Ambient Lighting */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowConfigModal(false)}
              className="absolute right-5 top-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Title Header */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-400 to-indigo-500 flex items-center justify-center text-slate-950 font-bold shadow-md">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">
                  Google Cloud Console Configuration
                </h3>
                <p className="text-xs text-slate-400">
                  Step-by-step setup guide &amp; OAuth 2.0 credentials manager
                </p>
              </div>
            </div>

            {/* Quick Steps Guide */}
            <div className="space-y-4 mb-6">
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-300">
                    Step 1: Google Cloud Console
                  </span>
                  <a
                    href="https://console.cloud.google.com/apis/credentials"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-teal-400 hover:text-teal-300 underline flex items-center gap-1 font-semibold"
                  >
                    Open Google Cloud Console <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Go to <strong className="text-white">APIs &amp; Services &gt; Credentials</strong> &gt; Click <strong className="text-teal-300">+ Create Credentials</strong> &gt; Select <strong className="text-white">OAuth client ID</strong> (Application type: <em>Web application</em>).
                </p>
              </div>

              {/* Step 2: Authorized Origins */}
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-300">
                    Step 2: Authorized JavaScript Origins
                  </span>
                  <span className="text-[11px] text-slate-400">Add both URLs in Google Console</span>
                </div>
                <p className="text-xs text-slate-400">
                  Under <em>"Authorized JavaScript origins"</em> in your OAuth client, add:
                </p>
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between px-3 py-2 bg-black/40 border border-white/15 rounded-xl font-mono text-xs text-teal-300">
                    <span>http://localhost:5173</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard('http://localhost:5173', 'Origin (5173)')}
                      className="p-1 hover:text-white transition-colors cursor-pointer"
                      title="Copy to clipboard"
                    >
                      {copiedField === 'Origin (5173)' ? (
                        <CheckCheck className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-between px-3 py-2 bg-black/40 border border-white/15 rounded-xl font-mono text-xs text-teal-300">
                    <span>http://localhost:5000</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard('http://localhost:5000', 'Origin (5000)')}
                      className="p-1 hover:text-white transition-colors cursor-pointer"
                      title="Copy to clipboard"
                    >
                      {copiedField === 'Origin (5000)' ? (
                        <CheckCheck className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Step 3: Authorized Redirect URIs */}
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-300">
                    Step 3: Authorized Redirect URIs
                  </span>
                  <span className="text-[11px] text-slate-400">Required for live popups &amp; redirects</span>
                </div>
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between px-3 py-2 bg-black/40 border border-white/15 rounded-xl font-mono text-xs text-indigo-300">
                    <span>http://localhost:5173</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard('http://localhost:5173', 'Redirect URI (5173)')}
                      className="p-1 hover:text-white transition-colors cursor-pointer"
                    >
                      {copiedField === 'Redirect URI (5173)' ? (
                        <CheckCheck className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-between px-3 py-2 bg-black/40 border border-white/15 rounded-xl font-mono text-xs text-indigo-300">
                    <span>http://localhost:5000/api/auth/google/callback</span>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          'http://localhost:5000/api/auth/google/callback',
                          'Backend Callback'
                        )
                      }
                      className="p-1 hover:text-white transition-colors cursor-pointer"
                    >
                      {copiedField === 'Backend Callback' ? (
                        <CheckCheck className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Step 4: Client ID Form */}
              <form onSubmit={handleSaveConfig} className="p-4 rounded-2xl bg-white/[0.06] border border-teal-500/30 space-y-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2 mb-1.5">
                    <Key className="w-3.5 h-3.5 text-teal-400" />
                    Step 4: Enter your OAuth 2.0 Client ID
                  </label>
                  <input
                    type="text"
                    required
                    value={tempClientId}
                    onChange={(e) => setTempClientId(e.target.value)}
                    placeholder="xxxxxxxxxxxx-xxxxxxxxxxxxxxxx.apps.googleusercontent.com"
                    className="w-full px-3.5 py-2.5 bg-black/50 border border-white/20 rounded-xl text-xs text-white font-mono placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400"
                  />
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    Saves directly to your browser and connects to your Google Cloud Console project.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTempClientId(DEFAULT_CLIENT_ID);
                      setGoogleClientId(DEFAULT_CLIENT_ID);
                      localStorage.removeItem('custom_google_client_id');
                      showToast('Reset to default configured Client ID', 'info');
                    }}
                    className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                  >
                    Reset to Default
                  </button>

                  <button
                    type="submit"
                    className="btn-grad px-5 py-2 rounded-xl font-bold text-xs cursor-pointer shadow-lg"
                  >
                    Save Client ID
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* "WHO ARE YOU?" ROLE & DEPARTMENT ONBOARDING MODAL */}
      {/* ========================================================================= */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-lg animate-fade-in overflow-y-auto">
          <div className="w-full max-w-2xl bg-[#0d121c] border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100 animate-scale-subtle relative overflow-hidden my-auto">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-fuchsia-500/15 rounded-full blur-3xl pointer-events-none" />

            {/* Header with Google User Info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10 relative z-10">
              <div className="flex items-center gap-3.5">
                <div className="relative">
                  <img
                    src={
                      authenticatedUser?.avatar ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                        authenticatedUser?.email || 'user'
                      )}`
                    }
                    alt={authenticatedUser?.name || 'User'}
                    className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 object-cover"
                  />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#0d121c] flex items-center justify-center text-[9px] font-bold text-white">
                    ✓
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
                      Google Account Connected
                    </span>
                    <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                    Welcome, {authenticatedUser?.name}! Who are you?
                  </h2>
                </div>
              </div>

              <div className="text-right hidden sm:block">
                <span className="text-xs text-slate-300 block font-mono">
                  {authenticatedUser?.email}
                </span>
                <span className="text-[11px] text-emerald-400 font-semibold">
                  Saved in MongoDB Database
                </span>
              </div>
            </div>

            {/* Role Onboarding Form */}
            <form onSubmit={handleRoleSelectionSubmit} className="space-y-6 pt-5 relative z-10">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-3">
                  Select your role in your company / organization:
                </label>

                {/* Role Grid Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PRESET_ROLES.map((role) => {
                    const Icon = role.icon;
                    const isSelected = selectedRoleId === role.id;

                    return (
                      <div
                        key={role.id}
                        onClick={() => {
                          setSelectedRoleId(role.id);
                          if (role.defaultDept) {
                            setSelectedDepartment(role.defaultDept);
                          }
                        }}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group ${
                          isSelected
                            ? 'bg-teal-500/15 border-teal-400 shadow-lg shadow-teal-500/10 ring-1 ring-teal-400/50'
                            : 'bg-white/[0.04] border-white/10 hover:bg-white/[0.08] hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`p-2 rounded-xl transition-colors ${
                                isSelected
                                  ? 'bg-teal-400 text-slate-950 font-bold'
                                  : 'bg-white/10 text-slate-300 group-hover:text-white'
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-white">{role.title}</h4>
                              <span className="text-[10px] text-slate-400 font-medium">
                                {role.badge}
                              </span>
                            </div>
                          </div>

                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                              isSelected
                                ? 'bg-teal-400 border-teal-400 text-slate-950'
                                : 'border-white/30 text-transparent'
                            }`}
                          >
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed mt-1">
                          {role.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Custom Role Input if 'custom' is selected */}
              {selectedRoleId === 'custom' && (
                <div className="p-4 rounded-2xl bg-white/[0.05] border border-teal-400/40 animate-fade-in space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-teal-300 flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5" />
                    Specify Custom Title / Designation:
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={customRoleInput}
                    onChange={(e) => setCustomRoleInput(e.target.value)}
                    placeholder="e.g. AI Research Lead, UI/UX Architect, Director of Operations..."
                    className="w-full px-4 py-3 bg-black/40 border border-white/20 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition"
                  />
                </div>
              )}

              {/* Department Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-teal-400" />
                  Primary Department / Workgroup:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {DEPARTMENTS.map((dept) => (
                    <button
                      key={dept}
                      type="button"
                      onClick={() => setSelectedDepartment(dept)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium border text-left truncate transition-all cursor-pointer ${
                        selectedDepartment === dept
                          ? 'bg-teal-400 text-slate-950 border-teal-400 font-bold shadow-sm'
                          : 'bg-white/[0.04] text-slate-300 border-white/10 hover:bg-white/[0.08]'
                      }`}
                    >
                      {dept}
                    </button>
                  ))}
                </div>

                {selectedDepartment === 'Other / Custom' && (
                  <input
                    type="text"
                    required
                    value={customDeptInput}
                    onChange={(e) => setCustomDeptInput(e.target.value)}
                    placeholder="Type custom department name..."
                    className="w-full mt-2 px-3.5 py-2.5 bg-black/40 border border-white/20 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-400"
                  />
                )}
              </div>

              {/* Action Submit */}
              <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Profile and role will be saved to your MongoDB database</span>
                </div>

                <button
                  type="submit"
                  disabled={isSavingRole}
                  className="btn-grad w-full sm:w-auto px-7 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-70"
                >
                  {isSavingRole ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Saving to MongoDB...</span>
                    </>
                  ) : (
                    <>
                      <span>Enter Workspace Dashboard</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
