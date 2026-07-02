import React, { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Award, Users, BookOpen, BarChart3, TrendingUp, HelpCircle } from 'lucide-react';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';

export const PlatformAnalytics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        setUsers(usersSnap.docs.map(d => d.data()));

        const examsSnap = await getDocs(collection(db, 'exams'));
        setExams(examsSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        const resultsSnap = await getDocs(collection(db, 'results'));
        setResults(resultsSnap.docs.map(d => d.data()));
      } catch (err) {
        console.error("Error fetching platform analytics:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[75vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Calculate stats
  const totalUsers = users.length;
  const totalExams = exams.length;
  const totalAttempts = results.length;

  const averagePercentage = totalAttempts > 0
    ? Math.round(results.reduce((acc, curr) => acc + (curr.percentage || 0), 0) / totalAttempts)
    : 0;

  const passedAttempts = results.filter(res => {
    const exam = exams.find(e => e.id === res.examId);
    return res.percentage >= (exam?.passPercentage || 50);
  }).length;
  
  const platformPassRate = totalAttempts > 0
    ? Math.round((passedAttempts / totalAttempts) * 100)
    : 0;

  // Chart 1: Popularity (Attempts per Exam)
  const examPopularityData = exams.map(exam => {
    const count = results.filter(r => r.examId === exam.id).length;
    return {
      title: exam.title.length > 15 ? `${exam.title.substring(0, 12)}...` : exam.title,
      Attempts: count
    };
  }).filter(item => item.Attempts > 0);

  // Chart 2: Average Grade per Exam
  const examPerformanceData = exams.map(exam => {
    const examResults = results.filter(r => r.examId === exam.id);
    const avg = examResults.length > 0
      ? Math.round(examResults.reduce((acc, curr) => acc + curr.percentage, 0) / examResults.length)
      : 0;
    return {
      title: exam.title.length > 15 ? `${exam.title.substring(0, 12)}...` : exam.title,
      'Average %': avg
    };
  }).filter(item => item['Average %'] > 0);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Platform-Wide Analytics
        </h1>
        <p className="text-sm text-slate-450 dark:text-slate-400">
          Global performance stats, examination comparisons, and candidate distributions.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">Users</span>
            <Users className="h-4.5 w-4.5 text-blue-500" />
          </div>
          <h2 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{totalUsers}</h2>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">Exams</span>
            <BookOpen className="h-4.5 w-4.5 text-indigo-500" />
          </div>
          <h2 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{totalExams}</h2>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">Attempts</span>
            <HelpCircle className="h-4.5 w-4.5 text-orange-500" />
          </div>
          <h2 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{totalAttempts}</h2>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">Platform Avg</span>
            <Award className="h-4.5 w-4.5 text-emerald-500" />
          </div>
          <h2 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{averagePercentage}%</h2>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">Global Pass Rate</span>
            <TrendingUp className="h-4.5 w-4.5 text-amber-500" />
          </div>
          <h2 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{platformPassRate}%</h2>
        </div>
      </div>

      {totalAttempts === 0 ? (
        <div className="rounded-3xl border border-slate-100 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <BarChart3 className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
          <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">No attempts recorded</h3>
          <p className="mt-2 text-sm text-slate-450 dark:text-slate-500">
            Once students start attempting examinations, the platform-wide charts will display here.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Exam Popularity Chart */}
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-md font-bold text-slate-900 dark:text-white mb-4">Exam Popularity (Attempt Counts)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={examPopularityData} margin={{ top: 5, right: 10, bottom: 5, left: -25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:hidden" />
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" className="hidden dark:block" />
                  <XAxis dataKey="title" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="Attempts" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Exam Grades Comparison Chart */}
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-md font-bold text-slate-900 dark:text-white mb-4">Exam Performance Comparison (Average %)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={examPerformanceData} margin={{ top: 5, right: 10, bottom: 5, left: -25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:hidden" />
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" className="hidden dark:block" />
                  <XAxis dataKey="title" stroke="#94a3b8" fontSize={11} />
                  <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="Average %" fill="#10b981" radius={[6, 6, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
