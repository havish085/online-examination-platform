import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { BookOpen, Clock, Calendar, Search, AlertCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';

export const AvailableExams: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState<any[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const examsQuery = query(collection(db, 'exams'), where('isPublished', '==', true));
        const examsSnap = await getDocs(examsQuery);
        const examsList = examsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setExams(examsList);

        const attemptsQuery = query(collection(db, 'attempts'), where('userId', '==', user.uid));
        const attemptsSnap = await getDocs(attemptsQuery);
        const attemptsList = attemptsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAttempts(attemptsList);
      } catch (err) {
        console.error("Error fetching exams:", err);
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

  const attemptedExamIds = new Set(attempts.map(a => a.examId));
  const now = new Date();

  // Filter and Search
  const filteredExams = exams.filter(exam => {
    const matchesSearch = 
      exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.topic.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const available = filteredExams.filter(exam => {
    const start = exam.startTime?.toDate();
    const end = exam.endTime?.toDate();
    return start <= now && end >= now && !attemptedExamIds.has(exam.id);
  });

  const upcoming = filteredExams.filter(exam => {
    const start = exam.startTime?.toDate();
    return start > now;
  });

  const completed = filteredExams.filter(exam => attemptedExamIds.has(exam.id));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Available & Scheduled Exams
          </h1>
          <p className="text-sm text-slate-450 dark:text-slate-400">
            Browse through examinations that you are eligible to take, upcoming schedules, or completed tests.
          </p>
        </div>
        
        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-slate-400" />
          </span>
          <input
            type="text"
            placeholder="Search by subject, title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm outline-none transition-all dark:border-slate-800 dark:bg-slate-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Available Exams Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
          Active Now (Available to Attempt)
        </h2>
        {available.length === 0 ? (
          <div className="rounded-3xl border border-slate-100 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-400 dark:text-slate-500">No active exams available to take at this moment.</p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {available.map(exam => (
              <div key={exam.id} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-655 dark:bg-blue-950/30 dark:text-blue-400">
                      {exam.subject}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      Pass score: {exam.passPercentage}%
                    </span>
                  </div>
                  <h3 className="mt-3 text-lg font-bold text-slate-900 dark:text-white leading-snug">{exam.title}</h3>
                  <p className="mt-1 text-xs text-slate-450 dark:text-slate-500 line-clamp-2">{exam.description}</p>
                  
                  <div className="mt-4 space-y-2 border-t border-slate-50 dark:border-slate-800 pt-3 text-xs text-slate-550 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-slate-400" />
                      <span>Duration: <strong>{exam.duration} Minutes</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <span>Deadline: {exam.endTime?.toDate().toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <Link
                    to={`/attempt/${exam.id}`}
                    className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-primary-600 py-2.5 text-sm font-semibold text-white hover:bg-primary-500 transition-colors shadow-sm"
                  >
                    Start Exam Attempt
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming Exams Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Upcoming Schedules</h2>
        {upcoming.length === 0 ? (
          <div className="rounded-3xl border border-slate-100 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-400 dark:text-slate-500">No upcoming examinations scheduled.</p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {upcoming.map(exam => (
              <div key={exam.id} className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-350">
                  {exam.subject}
                </span>
                <h3 className="mt-2.5 font-bold text-slate-900 dark:text-white leading-snug">{exam.title}</h3>
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500 line-clamp-1">{exam.topic}</p>
                <div className="mt-4 border-t border-slate-50 dark:border-slate-800 pt-3 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <span>Duration: {exam.duration} mins</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span>Starts: {exam.startTime?.toDate().toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed Exams Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Completed Attempts</h2>
        {completed.length === 0 ? (
          <div className="rounded-3xl border border-slate-100 bg-white p-6 text-center dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-400 dark:text-slate-500">No completed exams found.</p>
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 text-xs font-semibold uppercase tracking-wider text-slate-450 dark:text-slate-400">
                    <th className="px-6 py-4">Exam Title</th>
                    <th className="px-6 py-4">Subject</th>
                    <th className="px-6 py-4">Completed On</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                  {completed.map(exam => {
                    const attempt = attempts.find(a => a.examId === exam.id);
                    return (
                      <tr key={exam.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                        <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{exam.title}</td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{exam.subject}</td>
                        <td className="px-6 py-4 text-slate-550 dark:text-slate-400">
                          {attempt?.submittedAt ? attempt.submittedAt.toDate().toLocaleString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <span className="rounded-lg bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900">
                            Submitted
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {attempt && (
                            <Link
                              to={`/result/${attempt.id}`}
                              className="text-xs font-bold text-primary-600 hover:underline dark:text-primary-400"
                            >
                              View Results
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
