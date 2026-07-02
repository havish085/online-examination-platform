import React, { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Trash2, Edit3, Share2, Search, Calendar, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';

export const AdminExams: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState<any[]>([]);
  const [facultyMap, setFacultyMap] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');

  const fetchExamsData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Exams
      const examsSnap = await getDocs(collection(db, 'exams'));
      const examsList = examsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setExams(examsList);

      // 2. Fetch Users to map faculty display names
      const usersSnap = await getDocs(collection(db, 'users'));
      const facMap: Record<string, string> = {};
      usersSnap.docs.forEach(doc => {
        const data = doc.data();
        facMap[doc.id] = `${data.displayName || 'Faculty'} (${data.email || ''})`;
      });
      setFacultyMap(facMap);

    } catch (err) {
      console.error("Error fetching exams for admin:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExamsData();
  }, []);

  const handleDeleteExam = async (examId: string) => {
    if (!window.confirm("Are you sure you want to delete this exam? This will erase all questions, results, and student attempts.")) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'exams', examId));
      setExams(prev => prev.filter(e => e.id !== examId));
      alert("Exam deleted successfully.");
    } catch (err) {
      console.error("Failed to delete exam:", err);
    }
  };

  const handleTogglePublish = async (examId: string, currentStatus: boolean) => {
    try {
      const examRef = doc(db, 'exams', examId);
      await updateDoc(examRef, { isPublished: !currentStatus });
      setExams(prev => prev.map(e => e.id === examId ? { ...e, isPublished: !currentStatus } : e));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[75vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Filter
  const filteredExams = exams.filter(exam => {
    const term = searchQuery.toLowerCase();
    const facultyName = (facultyMap[exam.createdBy] || '').toLowerCase();
    return (
      exam.title.toLowerCase().includes(term) ||
      exam.subject.toLowerCase().includes(term) ||
      facultyName.includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Audit Examinations
          </h1>
          <p className="text-sm text-slate-450 dark:text-slate-400">
            View, audit, edit settings, publish, or remove any examinations hosted on the platform.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-slate-400" />
          </span>
          <input
            type="text"
            placeholder="Search by title, subject, owner..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-slate-205 bg-white py-2.5 pl-9 pr-4 text-xs outline-none transition-all dark:border-slate-800 dark:bg-slate-900"
          />
        </div>
      </div>

      {/* Exams audit table */}
      <div className="rounded-3xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 text-xs font-semibold uppercase text-slate-450 dark:text-slate-400">
                <th className="px-6 py-4">Examination Title</th>
                <th className="px-6 py-4">Created By</th>
                <th className="px-6 py-4">Timing Details</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {filteredExams.map((exam) => {
                const facDetails = facultyMap[exam.createdBy] || 'Unknown Faculty';
                const startTime = exam.startTime?.toDate()?.toLocaleString() || 'N/A';
                const endTime = exam.endTime?.toDate()?.toLocaleString() || 'N/A';

                return (
                  <tr key={exam.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{exam.title}</p>
                        <p className="text-xs text-slate-450 dark:text-slate-500 mt-0.5">
                          {exam.subject} • {exam.duration} mins • Qs: {exam.totalQuestions || 0}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-400 font-medium">
                      {facDetails}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-405">
                      <div className="flex flex-col gap-0.5">
                        <span>Start: {startTime}</span>
                        <span>End: {endTime}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {exam.isPublished ? (
                        <span className="rounded-lg bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900">
                          Published
                        </span>
                      ) : (
                        <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-655 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right space-x-1 flex-shrink-0">
                      <button
                        onClick={() => handleTogglePublish(exam.id, exam.isPublished)}
                        className={`inline-flex items-center gap-1 p-1.5 rounded-lg border text-xs font-semibold transition-colors
                          ${exam.isPublished 
                            ? 'border-emerald-250 bg-emerald-50 text-emerald-655 dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-400' 
                            : 'border-slate-202 text-slate-400 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800'
                          }
                        `}
                        title={exam.isPublished ? "Unpublish Exam" : "Publish Exam"}
                      >
                        <Share2 className="h-4 w-4" />
                      </button>
                      <Link
                        to={`/faculty/exams/${exam.id}`}
                        className="inline-flex items-center gap-1 p-1.5 rounded-lg border border-slate-205 text-slate-650 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
                        title="Edit Exam blueprint"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDeleteExam(exam.id)}
                        className="inline-flex items-center gap-1 p-1.5 rounded-lg border border-red-200 text-red-650 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/20"
                        title="Delete Exam"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
