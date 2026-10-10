import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Loader2,
  Mail,
  Lock,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { GoogleSignInButton } from '../components/auth/GoogleSignInButton';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login, isAuthenticated, isLoading } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // If already authenticated, redirect straight to dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Dynamic Password Strength Meter Calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: 'Empty' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) || /[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass) || pass.length >= 12) score += 1;

    const labels = ['Empty', 'Weak', 'Fair', 'Decent', 'Strong'];
    return { score, label: labels[score] };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please provide both your work email and password.');
      return;
    }

    try {
      setIsSubmitting(true);
      await login({ email: email.trim().toLowerCase(), password });
      showToast('Welcome back to OfficeCompanion!', 'success');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#0b0f14] text-slate-100 selection:bg-teal-500/30 selection:text-teal-200 overflow-x-hidden font-sans">
      {/* ====================================================
          BACKGROUND AURORA & FILM GRAIN LAYERS
          ==================================================== */}
      <div className="aurora-bg">
        <div className="aurora-layer" />
      </div>
      <div className="grain-layer" />

      {/* ====================================================
          STICKY TRANSLUCENT GLASS NAVIGATION
          ==================================================== */}
      <header className="fixed top-0 inset-x-0 z-50 glass-nav">
        <div className="mx-auto max-w-6xl px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Lockup */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl btn-grad flex items-center justify-center text-[#0b0f14] shadow-md group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 fill-current" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight text-white">
              OfficeCompanion
            </span>
          </Link>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-5">
            <Link
              to="/signup"
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Sign up
            </Link>
            <Link
              to="/signup"
              className="chip rounded-full px-4 py-1.5 text-xs font-semibold text-white hover:bg-white/10 transition-all flex items-center gap-1.5"
            >
              <span>Get started</span>
              <ArrowRight className="w-3.5 h-3.5 text-teal-300" />
            </Link>
          </div>
        </div>
      </header>

      {/* ====================================================
          HERO AUTH SECTION (2-COLUMN GRID)
          ==================================================== */}
      <main className="relative z-10 min-h-screen pt-24 pb-12 px-6 flex items-center">
        <div className="mx-auto w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-14 items-center">
          
          {/* --------------------------------------------------
              LEFT COLUMN: CLEAN MARKETING PITCH
              -------------------------------------------------- */}
          <div className="max-w-lg mx-auto lg:mx-0 text-center lg:text-left">
            {/* Display Headline */}
            <h1 className="font-display font-bold text-white text-[2.75rem] leading-[1.06] sm:text-5xl lg:text-[3.5rem] tracking-tight">
              Work at the <br />
              <span className="grad-text">speed of thought.</span>
            </h1>

            {/* Lead Value Paragraph */}
            <p className="mt-5 text-slate-400 text-base sm:text-lg leading-relaxed">
              Turn daily chaos into synchronized productivity. Join teams
              orchestrating meetings, tasks, and follow-ups on an AI-native canvas.
            </p>

            {/* Benefit Check List */}
            <div className="mt-8 space-y-3.5 text-left inline-block">
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <CheckCircle2 className="w-4.5 h-4.5 text-teal-400 shrink-0" />
                <span>Autonomous meeting intelligence & real-time action items</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <CheckCircle2 className="w-4.5 h-4.5 text-teal-400 shrink-0" />
                <span>Context-aware daily planner & smart follow-up triggers</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <CheckCircle2 className="w-4.5 h-4.5 text-teal-400 shrink-0" />
                <span>Deep workspace memory driving your tasks seamlessly</span>
              </div>
            </div>
          </div>

          {/* --------------------------------------------------
              RIGHT COLUMN: FROSTED GLASS AUTH CARD
              -------------------------------------------------- */}
          <div className="w-full max-w-md mx-auto">
            <div className="card-glow glass glass-sheen rounded-3xl p-7 sm:p-9 shadow-2xl">
              {/* Card Header */}
              <div className="mb-6 text-center">
                <h2 className="font-display font-bold text-2xl sm:text-[1.7rem] text-white tracking-tight">
                  Welcome back
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Sign in to access your OfficeCompanion workspace.
                </p>
              </div>

              {/* Primary Google Social Login */}
              <div className="mb-5">
                <GoogleSignInButton
                  text="Continue with Google"
                  className="!h-12 !rounded-xl !text-sm !font-semibold"
                />
              </div>

              {/* 'OR WITH EMAIL' Divider */}
              <div className="my-5 flex items-center gap-4">
                <div className="flex-1 h-[1px] bg-white/10" />
                <span className="text-[10px] tracking-[0.2em] uppercase font-semibold text-slate-500">
                  OR WITH EMAIL
                </span>
                <div className="flex-1 h-[1px] bg-white/10" />
              </div>

              {/* Error Alert */}
              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-xs text-red-200 animate-fade-in flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Form Fields */}
              <form onSubmit={handleSubmit} className="space-y-3.5">
                {/* Email Field */}
                <div className="field-wrap relative">
                  <Mail className="field-icon absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 transition-colors pointer-events-none" />
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="field w-full rounded-xl h-12 pl-11 pr-4 text-sm"
                  />
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <div className="field-wrap relative">
                    <Lock className="field-icon absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 transition-colors pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="field w-full rounded-xl h-12 pl-11 pr-14 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-teal-400 hover:text-fuchsia-400 transition-colors cursor-pointer px-1 py-1"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>

                  {/* Password Strength Meter */}
                  {password && (
                    <div className="flex items-center gap-2 px-1 pt-1 animate-fade-in">
                      <div className="flex items-center gap-1.5 flex-1">
                        {[1, 2, 3, 4].map((step) => (
                          <div
                            key={step}
                            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                              strength.score >= step
                                ? 'bg-gradient-to-r from-teal-400 to-cyan-300 shadow-[0_0_8px_rgba(45,212,191,0.6)]'
                                : 'bg-white/10'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[11px] font-medium text-slate-400 w-12 text-right">
                        {strength.label}
                      </span>
                    </div>
                  )}
                </div>

                {/* Submit Primary CTA */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-grad w-full rounded-xl h-12 font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 mt-3"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#0b0f14]" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign in to workspace</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </>
                  )}
                </button>
              </form>

              {/* Terms Footnote */}
              <p className="mt-5 text-center text-[11px] text-slate-500 leading-relaxed">
                By signing in you agree to our{' '}
                <a href="#terms" className="text-slate-400 underline hover:text-teal-300 transition-colors">
                  Terms
                </a>{' '}
                and{' '}
                <a href="#privacy" className="text-slate-400 underline hover:text-teal-300 transition-colors">
                  Privacy Policy
                </a>.
              </p>
            </div>

            {/* Below Card Switch to Sign up */}
            <div className="mt-6 text-center text-sm text-slate-400">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="font-semibold grad-text hover:brightness-125 transition-all"
              >
                Create account
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
