import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, LogIn, Chrome, AlertCircle, Sparkles, ShieldCheck } from 'lucide-react';
import { LoadingSpinner } from '../components/UI/LoadingSpinner';
import { ThreeDBackground } from '../components/UI/ThreeDBackground';
import { ThreeDCard } from '../components/UI/ThreeDCard';

export const Login: React.FC = () => {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const getFirebaseErrorMessage = (err: any) => {
    const code = err?.code || '';
    switch (code) {
      case 'auth/unauthorized-domain':
        return 'This domain is not authorized in Firebase. Please add your website domain in Firebase Console -> Authentication -> Settings -> Authorized Domains.';
      case 'auth/operation-not-allowed':
        return 'Google Sign-In is not enabled. Please enable Google provider in Firebase Console -> Authentication -> Sign-in method.';
      case 'auth/popup-closed-by-user':
        return 'Google login popup was closed before completing authentication. Please try again.';
      case 'auth/popup-blocked':
        return 'Google login popup was blocked by your browser. Please allow popups for this site.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Invalid email or password.';
      default:
        return err?.message || 'Authentication failed. Please try again.';
    }
  };

  const onSubmit = async (data: any) => {
    setError(null);
    setLoading(true);
    try {
      await login(data.email, data.password);
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(getFirebaseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(getFirebaseErrorMessage(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-12 transition-colors duration-200">
      {/* Interactive 3D Particle & Wireframe Cube WebGL Canvas */}
      <ThreeDBackground />

      {/* Floating 3D Glowing Ambient Accents */}
      <div className="pointer-events-none absolute -left-20 -top-20 h-96 w-96 rounded-full bg-primary-600/20 blur-[120px] animate-pulse" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-purple-600/20 blur-[120px] animate-pulse" />

      {/* Main 3D Tilt Card */}
      <ThreeDCard className="w-full max-w-md" intensity={12}>
        <div className="relative z-10 space-y-6 rounded-3xl border border-white/10 bg-slate-900/80 p-8 backdrop-blur-xl shadow-2xl shadow-primary-950/50">
          
          {/* Header & Logo */}
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-500 text-white shadow-lg shadow-primary-500/30 transform transition-transform hover:rotate-6">
              <span className="text-2xl font-black">E</span>
              <Sparkles className="absolute -right-1.5 -top-1.5 h-4 w-4 text-amber-300 animate-bounce" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
              Welcome Back
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Proctored Examination & Assessment Workspace
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-xs text-red-300 backdrop-blur-sm animate-shake">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-400 mt-0.5" />
              <p className="font-medium leading-relaxed">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-4 w-4 text-slate-400" />
                </span>
                <input
                  type="email"
                  placeholder="you@example.com"
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' }
                  })}
                  className={`w-full rounded-2xl border bg-slate-800/50 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-all
                    ${errors.email 
                      ? 'border-red-500 focus:ring-1 focus:ring-red-500' 
                      : 'border-white/10 focus:border-primary-500 focus:ring-1 focus:ring-primary-500'
                    }
                  `}
                />
              </div>
              {errors.email && (
                <span className="text-xs text-red-400 mt-1 block">{errors.email.message}</span>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Password
                </label>
                <Link 
                  to="/forgot-password" 
                  className="text-xs font-medium text-primary-400 hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-4 w-4 text-slate-400" />
                </span>
                <input
                  type="password"
                  placeholder="••••••••"
                  {...register('password', { 
                    required: 'Password is required',
                    minLength: { value: 6, message: 'Minimum 6 characters' }
                  })}
                  className={`w-full rounded-2xl border bg-slate-800/50 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-all
                    ${errors.password 
                      ? 'border-red-500 focus:ring-1 focus:ring-red-500' 
                      : 'border-white/10 focus:border-primary-500 focus:ring-1 focus:ring-primary-500'
                    }
                  `}
                />
              </div>
              {errors.password && (
                <span className="text-xs text-red-400 mt-1 block">{errors.password.message}</span>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-primary-600 to-indigo-600 py-3 font-semibold text-white transition-all hover:from-primary-500 hover:to-indigo-500 active:scale-95 disabled:opacity-50 shadow-lg shadow-primary-600/30"
            >
              {loading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <LogIn className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  Sign In
                </>
              )}
            </button>
          </form>

          <div className="relative flex items-center justify-center my-4">
            <div className="w-full border-t border-white/10"></div>
            <span className="absolute bg-slate-900 px-3 text-xs text-slate-400">Or continue with</span>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading || googleLoading}
            type="button"
            className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-white/10 bg-slate-800/40 py-3 font-medium text-slate-200 transition-all hover:bg-slate-800/80 hover:border-white/20 active:scale-95"
          >
            {googleLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <Chrome className="h-4 w-4 text-primary-400" />
                Sign in with Google
              </>
            )}
          </button>

          <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs text-slate-400">
            <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> AI Proctoring Secured</span>
            <Link 
              to="/register" 
              className="font-semibold text-primary-400 hover:underline"
            >
              Register Account →
            </Link>
          </div>

        </div>
      </ThreeDCard>
    </div>
  );
};
