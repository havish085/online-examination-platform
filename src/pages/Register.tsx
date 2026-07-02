import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, UserRole } from '../context/AuthContext';
import { Mail, Lock, User, UserPlus, AlertCircle } from 'lucide-react';
import { LoadingSpinner } from '../components/UI/LoadingSpinner';

export const Register: React.FC = () => {
  const { register: registerAuth } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    }
  });

  const onSubmit = async (data: any) => {
    if (data.password !== data.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setError(null);
    setLoading(true);
    try {
      await registerAuth(data.email, data.password, data.name, selectedRole);
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Registration failed. Email might already be in use.');
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
            Create Account
          </h1>
          <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
            Sign up to get started with Online Examinations
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-3 rounded-2xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/20 dark:text-red-400">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1.5 dark:bg-slate-800/60">
          <button
            type="button"
            onClick={() => setSelectedRole('student')}
            className={`rounded-xl py-2.5 text-sm font-semibold transition-all duration-205
              ${selectedRole === 'student'
                ? 'bg-white text-slate-900 shadow dark:bg-slate-900 dark:text-white'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }
            `}
          >
            I'm a Student
          </button>
          <button
            type="button"
            onClick={() => setSelectedRole('faculty')}
            className={`rounded-xl py-2.5 text-sm font-semibold transition-all duration-205
              ${selectedRole === 'faculty'
                ? 'bg-white text-slate-900 shadow dark:bg-slate-900 dark:text-white'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }
            `}
          >
            I'm Faculty
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Full Name
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <User className="h-5 w-5 text-slate-400" />
              </span>
              <input
                type="text"
                placeholder="John Doe"
                {...register('name', { required: 'Name is required' })}
                className={`w-full rounded-2xl border bg-slate-50/50 py-3 pl-10 pr-4 text-sm outline-none transition-all dark:bg-slate-800/40
                  ${errors.name 
                    ? 'border-red-500 focus:ring-1 focus:ring-red-500' 
                    : 'border-slate-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:focus:border-primary-500'
                  }
                `}
              />
            </div>
            {errors.name && (
              <span className="text-xs text-red-500 mt-1 block">{errors.name.message}</span>
            )}
          </div>

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
                placeholder="john@example.com"
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
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Lock className="h-5 w-5 text-slate-400" />
              </span>
              <input
                type="password"
                placeholder="••••••••"
                {...register('password', { 
                  required: 'Password is required',
                  minLength: { value: 6, message: 'Password must be at least 6 characters' }
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

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Lock className="h-5 w-5 text-slate-400" />
              </span>
              <input
                type="password"
                placeholder="••••••••"
                {...register('confirmPassword', { required: 'Confirm your password' })}
                className={`w-full rounded-2xl border bg-slate-50/50 py-3 pl-10 pr-4 text-sm outline-none transition-all dark:bg-slate-800/40
                  ${errors.confirmPassword 
                    ? 'border-red-500 focus:ring-1 focus:ring-red-500' 
                    : 'border-slate-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:focus:border-primary-500'
                  }
                `}
              />
            </div>
            {errors.confirmPassword && (
              <span className="text-xs text-red-500 mt-1 block">{errors.confirmPassword.message}</span>
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
                <UserPlus className="h-5 w-5" />
                Sign Up
              </>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          Already have an account?{' '}
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
