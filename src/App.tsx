import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';

// Pages
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { Dashboard } from './pages/Dashboard';

// Student Pages
import { AvailableExams } from './pages/student/AvailableExams';
import { AttemptExam } from './pages/student/AttemptExam';
import { ViewResult } from './pages/student/ViewResult';
import { PerformanceHistory } from './pages/student/PerformanceHistory';

// Faculty Pages
import { FacultyDashboard } from './pages/faculty/FacultyDashboard';
import { ExamManagement } from './pages/faculty/ExamManagement';
import { ExamAnalytics } from './pages/faculty/ExamAnalytics';

// Admin Pages
import { UserManagement } from './pages/admin/UserManagement';
import { AdminExams } from './pages/admin/AdminExams';
import { PlatformAnalytics } from './pages/admin/PlatformAnalytics';

// Shell Layout
const MainLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected Routes under Dashboard Shell Layout */}
          <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* Student Routes */}
            <Route path="/exams" element={<ProtectedRoute allowedRoles={['student']}><AvailableExams /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute allowedRoles={['student']}><PerformanceHistory /></ProtectedRoute>} />
            <Route path="/result/:resultId" element={<ViewResult />} />

            {/* Faculty Routes */}
            <Route path="/faculty/exams" element={<ProtectedRoute allowedRoles={['faculty', 'admin']}><FacultyDashboard /></ProtectedRoute>} />
            <Route path="/faculty/exams/new" element={<ProtectedRoute allowedRoles={['faculty', 'admin']}><ExamManagement /></ProtectedRoute>} />
            <Route path="/faculty/exams/:examId" element={<ProtectedRoute allowedRoles={['faculty', 'admin']}><ExamManagement /></ProtectedRoute>} />
            <Route path="/faculty/analytics" element={<ProtectedRoute allowedRoles={['faculty', 'admin']}><FacultyDashboard /></ProtectedRoute>} />
            <Route path="/faculty/analytics/:examId" element={<ProtectedRoute allowedRoles={['faculty', 'admin']}><ExamAnalytics /></ProtectedRoute>} />

            {/* Admin Routes */}
            <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><UserManagement /></ProtectedRoute>} />
            <Route path="/admin/exams" element={<ProtectedRoute allowedRoles={['admin']}><AdminExams /></ProtectedRoute>} />
            <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={['admin']}><PlatformAnalytics /></ProtectedRoute>} />
          </Route>

          {/* Special Fullscreen student workspaces (no sidebars/navbars) */}
          <Route 
            path="/attempt/:examId" 
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <AttemptExam />
              </ProtectedRoute>
            } 
          />

          {/* Fallbacks */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
