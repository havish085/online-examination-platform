import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, LogIn, Chrome, AlertCircle } from 'lucide-react';
import { LoadingSpinner } from '../components/UI/LoadingSpinner';

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

  const onSubmit = async (data: any) => {
    setError(null);
    setLoading(true);
    try {
      await login(data.email, data.password);
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Invalid email or password.');
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
      setError(err.message || 'Google Sign-In failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950 transition-colors duration-200">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-slate-100 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-lg shadow-primary-500/20 mb-4">
            <span className="font-bold text-2xl">E</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Welcome Back
          </h1>
          <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
            Sign in to access your examinations and reports
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-3 rounded-2xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/20 dark:text-red-400">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Mail className="h-5 w-5 text-slate-400" />
              </span>
              <input
                type="email"
                placeholder="you@example.com"
                {...register('email', { 
                  required: 'Email is required',
                  pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' }
                })}
                className={`w-full rounded-2xl border bg-slate-50/50 py-3 pl-10 pr-4 text-sm outline-none transition-all dark:bg-slate-800/40
                  ${errors.email 
                    ? 'border-red-500 focus:ring-1 focus:ring-red-500' 
                    : 'border-slate-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:focus:border-primary-500'
                  }
                `}
              />
            </div>
            {errors.email && (
              <span className="text-xs text-red-500 mt-1 block">{errors.email.message}</span>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Password
              </label>
              <Link 
                to="/forgot-password" 
                className="text-xs font-medium text-primary-600 hover:underline dark:text-primary-400"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Lock className="h-5 w-5 text-slate-400" />
              </span>
              <input
                type="password"
                placeholder="••••••••"
                {...register('password', { 
                  required: 'Password is required',
                  minLength: { value: 6, message: 'Minimum 6 characters' }
                })}
                className={`w-full rounded-2xl border bg-slate-50/50 py-3 pl-10 pr-4 text-sm outline-none transition-all dark:bg-slate-800/40
                  ${errors.password 
                    ? 'border-red-500 focus:ring-1 focus:ring-red-500' 
                    : 'border-slate-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:focus:border-primary-500'
                  }
                `}
              />
            </div>
            {errors.password && (
              <span className="text-xs text-red-500 mt-1 block">{errors.password.message}</span>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary-600 py-3 font-semibold text-white transition-all hover:bg-primary-500 active:scale-95 disabled:opacity-50 shadow-lg shadow-primary-500/20"
          >
            {loading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <LogIn className="h-5 w-5" />
                Sign In
              </>
            )}
          </button>
        </form>

        <div className="relative flex items-center justify-center my-4">
          <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
          <span className="absolute bg-white px-3 text-xs text-slate-400 dark:bg-slate-900">Or continue with</span>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading || googleLoading}
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3 font-medium text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/60"
        >
          {googleLoading ? (
            <LoadingSpinner size="sm" />
          ) : (
            <>
              <Chrome className="h-5 w-5 text-slate-500 dark:text-slate-400" />
              Sign in with Google
            </>
          )}
        </button>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          Don't have an account?{' '}
          <Link 
            to="/register" 
            className="font-semibold text-primary-600 hover:underline dark:text-primary-400"
          >
            Register Now
          </Link>
        </p>
      </div>
    </div>
  );
};
