import React, { useState } from 'react';
import { X, Mail, Key, Eye, EyeOff, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignIn: (email: string, pass: string) => Promise<any>;
  onSignUp: (email: string, pass: string) => Promise<any>;
}

export default function AuthModal({ isOpen, onClose, onSignIn, onSignUp }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      if (isSignUp) {
        const res = await onSignUp(email, password);
        if (res.error) {
          setError(res.error.message);
        } else {
          setSuccess('🎉 Registration successful! Check your email or try signing in.');
          // Switch to sign in after a brief moment or reset form
          setPassword('');
          setConfirmPassword('');
        }
      } else {
        const res = await onSignIn(email, password);
        if (res.error) {
          setError(res.error.message);
        } else {
          onClose();
        }
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred during authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div 
        className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-100 p-8"
        id="auth-modal-container"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          id="auth-close-btn"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Brand Headings */}
        <div className="text-center mb-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-100">
            <span className="font-sans text-xl font-bold">JP</span>
          </div>
          <h1 className="mt-4 font-sans text-xl font-bold tracking-tight text-slate-900 uppercase">
            {isSignUp ? 'Create Tracker Account' : 'Welcome to JobPulse'}
          </h1>
          <p className="mt-1.5 text-xs text-slate-500">
            {isSignUp 
              ? 'Securely register to isolate your application records.' 
              : 'Sign in to access your private, robust job hunt tracking engine.'}
          </p>
        </div>

        {/* Error / Success Feedback */}
        {error && (
          <div className="mb-4 flex items-start space-x-2 rounded-xl bg-rose-50 border border-rose-100 p-3 text-xs text-rose-700 animate-pulse">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 flex items-start space-x-2 rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-xs text-emerald-700">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
            <span>{success}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2.5 pl-9 pr-3 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                required
                id="auth-email-input"
              />
              <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2.5 pl-9 pr-10 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                required
                id="auth-password-input"
              />
              <Key className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-900"
                id="auth-password-toggle"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {isSignUp && (
            <div className="space-y-1 animate-fadeIn">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Verify password"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2.5 pl-9 pr-3 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                  id="auth-confirm-password-input"
                />
                <Key className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center space-x-1.5 rounded-lg bg-indigo-600 py-3 text-xs font-bold text-white hover:bg-indigo-700 transition-colors cursor-pointer shadow-sm disabled:opacity-50 mt-2"
            id="auth-submit-button"
          >
            {isLoading ? (
              <span className="flex items-center space-x-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Processing...</span>
              </span>
            ) : (
              <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
            )}
          </button>
        </form>

        {/* Toggle Switch */}
        <div className="mt-5 text-center">
          <p className="text-xs text-slate-500">
            {isSignUp ? 'Already have an account?' : "Don't have an account yet?"}{' '}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setSuccess(null);
              }}
              className="font-bold text-indigo-600 hover:underline"
              id="auth-toggle-btn"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
