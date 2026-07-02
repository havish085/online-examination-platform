import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sun, Moon, LogOut, User, Menu } from 'lucide-react';

interface NavbarProps {
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, role, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true' || 
      (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [darkMode]);

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
          aria-label="Toggle Sidebar"
        >
          <Menu className="h-6 w-6 text-slate-650 dark:text-slate-400" />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-white shadow-md shadow-primary-500/20">
            <span className="font-bold text-lg">E</span>
          </div>
          <span className="font-semibold text-lg tracking-tight text-slate-900 dark:text-white hidden sm:block">
            ExamPortal
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Dark Mode Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
          aria-label="Toggle Dark Mode"
        >
          {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        {/* User Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-semibold text-sm">
              {user?.displayName ? user.displayName.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
            </div>
            <div className="hidden md:block text-left text-xs">
              <p className="font-medium text-slate-700 dark:text-slate-250 leading-tight">
                {user?.displayName || 'User'}
              </p>
              <p className="font-light text-slate-400 dark:text-slate-500 capitalize">
                {role || 'Student'}
              </p>
            </div>
          </button>

          {showDropdown && (
            <>
              <div 
                className="fixed inset-0 z-30" 
                onClick={() => setShowDropdown(false)}
              />
              <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-xl border border-slate-200 bg-white p-1 shadow-lg ring-1 ring-black/5 focus:outline-none dark:border-slate-800 dark:bg-slate-900 z-40">
                <div className="px-3 py-2 border-b border-slate-150 dark:border-slate-800 md:hidden">
                  <p className="text-sm font-semibold text-slate-950 dark:text-white leading-tight">
                    {user?.displayName || 'User'}
                  </p>
                  <p className="text-xs text-slate-405 dark:text-slate-500 capitalize">
                    {role || 'Student'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
