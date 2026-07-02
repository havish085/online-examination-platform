import React, { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Users, FileText, Award, BarChart3, ShieldAlert, ArrowRight, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export const AdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [usersCount, setUsersCount] = useState({ student: 0, faculty: 0, admin: 0, total: 0 });
  const [examsCount, setExamsCount] = useState({ published: 0, drafts: 0, total: 0 });
  const [submissions, setSubmissions] = useState(0);

  useEffect(() => {
    const fetchPlatformStats = async () => {
      setLoading(true);
      try {
        // 1. Fetch Users
        const usersSnap = await getDocs(collection(db, 'users'));
        const usersList = usersSnap.docs.map(d => d.data());
        
        const counts = { student: 0, faculty: 0, admin: 0, total: usersList.length };
        usersList.forEach((u: any) => {
          if (u.role === 'student') counts.student++;
          else if (u.role === 'faculty') counts.faculty++;
          else if (u.role === 'admin') counts.admin++;
        });
        setUsersCount(counts);

        // 2. Fetch Exams
        const examsSnap = await getDocs(collection(db, 'exams'));
        const examsList = examsSnap.docs.map(d => d.data());
        const exCounts = { published: 0, drafts: 0, total: examsList.length };
        examsList.forEach((e: any) => {
          if (e.isPublished) exCounts.published++;
          else exCounts.drafts++;
        });
        setExamsCount(exCounts);

        // 3. Fetch Submissions count (results count)
        const resultsSnap = await getDocs(collection(db, 'results'));
        setSubmissions(resultsSnap.size);

      } catch (err) {
        console.error("Error fetching admin stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlatformStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // User breakdown chart data
  const pieData = [
    { name: 'Students', value: usersCount.student, color: '#0ea5e9' },
    { name: 'Faculty', value: usersCount.faculty, color: '#6366f1' },
    { name: 'Admins', value: usersCount.admin, color: '#f59e0b' }
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Admin Dashboard
        </h1>
        <p className="text-sm text-slate-450 dark:text-slate-400">
          Platform-wide controls, statistics, audits, and configuration utilities.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-400 dark:text-slate-500">Total Registered Users</span>
            <Users className="h-5 w-5 text-indigo-500" />
          </div>
          <h2 className="mt-4 text-3xl font-bold text-slate-900 dark:text-white">{usersCount.total}</h2>
          <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-1">
            {usersCount.student} Students • {usersCount.faculty} Faculty
          </p>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-400 dark:text-slate-500">Total Exams Created</span>
            <FileText className="h-5 w-5 text-blue-500" />
          </div>
          <h2 className="mt-4 text-3xl font-bold text-slate-900 dark:text-white">{examsCount.total}</h2>
          <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-1">
            {examsCount.published} Published • {examsCount.drafts} Drafts
          </p>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-400 dark:text-slate-500">Total Submissions</span>
            <Award className="h-5 w-5 text-emerald-500" />
          </div>
          <h2 className="mt-4 text-3xl font-bold text-slate-900 dark:text-white">{submissions}</h2>
          <p className="text-[10px] text-slate-455 dark:text-slate-500 mt-1">Evaluated attempts</p>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-400 dark:text-slate-500">Admins Active</span>
            <ShieldCheck className="h-5 w-5 text-amber-500" />
          </div>
          <h2 className="mt-4 text-3xl font-bold text-slate-900 dark:text-white">{usersCount.admin}</h2>
          <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-1">System administrators</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* User Breakdown Pie Chart */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">User Distribution</h3>
          <div className="h-56 w-full flex items-center justify-center">
            {pieData.length === 0 ? (
              <p className="text-xs text-slate-400">No users found.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Admin Command Center / Quick Links */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Admin Command Center</h3>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              to="/admin/users"
              className="flex items-center justify-between p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 transition-all hover:shadow-md"
            >
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">Manage Users</h4>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Approve accounts, view status, assign roles</p>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-400" />
            </Link>

            <Link
              to="/admin/exams"
              className="flex items-center justify-between p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 transition-all hover:shadow-md"
            >
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">Manage Exams</h4>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Audit, edit, or delete any examination blueprints</p>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-400" />
            </Link>

            <Link
              to="/admin/analytics"
              className="flex items-center justify-between p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 transition-all hover:shadow-md sm:col-span-2"
            >
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">Platform Reports</h4>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Track overall system performance, candidate success rates, and user additions trends</p>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-400" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
