import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';
import { LoadingSpinner } from '../components/UI/LoadingSpinner';

export const ForgotPassword: React.FC = () => {
  const { resetPassword } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      email: ''
    }
  });

  const onSubmit = async (data: any) => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await resetPassword(data.email);
      setSuccess('A password reset link has been sent to your email.');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to send password reset email.');
    } finally {
      setLoading(false);
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
            Reset Password
          </h1>
          <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
            Enter your email and we'll send you a link to reset your password
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-3 rounded-2xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/20 dark:text-red-400">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-450">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
            <p className="font-medium">{success}</p>
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

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary-600 py-3 font-semibold text-white transition-all hover:bg-primary-500 active:scale-95 disabled:opacity-50 shadow-lg shadow-primary-500/20"
          >
            {loading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <KeyRound className="h-5 w-5" />
                Send Reset Link
              </>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          Remember your password?{' '}
          <Link 
            to="/login" 
            className="font-semibold text-primary-600 hover:underline dark:text-primary-400"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};
