import React, { useState, useEffect } from 'react';
import { authService } from '../../services/authService';
import { supabase } from '../../src/supabaseClient';

interface AuthModalProps {
  onAuthSuccess: (isNewSignup?: boolean) => void;
  onCancel: () => void;
  defaultMode?: 'login' | 'signup';
}

const AuthModal: React.FC<AuthModalProps> = ({ onAuthSuccess, onCancel, defaultMode = 'signup' }) => {
  const [isLogin, setIsLogin] = useState(defaultMode === 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasLocalPrefs, setHasLocalPrefs] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  useEffect(() => {
    const prefs = localStorage.getItem('kunajoto_user_prefs');
    if (prefs) setHasLocalPrefs(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      let result;
      if (isLogin) {
        result = await authService.signIn(email, password);
      } else {
        result = await authService.signUp(email, password, {
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`.trim()
        });
      }
      if (result.error) {
        if (result.error.message?.includes('Invalid login credentials')) {
          setErrorMsg('Invalid email or password. Please try again.');
        } else if (result.error.message?.includes('Email not confirmed')) {
          setErrorMsg('Please confirm your email before signing in.');
        } else if (result.error.message?.includes('User already registered')) {
          setErrorMsg('This email is already registered. Please sign in instead.');
        } else {
          setErrorMsg(result.error.message || 'Authentication failed');
        }
      } else if (!isLogin && !result.user?.confirmed_at && !result.user?.email_confirmed_at) {
        if (result.user?.identities?.length === 0) {
          setErrorMsg('This email is already registered. Please sign in instead.');
        } else {
          setSuccessMsg('Account created! Please check your email to confirm.');
        }
      } else {
        onAuthSuccess(!isLogin);
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setErrorMsg(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: window.location.origin + '/?reset=true',
      });
      if (error) {
        setErrorMsg(error.message);
      } else {
        setForgotSuccess(true);
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to send reset email');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full sm:w-[400px] rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-300 overflow-hidden relative">

        {/* Persona Sync Banner */}
        {hasLocalPrefs && !showForgotPassword && (
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-6 py-2 text-xs font-bold flex items-center justify-center gap-2 shadow-md">
            <i className="fa-solid fa-wand-magic-sparkles"></i>
            <span>Persona Detected: Sign in to sync settings</span>
          </div>
        )}

        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 sm:hidden mt-4"></div>

        {/* ── Forgot Password View ── */}
        {showForgotPassword ? (
          <div className={hasLocalPrefs ? 'mt-6' : ''}>
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="fa-solid fa-lock-open text-2xl text-primary"></i>
              </div>
              <h2 className="text-2xl font-bold text-dark">Reset Password</h2>
              <p className="text-gray-500 text-sm mt-1">
                Enter your email and we'll send you a reset link.
              </p>
            </div>

            {errorMsg && (
              <div className="bg-red-50 text-red-500 text-xs p-3 rounded-lg mb-4 font-medium border border-red-100 flex items-center gap-2">
                <i className="fa-solid fa-circle-exclamation"></i>
                {errorMsg}
              </div>
            )}

            {forgotSuccess ? (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fa-solid fa-envelope-circle-check text-3xl text-green-500"></i>
                </div>
                <p className="text-green-700 font-semibold text-sm mb-1">Reset link sent!</p>
                <p className="text-gray-500 text-xs mb-6">
                  Check your inbox at <strong>{forgotEmail}</strong> for a password reset link.
                </p>
                <button
                  onClick={() => { setShowForgotPassword(false); setForgotSuccess(false); setErrorMsg(null); }}
                  className="w-full bg-primary text-white font-bold py-3 rounded-xl"
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-dark focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                    placeholder="you@example.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="mt-2 w-full bg-primary hover:bg-primary-hover text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary/25 transition disabled:opacity-70 flex justify-center items-center gap-2"
                >
                  {forgotLoading ? (
                    <i className="fa-solid fa-circle-notch fa-spin"></i>
                  ) : (
                    <>
                      <i className="fa-solid fa-paper-plane"></i>
                      Send Reset Link
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForgotPassword(false); setErrorMsg(null); }}
                  className="text-sm text-gray-500 hover:text-gray-700 text-center"
                >
                  ← Back to Sign In
                </button>
              </form>
            )}
          </div>
        ) : (
          /* ── Login / Signup View ── */
          <>
            <div className={`text-center mb-6 ${hasLocalPrefs ? 'mt-6' : ''}`}>
              <h2 className="text-2xl font-bold text-dark">{isLogin ? 'Welcome Back' : 'Join Kunajoto'}</h2>
              <p className="text-gray-500 text-sm mt-1">
                {isLogin ? 'Sign in to access your saved vibes.' : 'Create an account to unlock forecasts.'}
              </p>
            </div>

            {errorMsg && (
              <div className="bg-red-50 text-red-500 text-xs p-3 rounded-lg mb-4 font-medium border border-red-100 flex items-center gap-2">
                <i className="fa-solid fa-circle-exclamation"></i>
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="bg-green-50 text-green-600 text-xs p-3 rounded-lg mb-4 font-medium border border-green-100 flex items-center gap-2">
                <i className="fa-solid fa-envelope-circle-check"></i>
                {successMsg}
              </div>
            )}

            {!successMsg && (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {!isLogin && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">First Name</label>
                      <input
                        type="text"
                        required={!isLogin}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-dark focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                        placeholder="John"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Last Name</label>
                      <input
                        type="text"
                        required={!isLogin}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-dark focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                        placeholder="Doe"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Email</label>
                  <input
                    type="email"
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-dark focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-12 text-dark focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                    >
                      <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                </div>

                {isLogin && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="rememberMe"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 text-primary bg-gray-50 border-gray-300 rounded focus:ring-primary/20"
                      />
                      <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-600">
                        Remember Me
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setShowForgotPassword(true); setForgotEmail(email); setErrorMsg(null); }}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 w-full bg-primary hover:bg-primary-hover text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary/25 transition disabled:opacity-70 flex justify-center items-center"
                >
                  {loading ? (
                    <i className="fa-solid fa-circle-notch fa-spin"></i>
                  ) : (
                    isLogin ? 'Sign In' : 'Create Account'
                  )}
                </button>
              </form>
            )}

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                <button
                  onClick={() => { setIsLogin(!isLogin); setErrorMsg(null); setSuccessMsg(null); }}
                  className="text-primary font-semibold hover:underline"
                >
                  {isLogin ? 'Sign Up' : 'Log In'}
                </button>
              </p>
            </div>
          </>
        )}

        <button onClick={onCancel} className={`absolute right-4 text-gray-400 hover:text-gray-600 ${hasLocalPrefs ? 'top-10' : 'top-4'}`}>
          <i className="fa-solid fa-xmark text-xl"></i>
        </button>
      </div>
    </div>
  );
};

export default AuthModal;
