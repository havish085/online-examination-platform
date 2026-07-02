import React from 'react';
import { useAuth } from '../context/AuthContext';
import { StudentDashboard } from './student/StudentDashboard';
import { FacultyDashboard } from './faculty/FacultyDashboard';
import { AdminDashboard } from './admin/AdminDashboard';
import { LoadingSpinner } from '../components/UI/LoadingSpinner';

export const Dashboard: React.FC = () => {
  const { role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-[75vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  switch (role) {
    case 'student':
      return <StudentDashboard />;
    case 'faculty':
      return <FacultyDashboard />;
    case 'admin':
      return <AdminDashboard />;
    default:
      return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6">
          <h2 className="text-xl font-bold text-red-500">Access Restricted</h2>
          <p className="text-sm text-slate-500 mt-2 max-w-sm">
            Your user account is initialized but has no role configured. Please contact the administrator.
          </p>
        </div>
      );
  }
};
