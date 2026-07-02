import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { ChevronLeft, Award, Users, ShieldAlert, BarChart3, TrendingUp, Check, X, Search } from 'lucide-react';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const ExamAnalytics: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [studentMap, setStudentMap] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  
  // Hardest & Easiest questions analysis
  const [itemStats, setItemStats] = useState<any[]>([]);

  useEffect(() => {
    if (!examId) return;

    const fetchAnalyticsData = async () => {
      setLoading(true);
      try {
        // 1. Fetch Exam details
        const examDoc = await getDoc(doc(db, 'exams', examId));
        if (!examDoc.exists()) {
          alert("Exam not found.");
          navigate('/dashboard');
          return;
        }
        const examData = examDoc.data();
        setExam({ id: examDoc.id, ...examData });

        const qSnap = await getDocs(collection(db, `exams/${examId}/questions`));
        const qList = qSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
        setQuestions(qList);

        // 3. Fetch Exam Analytics document
        const analyticsDoc = await getDoc(doc(db, 'analytics', examId));
        if (analyticsDoc.exists()) {
          setAnalytics(analyticsDoc.data());
        }

        // 4. Fetch Exam Results
        const resultsQuery = query(collection(db, 'results'), where('examId', '==', examId));
        const resultsSnap = await getDocs(resultsQuery);
        const resultsList = resultsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setResults(resultsList);

        // 5. Fetch student names map
        const usersSnap = await getDocs(collection(db, 'users'));
        const uMap: Record<string, string> = {};
        usersSnap.docs.forEach(doc => {
          uMap[doc.id] = doc.data().displayName || 'Student';
        });
        setStudentMap(uMap);

        // 6. Fetch attempts to analyze question success rate (Hardest/Easiest Questions)
        const attemptsQuery = query(collection(db, 'attempts'), where('examId', '==', examId), where('isSubmitted', '==', true));
        const attemptsSnap = await getDocs(attemptsQuery);
        const attemptsList = attemptsSnap.docs.map(doc => doc.data());

        // Fetch correct answers
        const answersSnap = await getDocs(collection(db, `exams/${examId}/answers`));
        const answersMap: Record<string, string> = {};
        answersSnap.docs.forEach(doc => {
          answersMap[doc.id] = doc.data().correctAnswer;
        });

        // Compute success rate for each question
        if (qList.length > 0 && attemptsList.length > 0) {
          const stats = qList.map(q => {
            let correctCount = 0;
            attemptsList.forEach((att: any) => {
              if (att.answers?.[q.id] === answersMap[q.id]) {
                correctCount++;
              }
            });
            const rate = Math.round((correctCount / attemptsList.length) * 100);
            return {
              id: q.id,
              questionText: q.questionText,
              correctCount,
              totalAttempts: attemptsList.length,
              successRate: rate
            };
          });
          setItemStats(stats);
        }

      } catch (err) {
        console.error("Error loading exam analytics:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [examId, navigate]);

  if (loading) {
    return (
      <div className="flex h-[75vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Fallback calculations if analytics doc doesn't exist yet
  const totalSubmissions = results.length;
  const avgPct = analytics?.passPercentage ?? (totalSubmissions > 0 
    ? Math.round(results.reduce((a, b) => a + b.percentage, 0) / totalSubmissions)
    : 0);

  const highestScore = analytics?.highestScore ?? (totalSubmissions > 0 
    ? Math.max(...results.map(r => r.score)) 
    : 0);

  const lowestScore = analytics?.lowestScore ?? (totalSubmissions > 0 
    ? Math.min(...results.map(r => r.score)) 
    : 0);

  const averageScore = analytics?.averageScore ?? (totalSubmissions > 0 
    ? Math.round((results.reduce((a, b) => a + b.score, 0) / totalSubmissions) * 10) / 10
    : 0);

  // Score Distribution Chart data
  const distribution = analytics?.distribution || { '0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0 };
  const chartData = [
    { range: '0-20%', Count: distribution['0-20'] || 0 },
    { range: '21-40%', Count: distribution['21-40'] || 0 },
    { range: '41-60%', Count: distribution['41-60'] || 0 },
    { range: '61-80%', Count: distribution['61-80'] || 0 },
    { range: '81-100%', Count: distribution['81-100'] || 0 }
  ];

  // Easiest and Hardest Questions
  const sortedStats = [...itemStats].sort((a, b) => a.successRate - b.successRate);
  const hardestQuestions = sortedStats.slice(0, 2);
  const easiestQuestions = [...itemStats].sort((a, b) => b.successRate - a.successRate).slice(0, 2);

  // Search Results
  const filteredResults = results.filter(res => {
    const studentName = (studentMap[res.userId] || '').toLowerCase();
    return studentName.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate('/faculty/exams')}
        className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Exams List
      </button>

      {/* Header Info */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Analysis: {exam?.title}
        </h1>
        <p className="text-sm text-slate-450 dark:text-slate-400">
          Overview of candidate scores, score distributions, and individual question difficulties.
        </p>
      </div>

      {totalSubmissions === 0 ? (
        <div className="rounded-3xl border border-slate-100 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <BarChart3 className="mx-auto h-12 w-12 text-slate-350 dark:text-slate-700" />
          <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white font-semibold">No Submissions Yet</h3>
          <p className="mt-2 text-sm text-slate-450 dark:text-slate-400">
            No students have attempted this examination. Analytics will be calculated dynamically once the first submission is received.
          </p>
        </div>
      ) : (
        <>
          {/* Metrics Row */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-3xl border border-slate-105 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">Submissions</span>
              <h2 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{totalSubmissions}</h2>
            </div>
            <div className="rounded-3xl border border-slate-105 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">Average Percentage</span>
              <h2 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{avgPct}%</h2>
            </div>
            <div className="rounded-3xl border border-slate-105 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">Average Score</span>
              <h2 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{averageScore} <span className="text-xs font-medium text-slate-450">/{exam?.totalMarks}</span></h2>
            </div>
            <div className="rounded-3xl border border-slate-105 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">Highest Score</span>
              <h2 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{highestScore} <span className="text-xs font-medium text-slate-450">/{exam?.totalMarks}</span></h2>
            </div>
            <div className="rounded-3xl border border-slate-105 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">Lowest Score</span>
              <h2 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{lowestScore} <span className="text-xs font-medium text-slate-450">/{exam?.totalMarks}</span></h2>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Score Distribution Chart */}
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
              <h3 className="text-md font-bold text-slate-900 dark:text-white mb-4">Score Distribution Histogram</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:hidden" />
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" className="hidden dark:block" />
                    <XAxis dataKey="range" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="Count" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Platform Analytics Summary */}
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
              <h3 className="text-md font-bold text-slate-900 dark:text-white mb-4">Grade Statistics</h3>
              <div className="space-y-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
                <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800">
                  <span>Passing Score Required</span>
                  <span className="text-slate-900 dark:text-white">{exam?.passPercentage}%</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800">
                  <span>Candidates Passed</span>
                  <span className="text-emerald-600 font-bold">
                    {results.filter(r => r.percentage >= (exam?.passPercentage || 50)).length} Students
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800">
                  <span>Candidates Failed</span>
                  <span className="text-red-500 font-bold">
                    {results.filter(r => r.percentage < (exam?.passPercentage || 50)).length} Students
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span>Pass rate percentage</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                    {Math.round((results.filter(r => r.percentage >= (exam?.passPercentage || 50)).length / totalSubmissions) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Hardest & Easiest Questions analysis */}
          {itemStats.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2">
              {/* Hardest Questions */}
              <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
                <h3 className="text-md font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                  <ShieldAlert className="h-5 w-5" />
                  Hardest Questions (Lowest Success Rate)
                </h3>
                <div className="space-y-3.5">
                  {hardestQuestions.map((item, idx) => (
                    <div key={item.id} className="p-4 rounded-2xl bg-red-50/20 border border-red-100/50 dark:bg-slate-850 dark:border-slate-800">
                      <div className="flex justify-between items-start gap-2 mb-1.5">
                        <span className="text-xs font-bold text-slate-450">Difficulty Rank #{idx + 1}</span>
                        <span className="rounded bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700 dark:bg-red-950/20 dark:text-red-400">
                          {item.successRate}% Correct
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-2 leading-relaxed">
                        {item.questionText}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Easiest Questions */}
              <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
                <h3 className="text-md font-bold text-emerald-600 dark:text-emerald-450 flex items-center gap-1.5">
                  <Check className="h-5 w-5" />
                  Easiest Questions (Highest Success Rate)
                </h3>
                <div className="space-y-3.5">
                  {easiestQuestions.map((item, idx) => (
                    <div key={item.id} className="p-4 rounded-2xl bg-emerald-50/20 border border-emerald-100/50 dark:bg-slate-850 dark:border-slate-800">
                      <div className="flex justify-between items-start gap-2 mb-1.5">
                        <span className="text-xs font-bold text-slate-450">Difficulty Rank #{idx + 1}</span>
                        <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400">
                          {item.successRate}% Correct
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-2 leading-relaxed">
                        {item.questionText}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Individual Students Grades table */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Candidate Grades Table</h3>
              
              {/* Filter */}
              <div className="relative w-full sm:w-72">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-4 w-4 text-slate-400" />
                </span>
                <input
                  type="text"
                  placeholder="Search student name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs outline-none transition-all dark:border-slate-800 dark:bg-slate-900"
                />
              </div>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 text-xs font-semibold uppercase text-slate-450 dark:text-slate-400">
                      <th className="px-6 py-4">Student Name</th>
                      <th className="px-6 py-4 text-center">Score obtained</th>
                      <th className="px-6 py-4 text-center">Percentage</th>
                      <th className="px-6 py-4 text-center">Duration</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                    {filteredResults.map(res => {
                      const stName = studentMap[res.userId] || 'Candidate';
                      const isResPassed = res.percentage >= (exam?.passPercentage || 50);
                      const minTaken = Math.floor(res.timeTaken / 60);
                      const secTaken = res.timeTaken % 60;
                      
                      return (
                        <tr key={res.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                          <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{stName}</td>
                          <td className="px-6 py-4 text-center text-slate-700 dark:text-slate-300">
                            {res.score} / {exam?.totalMarks}
                          </td>
                          <td className="px-6 py-4 text-center font-bold text-slate-900 dark:text-white">{res.percentage}%</td>
                          <td className="px-6 py-4 text-center text-slate-500 dark:text-slate-400">
                            {minTaken > 0 ? `${minTaken}m ` : ''}{secTaken}s
                          </td>
                          <td className="px-6 py-4">
                            {isResPassed ? (
                              <span className="rounded-lg bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400">
                                Passed
                              </span>
                            ) : (
                              <span className="rounded-lg bg-red-50 px-2 py-1 text-xs font-semibold text-red-750 dark:bg-red-950/20 dark:text-red-400">
                                Failed
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Link
                              to={`/result/${res.id}`}
                              className="text-xs font-bold text-primary-600 hover:underline dark:text-primary-400"
                            >
                              View Script
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
        </>
      )}
    </div>
  );
};
