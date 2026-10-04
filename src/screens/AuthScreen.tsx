import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Shield, Lock, Mail, Eye, EyeOff, ArrowRight, FolderLock, FileCheck, Bell, Loader2 } from 'lucide-react';

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}

function MicrosoftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path fill="#F25022" d="M3 3h8.5v8.5H3z" />
      <path fill="#7FBA00" d="M12.5 3H21v8.5h-8.5z" />
      <path fill="#00A4EF" d="M3 12.5h8.5V21H3z" />
      <path fill="#FFB900" d="M12.5 12.5H21V21h-8.5z" />
    </svg>
  );
}

export default function AuthScreen() {
  const { signIn, signUp, signInWithGoogle, signInWithMicrosoft } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'microsoft' | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const fn = mode === 'signin' ? signIn : signUp;
    const { error } = await fn(email, password);

    if (error) {
      setError(error);
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setOauthLoading('google');
    const { error } = await signInWithGoogle();
    if (error) {
      setError(formatOAuthError(error));
      setOauthLoading(null);
    }
  };

  const handleMicrosoft = async () => {
    setError(null);
    setOauthLoading('microsoft');
    const { error } = await signInWithMicrosoft();
    if (error) {
      setError(formatOAuthError(error));
      setOauthLoading(null);
    }
  };

  const switchMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50">
      {/* Left panel — branding */}
      <div className="lg:w-1/2 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 text-white p-8 lg:p-12 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -ml-32 -mb-32" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-11 h-11 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <FolderLock className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-semibold tracking-tight">DocVault</span>
          </div>

          <h1 className="text-3xl lg:text-4xl font-bold leading-tight mb-4">
            Your documents,<br />securely in one place
          </h1>
          <p className="text-slate-300 text-lg leading-relaxed max-w-md">
            A personal digital locker built for students. Store, organize, and share your
            important documents — never lose track of a certificate or miss a deadline again.
          </p>
        </div>

        <div className="relative z-10 space-y-4 mt-12">
          <FeatureRow icon={<FileCheck className="w-5 h-5" />} title="Smart organization" desc="Categories, tags, and powerful search" />
          <FeatureRow icon={<Shield className="w-5 h-5" />} title="Bank-grade security" desc="Encrypted storage with controlled sharing" />
          <FeatureRow icon={<Bell className="w-5 h-5" />} title="Never miss a deadline" desc="Reminders for renewals and applications" />
        </div>
      </div>

      {/* Right panel — form */}
      <div className="lg:w-1/2 flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-md">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              {mode === 'signin' ? 'Welcome back' : 'Create your locker'}
            </h2>
            <p className="text-slate-500">
              {mode === 'signin'
                ? 'Sign in to access your documents'
                : 'Start organizing your documents in minutes'}
            </p>
          </div>

          {/* Social login buttons */}
          <div className="space-y-3 mb-5">
            <button
              onClick={handleGoogle}
              disabled={oauthLoading !== null || loading}
              className="w-full flex items-center justify-center gap-3 py-3 bg-white border border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-60"
            >
              {oauthLoading === 'google' ? (
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              ) : (
                <GoogleIcon />
              )}
              Continue with Google
            </button>

            <button
              onClick={handleMicrosoft}
              disabled={oauthLoading !== null || loading}
              className="w-full flex items-center justify-center gap-3 py-3 bg-white border border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-60"
            >
              {oauthLoading === 'microsoft' ? (
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              ) : (
                <MicrosoftIcon />
              )}
              Continue with Microsoft
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-5">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">or</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Email + password form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="you@college.edu"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-11 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="At least 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || oauthLoading !== null}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg shadow-blue-500/25"
            >
              {loading ? 'Please wait…' : (
                <>
                  {mode === 'signin' ? 'Sign in' : 'Create account'}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-slate-500 text-sm mt-6">
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={switchMode}
              className="text-blue-600 font-semibold hover:underline"
            >
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function formatOAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('popup') && lower.includes('closed')) return 'Sign-in window was closed before completing. Please try again.';
  if (lower.includes('denied') || lower.includes('access_denied')) return 'Access was denied. Please allow the requested permissions and try again.';
  if (lower.includes('network') || lower.includes('fetch')) return 'Network error — please check your internet connection and try again.';
  if (lower.includes('provider') && lower.includes('not enabled')) return 'This sign-in provider is not enabled yet. Please contact the administrator.';
  return message;
}

function FeatureRow({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="font-semibold text-white">{title}</p>
        <p className="text-sm text-slate-400">{desc}</p>
      </div>
    </div>
  );
}
