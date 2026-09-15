import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, UserRole } from '../context/AuthContext';
import { Mail, Lock, User, UserPlus, AlertCircle, Sparkles, ShieldCheck } from 'lucide-react';
import { LoadingSpinner } from '../components/UI/LoadingSpinner';
import { ThreeDBackground } from '../components/UI/ThreeDBackground';
import { ThreeDCard } from '../components/UI/ThreeDCard';

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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-12 transition-colors duration-200">
      {/* 3D Interactive WebGL Particle & Wireframe Background */}
      <ThreeDBackground />

      {/* Ambient Glowing Orbs */}
      <div className="pointer-events-none absolute -left-20 -top-20 h-96 w-96 rounded-full bg-indigo-600/20 blur-[120px] animate-pulse" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-cyan-600/20 blur-[120px] animate-pulse" />

      <ThreeDCard className="w-full max-w-md" intensity={12}>
        <div className="relative z-10 space-y-6 rounded-3xl border border-white/10 bg-slate-900/80 p-8 backdrop-blur-xl shadow-2xl shadow-primary-950/50">
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-500 text-white shadow-lg shadow-primary-500/30 transform transition-transform hover:rotate-6">
              <span className="text-2xl font-black">E</span>
              <Sparkles className="absolute -right-1.5 -top-1.5 h-4 w-4 text-amber-300 animate-bounce" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              Create Account
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Join the Online Examination & Assessment Platform
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-xs text-red-300 backdrop-blur-sm">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-400 mt-0.5" />
              <p className="font-medium leading-relaxed">{error}</p>
            </div>
          )}

          {/* Role Selector Tabs */}
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-800/60 p-1.5 border border-white/5">
            <button
              type="button"
              onClick={() => setSelectedRole('student')}
              className={`rounded-xl py-2.5 text-xs font-semibold transition-all duration-200
                ${selectedRole === 'student'
                  ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-lg shadow-primary-500/20'
                  : 'text-slate-400 hover:text-white'
                }
              `}
            >
              I'm a Student
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole('faculty')}
              className={`rounded-xl py-2.5 text-xs font-semibold transition-all duration-200
                ${selectedRole === 'faculty'
                  ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-lg shadow-primary-500/20'
                  : 'text-slate-400 hover:text-white'
                }
              `}
            >
              I'm Faculty
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="h-4 w-4 text-slate-400" />
                </span>
                <input
                  type="text"
                  placeholder="John Doe"
                  {...register('name', { required: 'Name is required' })}
                  className={`w-full rounded-2xl border bg-slate-800/50 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-all
                    ${errors.name 
                      ? 'border-red-500 focus:ring-1 focus:ring-red-500' 
                      : 'border-white/10 focus:border-primary-500 focus:ring-1 focus:ring-primary-500'
                    }
                  `}
                />
              </div>
              {errors.name && (
                <span className="text-xs text-red-400 mt-1 block">{errors.name.message}</span>
              )}
            </div>

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
                  placeholder="john@example.com"
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
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-4 w-4 text-slate-400" />
                </span>
                <input
                  type="password"
                  placeholder="••••••••"
                  {...register('password', { 
                    required: 'Password is required',
                    minLength: { value: 6, message: 'Password must be at least 6 characters' }
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

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-4 w-4 text-slate-400" />
                </span>
                <input
                  type="password"
                  placeholder="••••••••"
                  {...register('confirmPassword', { required: 'Confirm your password' })}
                  className={`w-full rounded-2xl border bg-slate-800/50 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-all
                    ${errors.confirmPassword 
                      ? 'border-red-500 focus:ring-1 focus:ring-red-500' 
                      : 'border-white/10 focus:border-primary-500 focus:ring-1 focus:ring-primary-500'
                    }
                  `}
                />
              </div>
              {errors.confirmPassword && (
                <span className="text-xs text-red-400 mt-1 block">{errors.confirmPassword.message}</span>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary-600 to-indigo-600 py-3 font-semibold text-white transition-all hover:from-primary-500 hover:to-indigo-500 active:scale-95 disabled:opacity-50 shadow-lg shadow-primary-600/30"
            >
              {loading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Sign Up
                </>
              )}
            </button>
          </form>

          <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs text-slate-400">
            <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Secure Registration</span>
            <Link 
              to="/login" 
              className="font-semibold text-primary-400 hover:underline"
            >
              Sign In Instead →
            </Link>
          </div>
        </div>
      </ThreeDCard>
    </div>
  );
};
