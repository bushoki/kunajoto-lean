import React, { useState } from 'react';
import { authService } from '../../services/authService';
import { supabase } from '../../src/supabaseClient';

interface AuthRequiredProps {
  onAuthSuccess: () => void;
}

const AuthRequired: React.FC<AuthRequiredProps> = ({ onAuthSuccess }) => {
  // Default to login if user has logged in before (better UX after logout)
  const hasLoggedInBefore = localStorage.getItem('kunajoto_has_onboarded') === 'true';
  const [isLogin, setIsLogin] = useState(hasLoggedInBefore);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true); // Default to true

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

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
        // Better error messages
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
        // Handle case where email confirmation is required
        if (result.user?.identities?.length === 0) {
          setErrorMsg("This email is already registered. Please sign in instead.");
        } else {
          setSuccessMsg("Account created! Please check your email to confirm.");
        }
      } else {
        // Success - call parent callback
        onAuthSuccess();
      }
    } catch (e: any) {
      setErrorMsg(e.message || "Authentication failed");
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
        redirectTo: `${window.location.origin}/?reset=true`,
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

  // ── Forgot Password View ──
  if (showForgotPassword) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-primary via-primary-dark to-primary-darker">
        <div className="w-full max-w-md mx-4">
          {/* Logo Section */}
          <div className="text-center mb-8 animate-in fade-in zoom-in-95 duration-700">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner border border-white/30">
              <i className="fa-solid fa-lock-open text-4xl text-white drop-shadow-md"></i>
            </div>
            <h1 className="text-3xl font-black tracking-wider text-white uppercase drop-shadow-sm">
              Kunajoto
            </h1>
            <p className="text-white/90 font-medium tracking-wide text-sm uppercase mt-1">
              Password Recovery
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-500">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Reset Password</h2>
              <p className="text-gray-500 text-sm mt-1">
                Enter your email and we'll send you a reset link.
              </p>
            </div>

            {errorMsg && (
              <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg mb-4 font-medium border border-red-100 flex items-center gap-2">
                <i className="fa-solid fa-circle-exclamation"></i>
                <span>{errorMsg}</span>
              </div>
            )}

            {forgotSuccess ? (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fa-solid fa-envelope-circle-check text-3xl text-green-500"></i>
                </div>
                <p className="text-gray-700 font-medium mb-1">Check your inbox!</p>
                <p className="text-gray-500 text-sm mb-6">
                  We sent a reset link to <strong>{forgotEmail}</strong>
                </p>
                <button
                  onClick={() => { setShowForgotPassword(false); setForgotSuccess(false); setErrorMsg(null); }}
                  className="text-primary font-semibold hover:underline text-sm"
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                    placeholder="you@example.com"
                  />
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {forgotLoading ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <span>Send Reset Link</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForgotPassword(false); setErrorMsg(null); }}
                  className="w-full text-gray-500 hover:text-gray-700 text-sm font-medium py-2"
                >
                  Back to Sign In
                </button>
              </form>
            )}
          </div>

          <p className="text-center text-white/70 text-xs mt-6">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-primary via-primary-dark to-primary-darker">
      <div className="w-full max-w-md mx-4">
        {/* Logo Section */}
        <div className="text-center mb-8 animate-in fade-in zoom-in-95 duration-700">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner border border-white/30">
            <i className="fa-solid fa-location-dot text-4xl text-white drop-shadow-md"></i>
          </div>
          <h1 className="text-3xl font-black tracking-wider text-white uppercase drop-shadow-sm">
            Kunajoto
          </h1>
          <p className="text-white/90 font-medium tracking-wide text-sm uppercase mt-1">
            Your Nightlife Vibe Forecast
          </p>
        </div>

        {/* Auth Form */}
        <div className="bg-white rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-500">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {isLogin ? 'Welcome Back' : 'Get Started'}
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              {isLogin ? 'Sign in to continue exploring' : 'Create an account to unlock features'}
            </p>
          </div>

          {errorMsg && (
            <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg mb-4 font-medium border border-red-100 flex items-center gap-2">
              <i className="fa-solid fa-circle-exclamation"></i>
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-green-50 text-green-600 text-xs p-3 rounded-lg mb-4 font-medium border border-green-100 flex items-center gap-2">
              <i className="fa-solid fa-circle-check"></i>
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                    placeholder="Doe"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
              {!isLogin && (
                <p className="text-[10px] text-gray-400 mt-1">Minimum 6 characters</p>
              )}
            </div>

            {isLogin && (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2"
                  />
                  <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-600">
                    Remember me
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
              className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  <span>Processing...</span>
                </>
              ) : (
                <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="text-primary font-semibold hover:underline"
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-white/70 text-xs mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default AuthRequired;
