import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { 
  BookOpen, 
  Award, 
  Clock, 
  Calendar, 
  ArrowRight, 
  FileText,
  TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState<any[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const now = new Date();

        // 1. Fetch published exams
        const examsQuery = query(collection(db, 'exams'), where('isPublished', '==', true));
        const examsSnap = await getDocs(examsQuery);
        const examsList = examsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setExams(examsList);

        // 2. Fetch student attempts
        const attemptsQuery = query(
          collection(db, 'attempts'), 
          where('userId', '==', user.uid)
        );
        const attemptsSnap = await getDocs(attemptsQuery);
        const attemptsList = attemptsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAttempts(attemptsList);

        // 3. Fetch student results
        const resultsQuery = query(
          collection(db, 'results'),
          where('userId', '==', user.uid)
        );
        const resultsSnap = await getDocs(resultsQuery);
        const resultsList = resultsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        // Sort by submitted date
        resultsList.sort((a: any, b: any) => b.submittedAt?.seconds - a.submittedAt?.seconds);
        setResults(resultsList);

      } catch (err) {
        console.error("Error fetching student dashboard data:", err);
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

  // Segment exams
  const now = new Date();
  
  const attemptedExamIds = new Set(attempts.map(a => a.examId));

  const availableExams = exams.filter(exam => {
    const start = exam.startTime?.toDate();
    const end = exam.endTime?.toDate();
    return start <= now && end >= now && !attemptedExamIds.has(exam.id);
  });

  const upcomingExams = exams.filter(exam => {
    const start = exam.startTime?.toDate();
    return start > now;
  });

  // Calculate metrics
  const totalExamsTaken = results.length;
  const averagePercentage = totalExamsTaken > 0
    ? Math.round(results.reduce((acc, curr) => acc + (curr.percentage || 0), 0) / totalExamsTaken)
    : 0;
  const highestPercentage = totalExamsTaken > 0
    ? Math.max(...results.map(r => r.percentage || 0))
    : 0;

  // Prepare chart data
  const chartData = [...results]
    .reverse() // show chronological order
    .map(res => {
      const exam = exams.find(e => e.id === res.examId);
      return {
        name: exam?.title || 'Exam',
        Score: res.percentage || 0
      };
    });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Student Dashboard
        </h1>
        <p className="text-sm text-slate-450 dark:text-slate-400">
          Welcome back! Here is a summary of your performance and active exams.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-400 dark:text-slate-500">Exams Taken</span>
            <div className="rounded-xl bg-blue-50 p-2 text-blue-650 dark:bg-blue-950/30 dark:text-blue-400">
              <BookOpen className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{totalExamsTaken}</h2>
            <p className="mt-1 text-xs text-slate-450 dark:text-slate-500">Total submitted assessments</p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-400 dark:text-slate-500">Average Percentage</span>
            <div className="rounded-xl bg-emerald-50 p-2 text-emerald-650 dark:bg-emerald-950/30 dark:text-emerald-450">
              <Award className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{averagePercentage}%</h2>
            <p className="mt-1 text-xs text-slate-450 dark:text-slate-500">Mean percentage across all tests</p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-400 dark:text-slate-500">Highest Score</span>
            <div className="rounded-xl bg-amber-50 p-2 text-amber-650 dark:bg-amber-950/30 dark:text-amber-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{highestPercentage}%</h2>
            <p className="mt-1 text-xs text-slate-450 dark:text-slate-500">Your personal best record</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Active Exams & Upcoming Exams */}
        <div className="space-y-6 lg:col-span-2">
          {/* Available/Active Exams */}
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Available Exams</h3>
            {availableExams.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <p className="text-sm text-slate-400 dark:text-slate-500">No exams available to attempt right now.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {availableExams.map((exam) => (
                  <div key={exam.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 hover:shadow-md transition-shadow">
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">{exam.title}</h4>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{exam.subject} • {exam.topic}</p>
                      <div className="flex gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {exam.duration} mins</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" /> 
                          Closes: {exam.endTime?.toDate().toLocaleString(undefined, {month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    </div>
                    <Link
                      to={`/attempt/${exam.id}`}
                      className="mt-3 sm:mt-0 flex items-center justify-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-500 transition-colors"
                    >
                      Start Exam
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Performance Chart */}
          {totalExamsTaken > 0 && (
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Performance Trend</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:hidden" />
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" className="hidden dark:block" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                    <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                        borderColor: '#e2e8f0',
                        borderRadius: '1rem',
                        fontSize: '12px'
                      }}
                    />
                    <Line type="monotone" dataKey="Score" stroke="#0ea5e9" strokeWidth={3} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Panel: Upcoming Exams & Recent Attempts */}
        <div className="space-y-6">
          {/* Upcoming Exams */}
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Upcoming Exams</h3>
            {upcomingExams.length === 0 ? (
              <p className="text-sm text-slate-400 dark:text-slate-500 py-2">No scheduled upcoming exams.</p>
            ) : (
              <div className="space-y-3">
                {upcomingExams.slice(0, 3).map((exam) => (
                  <div key={exam.id} className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/10">
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm truncate">{exam.title}</h4>
                    <p className="text-xs text-slate-450 dark:text-slate-500 mt-0.5">{exam.subject}</p>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2 font-medium">
                      <Calendar className="h-3.5 w-3.5" />
                      Starts: {exam.startTime?.toDate().toLocaleString(undefined, {month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Attempt History */}
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Recent Results</h3>
            {results.length === 0 ? (
              <p className="text-sm text-slate-400 dark:text-slate-500 py-2">You haven't attempted any exams yet.</p>
            ) : (
              <div className="space-y-3">
                {results.slice(0, 4).map((res) => {
                  const exam = exams.find(e => e.id === res.examId);
                  const isPassed = res.percentage >= (exam?.passPercentage || 50);
                  
                  return (
                    <div key={res.id} className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/10">
                      <div className="overflow-hidden mr-2">
                        <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm truncate">{exam?.title || 'Exam'}</h4>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                          Score: {res.score}/{exam?.totalMarks || 0} ({res.percentage}%)
                        </p>
                      </div>
                      <Link 
                        to={`/result/${res.id}`}
                        className={`flex-shrink-0 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-colors
                          ${isPassed
                            ? 'bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-400'
                            : 'bg-red-50 border-red-100 text-red-700 dark:bg-red-950/20 dark:border-red-900 dark:text-red-400'
                          }
                        `}
                      >
                        Details
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
