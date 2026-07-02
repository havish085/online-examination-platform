import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  BookOpen, 
  History, 
  FileSpreadsheet, 
  BarChart3, 
  Users, 
  ShieldCheck, 
  X 
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { role } = useAuth();

  const getLinks = () => {
    switch (role) {
      case 'student':
        return [
          { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/exams', label: 'Available Exams', icon: BookOpen },
          { to: '/history', label: 'Performance', icon: History }
        ];
      case 'faculty':
        return [
          { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/faculty/exams', label: 'Manage Exams', icon: FileSpreadsheet },
          { to: '/faculty/analytics', label: 'Analytics', icon: BarChart3 }
        ];
      case 'admin':
        return [
          { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/admin/users', label: 'Manage Users', icon: Users },
          { to: '/admin/exams', label: 'Manage Exams', icon: ShieldCheck },
          { to: '/admin/analytics', label: 'Platform Stats', icon: BarChart3 }
        ];
      default:
        return [];
    }
  };

  const links = getLinks();

  const sidebarClasses = `
    fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0
    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
  `;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={sidebarClasses}>
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-100 dark:border-slate-800">
          <span className="font-bold text-lg text-slate-800 dark:text-white">Navigation</span>
          <button
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
            aria-label="Close Sidebar"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1 px-4 py-6 overflow-y-auto">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={onClose}
                className={({ isActive }) => `
                  flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200
                  ${isActive 
                    ? 'bg-primary-50 text-primary-600 dark:bg-primary-950/30 dark:text-primary-400' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200'
                  }
                `}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {link.label}
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/40 p-4">
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Logged in as</p>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate capitalize">{role || 'User'}</p>
          </div>
        </div>
      </aside>
    </>
  );
};
