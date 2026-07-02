import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, query, where, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { 
  Plus, 
  FileSpreadsheet, 
  Users, 
  Award, 
  TrendingUp, 
  BarChart3, 
  Trash2, 
  Edit, 
  Eye, 
  Share2 
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const FacultyDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [studentMap, setStudentMap] = useState<Record<string, string>>({});

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Fetch exams created by this faculty
      const examsQuery = query(collection(db, 'exams'), where('createdBy', '==', user.uid));
      const examsSnap = await getDocs(examsQuery);
      const examsList = examsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setExams(examsList);

      const examIds = examsList.map(e => e.id);

      // 2. Fetch all results & filter by examId
      const resultsSnap = await getDocs(collection(db, 'results'));
      const allResults = resultsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      const facultyResults = allResults.filter((r: any) => examIds.includes(r.examId));
      setResults(facultyResults);

      // 3. Fetch user accounts to map display names
      const usersSnap = await getDocs(collection(db, 'users'));
      const studentNames: Record<string, string> = {};
      usersSnap.docs.forEach(doc => {
        studentNames[doc.id] = doc.data().displayName || 'Student';
      });
      setStudentMap(studentNames);

    } catch (err) {
      console.error("Error fetching faculty dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Actions
  const handleDeleteExam = async (examId: string) => {
    if (!window.confirm("Are you sure you want to delete this examination? All questions, answers, and attempts will be lost.")) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'exams', examId));
      setExams(prev => prev.filter(e => e.id !== examId));
      alert("Exam deleted successfully.");
    } catch (err) {
      console.error("Failed to delete exam:", err);
      alert("Error deleting exam.");
    }
  };

  const handleTogglePublish = async (examId: string, currentStatus: boolean) => {
    try {
      const examRef = doc(db, 'exams', examId);
      await updateDoc(examRef, { isPublished: !currentStatus });
      setExams(prev => prev.map(e => e.id === examId ? { ...e, isPublished: !currentStatus } : e));
    } catch (err) {
      console.error("Failed to update publish status:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Calculate metrics
  const totalExams = exams.length;
  const totalAttempts = results.length;
  const passRates = results.map(res => {
    const exam = exams.find(e => e.id === res.examId);
    return res.percentage >= (exam?.passPercentage || 50);
  });
  const passedAttempts = passRates.filter(Boolean).length;
  const averagePassRate = totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0;
  
  const averageScore = totalAttempts > 0
    ? Math.round(results.reduce((acc, curr) => acc + (curr.percentage || 0), 0) / totalAttempts)
    : 0;

  // Prepare chart data (Average score by exam)
  const chartData = exams.map(exam => {
    const examResults = results.filter(r => r.examId === exam.id);
    const avg = examResults.length > 0
      ? Math.round(examResults.reduce((acc, curr) => acc + curr.percentage, 0) / examResults.length)
      : 0;
    return {
      name: exam.title.length > 15 ? `${exam.title.substring(0, 12)}...` : exam.title,
      'Average %': avg
    };
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Faculty Workspace
          </h1>
          <p className="text-sm text-slate-450 dark:text-slate-400">
            Create assessment blueprints, manage schedules, and review student grades.
          </p>
        </div>
        <Link
          to="/faculty/exams/new"
          className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-500 transition-colors shadow-lg shadow-primary-500/10"
        >
          <Plus className="h-4.5 w-4.5" />
          Create Exam
        </Link>
      </div>

      {/* Metrics Panel */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-400 dark:text-slate-500">Exams Created</span>
            <FileSpreadsheet className="h-5 w-5 text-blue-500" />
          </div>
          <h2 className="mt-4 text-3xl font-bold text-slate-900 dark:text-white">{totalExams}</h2>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-400 dark:text-slate-500">Total Submissions</span>
            <Users className="h-5 w-5 text-indigo-500" />
          </div>
          <h2 className="mt-4 text-3xl font-bold text-slate-900 dark:text-white">{totalAttempts}</h2>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-400 dark:text-slate-500">Class Average Score</span>
            <Award className="h-5 w-5 text-emerald-500" />
          </div>
          <h2 className="mt-4 text-3xl font-bold text-slate-900 dark:text-white">{averageScore}%</h2>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-400 dark:text-slate-500">Average Pass Rate</span>
            <TrendingUp className="h-5 w-5 text-amber-500" />
          </div>
          <h2 className="mt-4 text-3xl font-bold text-slate-900 dark:text-white">{averagePassRate}%</h2>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Managed Exams List */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Active Examinations</h3>
          {exams.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-slate-400 dark:text-slate-500">No exams created yet. Click "Create Exam" to begin.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              {exams.map((exam) => (
                <div key={exam.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                  <div className="overflow-hidden mr-4">
                    <h4 className="font-semibold text-slate-900 dark:text-white truncate">{exam.title}</h4>
                    <p className="text-xs text-slate-450 dark:text-slate-500 mt-0.5">
                      {exam.subject} • {exam.duration} mins • {exam.isPublished ? 'Published' : 'Draft'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => handleTogglePublish(exam.id, exam.isPublished)}
                      className={`p-1.5 rounded-lg border transition-colors
                        ${exam.isPublished 
                          ? 'border-emerald-250 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-400' 
                          : 'border-slate-200 text-slate-400 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800'
                        }
                      `}
                      title={exam.isPublished ? "Unpublish Exam" : "Publish Exam"}
                    >
                      <Share2 className="h-4 w-4" />
                    </button>
                    <Link
                      to={`/faculty/exams/${exam.id}`}
                      className="p-1.5 rounded-lg border border-slate-205 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
                      title="Edit Exam & Questions"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                    <Link
                      to={`/faculty/analytics/${exam.id}`}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-650 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
                      title="View Analytics"
                    >
                      <BarChart3 className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDeleteExam(exam.id)}
                      className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-950/20 dark:hover:bg-red-950/30"
                      title="Delete Exam"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Analytics Distribution Bar Chart */}
        {totalAttempts > 0 && (
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Exam Averages</h3>
            <div className="h-56 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 0, bottom: 5, left: -25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:hidden" />
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" className="hidden dark:block" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                  <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={10} />
                  <Tooltip />
                  <Bar dataKey="Average %" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={25} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Recent Student Attempts List */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-3">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Recent Evaluations</h3>
          {results.length === 0 ? (
            <p className="text-sm text-slate-450 dark:text-slate-500 py-4">No exams submitted yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-semibold uppercase text-slate-450 dark:text-slate-450">
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Exam</th>
                    <th className="py-3 px-4 text-center">Score</th>
                    <th className="py-3 px-4 text-center">Percentage</th>
                    <th className="py-3 px-4 text-right font-medium">Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800 text-sm">
                  {results.slice(0, 5).map((res) => {
                    const examName = exams.find(e => e.id === res.examId)?.title || 'Exam';
                    const studentName = studentMap[res.userId] || 'Candidate';
                    return (
                      <tr key={res.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">{studentName}</td>
                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{examName}</td>
                        <td className="py-3 px-4 text-center text-slate-700 dark:text-slate-300">{res.score}</td>
                        <td className="py-3 px-4 text-center font-bold text-slate-800 dark:text-white">{res.percentage}%</td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            to={`/result/${res.id}`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-primary-600 hover:underline dark:text-primary-400"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
