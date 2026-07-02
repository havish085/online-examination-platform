import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Award, Clock, FileSpreadsheet, CheckCircle2, XCircle } from 'lucide-react';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell
} from 'recharts';
import { Link } from 'react-router-dom';

export const PerformanceHistory: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const resultsQuery = query(collection(db, 'results'), where('userId', '==', user.uid));
        const resultsSnap = await getDocs(resultsQuery);
        const resultsList = resultsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setResults(resultsList);

        const examsQuery = query(collection(db, 'exams'), where('isPublished', '==', true));
        const examsSnap = await getDocs(examsQuery);
        const examsList = examsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setExams(examsList);
      } catch (err) {
        console.error("Error fetching performance history:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-100 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
        <Award className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
        <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">No Exam Records</h3>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          You haven't attempted or completed any exams yet. Once you do, your performance history will appear here.
        </p>
        <Link 
          to="/exams"
          className="mt-6 inline-flex items-center gap-1.5 rounded-2xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-500 transition-colors"
        >
          View Available Exams
        </Link>
      </div>
    );
  }

  // Enrich results with exam metadata
  const enrichedResults = results.map(res => {
    const exam = exams.find(e => e.id === res.examId);
    return {
      ...res,
      examTitle: exam?.title || 'Unknown Exam',
      subject: exam?.subject || 'Unknown Subject',
      passPercentage: exam?.passPercentage || 50,
      totalQuestions: exam?.totalQuestions || 0,
      totalMarks: exam?.totalMarks || 0,
      isPassed: res.percentage >= (exam?.passPercentage || 50)
    };
  });

  // Sort chronological
  const chronologicalResults = [...enrichedResults].sort((a, b) => a.submittedAt?.seconds - b.submittedAt?.seconds);

  // 1. Line Chart Data: Scores Over Time
  const lineChartData = chronologicalResults.map(res => ({
    name: res.examTitle,
    Score: res.percentage,
    'Pass Mark': res.passPercentage
  }));

  // 2. Bar Chart Data: Performance by Subject
  const subjectPerformance: Record<string, { totalPercentage: number, count: number }> = {};
  enrichedResults.forEach(res => {
    if (!subjectPerformance[res.subject]) {
      subjectPerformance[res.subject] = { totalPercentage: 0, count: 0 };
    }
    subjectPerformance[res.subject].totalPercentage += res.percentage;
    subjectPerformance[res.subject].count += 1;
  });
  const barChartData = Object.keys(subjectPerformance).map(subject => ({
    subject,
    Average: Math.round(subjectPerformance[subject].totalPercentage / subjectPerformance[subject].count)
  }));

  // 3. Pie Chart Data: Pass vs Fail Ratio
  const passedCount = enrichedResults.filter(r => r.isPassed).length;
  const failedCount = enrichedResults.length - passedCount;
  const pieChartData = [
    { name: 'Passed', value: passedCount, color: '#10b981' },
    { name: 'Failed', value: failedCount, color: '#ef4444' }
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Performance Analytics
        </h1>
        <p className="text-sm text-slate-450 dark:text-slate-400">
          Track your progress, examine subject strengths, and view detailed scores.
        </p>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Trend Over Time */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
          <h3 className="text-md font-bold text-slate-900 dark:text-white mb-4">Exam Score Trend (%)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineChartData} margin={{ top: 5, right: 10, bottom: 5, left: -25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:hidden" />
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" className="hidden dark:block" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickFormatter={(v) => v.length > 12 ? `${v.substring(0, 10)}...` : v} />
                <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
                <Line type="monotone" dataKey="Score" stroke="#0ea5e9" strokeWidth={3} activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="Pass Mark" stroke="#94a3b8" strokeDasharray="5 5" strokeWidth={1} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pass/Fail Pie Chart */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
          <h3 className="text-md font-bold text-slate-900 dark:text-white">Pass/Fail Ratio</h3>
          <div className="h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} Exam(s)`, 'Count']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4 text-xs font-semibold">
            {pieChartData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                <span className="text-slate-500 dark:text-slate-400 capitalize">{item.name}: {item.value} ({Math.round(item.value / results.length * 100)}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Subject-Wise Performance Bar Chart */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-3">
          <h3 className="text-md font-bold text-slate-900 dark:text-white mb-4">Subject Strengths (Average %)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 5, right: 10, bottom: 5, left: -25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:hidden" />
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" className="hidden dark:block" />
                <XAxis dataKey="subject" stroke="#94a3b8" fontSize={11} />
                <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Bar dataKey="Average" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Past Attempts list */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Exam History Records</h3>
        <div className="rounded-3xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 text-xs font-semibold uppercase tracking-wider text-slate-450 dark:text-slate-400">
                  <th className="px-6 py-4">Assessment</th>
                  <th className="px-6 py-4">Subject</th>
                  <th className="px-6 py-4 text-center">Score</th>
                  <th className="px-6 py-4 text-center">Percentage</th>
                  <th className="px-6 py-4 text-center">Time Spent</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Result Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {enrichedResults.map((res) => {
                  const minutes = Math.floor(res.timeTaken / 60);
                  const seconds = res.timeTaken % 60;
                  
                  return (
                    <tr key={res.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{res.examTitle}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-550">
                            Attempted on: {res.submittedAt?.toDate().toLocaleDateString()}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{res.subject}</td>
                      <td className="px-6 py-4 text-center font-medium text-slate-850 dark:text-slate-200">
                        {res.score} / {res.totalMarks}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-slate-850 dark:text-slate-200">
                        {res.percentage}%
                      </td>
                      <td className="px-6 py-4 text-center text-slate-550 dark:text-slate-400">
                        {minutes > 0 ? `${minutes}m ` : ''}{seconds}s
                      </td>
                      <td className="px-6 py-4">
                        {res.isPassed ? (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Passed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-100 dark:border-red-900">
                            <XCircle className="h-3.5 w-3.5" />
                            Failed
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/result/${res.id}`}
                          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                        >
                          View Results
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
