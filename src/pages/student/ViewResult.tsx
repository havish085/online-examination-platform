import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { 
  Award, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Download, 
  ChevronLeft, 
  Lock, 
  AlertCircle,
  ShieldAlert 
} from 'lucide-react';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { downloadResultPDF } from '../../utils/pdfGenerator';

export const ViewResult: React.FC = () => {
  const { resultId } = useParams<{ resultId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [exam, setExam] = useState<any>(null);
  const [attempt, setAttempt] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  
  const [examClosed, setExamClosed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!resultId || !user) return;

    const fetchResultData = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Fetch Result
        const resultDoc = await getDoc(doc(db, 'results', resultId));
        if (!resultDoc.exists()) {
          setError("Result document not found.");
          setLoading(false);
          return;
        }
        const resData = resultDoc.data();
        setResult(resData);

        // 2. Fetch Attempt
        const attemptDoc = await getDoc(doc(db, 'attempts', resultId));
        if (attemptDoc.exists()) {
          setAttempt(attemptDoc.data());
        }

        // 3. Fetch Exam
        const examDoc = await getDoc(doc(db, 'exams', resData.examId));
        if (!examDoc.exists()) {
          setError("Exam associated with this result was not found.");
          setLoading(false);
          return;
        }
        const examData = examDoc.data();
        setExam(examData);

        // 4. Fetch Questions
        const questionsSnap = await getDocs(collection(db, `exams/${resData.examId}/questions`));
        const questionsList = questionsSnap.docs.map(d => ({
          id: d.id,
          ...d.data()
        }));
        setQuestions(questionsList);

        // 5. Check if exam closes in the past (deadline passed)
        const now = new Date();
        const endTime = examData.endTime?.toDate();
        const closed = now > endTime;
        setExamClosed(closed);

        // 6. Fetch explanations and correct answers if closed
        if (closed) {
          try {
            const answersSnap = await getDocs(collection(db, `exams/${resData.examId}/answers`));
            const answersMap: Record<string, any> = {};
            answersSnap.docs.forEach(doc => {
              answersMap[doc.id] = doc.data();
            });
            setAnswers(answersMap);
          } catch (ansErr) {
            console.warn("Could not fetch answer explanations. Check security rules or database records.", ansErr);
          }
        }

      } catch (err) {
        console.error("Error loading results workspace:", err);
        setError("Failed to fetch evaluation details.");
      } finally {
        setLoading(false);
      }
    };

    fetchResultData();
  }, [resultId, user]);

  if (loading) {
    return (
      <div className="flex h-[75vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center max-w-md mx-auto">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Failed to load results</h2>
        <p className="text-sm text-slate-450 dark:text-slate-500 mt-2">{error || "Something went wrong."}</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="mt-6 rounded-2xl bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-500 transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const isPassed = result.percentage >= (exam?.passPercentage || 50);
  const minutes = Math.floor(result.timeTaken / 60);
  const seconds = result.timeTaken % 60;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back to Dashboard */}
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Dashboard
      </button>

      {/* Main Scorecard */}
      <div className="rounded-3xl border border-slate-105 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-tight">
              {exam?.title}
            </h1>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1 capitalize">
              {exam?.subject} • Exam Evaluated
            </p>
          </div>
          <button
            onClick={() => downloadResultPDF(result, exam, user?.displayName || 'Student')}
            className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm dark:border-slate-850 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/60"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </button>
        </div>

        {/* Metrics Blocks */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="rounded-2xl bg-slate-50/50 dark:bg-slate-800/20 p-4 border border-slate-100 dark:border-slate-800/40 text-center">
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-550">Score</p>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-850 dark:text-white mt-1">
              {result.score} <span className="text-sm font-medium text-slate-450">/ {exam?.totalMarks}</span>
            </h2>
          </div>
          <div className="rounded-2xl bg-slate-50/50 dark:bg-slate-800/20 p-4 border border-slate-100 dark:border-slate-800/40 text-center">
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-555">Percentage</p>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-850 dark:text-white mt-1">
              {result.percentage}%
            </h2>
          </div>
          <div className="rounded-2xl bg-slate-50/50 dark:bg-slate-800/20 p-4 border border-slate-100 dark:border-slate-800/40 text-center">
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-550">Class Rank</p>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-850 dark:text-white mt-1">
              #{result.rank}
            </h2>
          </div>
          <div className="rounded-2xl bg-slate-50/50 dark:bg-slate-800/20 p-4 border border-slate-100 dark:border-slate-800/40 text-center">
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-550">Time Taken</p>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-850 dark:text-white mt-1">
              {minutes > 0 ? `${minutes}m ` : ''}{seconds}s
            </h2>
          </div>
        </div>

        {/* Status Alert Banner */}
        <div className={`mt-6 flex items-center justify-between p-4 rounded-2xl border
          ${isPassed
            ? 'bg-emerald-50/60 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-400'
            : 'bg-red-50/60 border-red-100 dark:bg-red-950/20 dark:border-red-900/60 text-red-800 dark:text-red-400'
          }
        `}>
          <div className="flex items-center gap-3">
            {isPassed ? <CheckCircle2 className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
            <div>
              <p className="font-bold text-sm sm:text-base capitalize">
                Examination Result: {isPassed ? 'Passed' : 'Failed'}
              </p>
              <p className="text-xs font-medium opacity-90 mt-0.5">
                Required passing percentage: {exam?.passPercentage}%
              </p>
            </div>
          </div>
        </div>

        {/* Proctoring Report Banner */}
        {result.tabSwitches > 0 && (
          <div className="mt-4 flex items-center justify-between p-4 rounded-2xl border bg-amber-50/60 border-amber-150 dark:bg-amber-955/10 dark:border-amber-900/60 text-amber-800 dark:text-amber-400 shadow-sm">
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-6 w-6 flex-shrink-0" />
              <div>
                <p className="font-bold text-sm">
                  AI Proctoring Audit Warning
                </p>
                <p className="text-xs font-medium opacity-90 mt-0.5">
                  Candidate was flagged with {result.tabSwitches} window/tab switch occurrences during this attempt.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Explanations & Answers Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Question Review & Explanations</h2>
        
        {!examClosed ? (
          <div className="flex items-start gap-4 rounded-3xl border border-slate-150 bg-amber-50/20 p-6 dark:border-amber-900/20">
            <Lock className="h-6 w-6 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-amber-800 dark:text-amber-500">Correct Answers & Explanations Locked</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                Security Policy: Detailed solutions, explanations, and correct choices are restricted while the examination window is active. They will become available automatically after the exam closes on:
                <strong className="block mt-1 font-semibold text-slate-900 dark:text-white">
                  {exam?.endTime?.toDate().toLocaleString()}
                </strong>
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((q, idx) => {
              const studentChoice = attempt?.answers?.[q.id] || null;
              const correctChoice = answers[q.id]?.correctAnswer || null;
              const explanation = answers[q.id]?.explanation || null;
              const isCorrect = studentChoice === correctChoice;
              
              return (
                <div key={q.id} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-50 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                      Question {idx + 1}
                    </span>
                    {studentChoice ? (
                      isCorrect ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 px-2.5 py-1 rounded-lg">
                          Correct (+{q.marks || 1})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-red-655 bg-red-50 dark:bg-red-950/20 dark:text-red-400 px-2.5 py-1 rounded-lg">
                          Incorrect (+0)
                        </span>
                      )
                    ) : (
                      <span className="text-xs font-semibold text-slate-400 bg-slate-50 dark:bg-slate-800 dark:text-slate-500 px-2.5 py-1 rounded-lg">
                        Unanswered
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-4 leading-relaxed">
                    {q.questionText}
                  </h3>

                  {/* Options display */}
                  <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                    {['A', 'B', 'C', 'D'].map(key => {
                      const optText = q.options?.[key];
                      if (!optText) return null;
                      
                      const isStudent = studentChoice === key;
                      const isCorrectAnswer = correctChoice === key;
                      
                      let borderClass = 'border-slate-100 dark:border-slate-800';
                      let bgClass = 'bg-slate-50/50 dark:bg-slate-800/10 text-slate-700 dark:text-slate-350';
                      
                      if (isCorrectAnswer) {
                        borderClass = 'border-emerald-500 dark:border-emerald-500';
                        bgClass = 'bg-emerald-50/40 text-emerald-900 dark:bg-emerald-950/10 dark:text-emerald-400 font-medium';
                      } else if (isStudent && !isCorrectAnswer) {
                        borderClass = 'border-red-500 dark:border-red-500';
                        bgClass = 'bg-red-50/40 text-red-900 dark:bg-red-950/10 dark:text-red-400 font-medium';
                      }
                      
                      return (
                        <div key={key} className={`flex items-center gap-3 rounded-2xl border p-3.5 text-xs ${borderClass} ${bgClass}`}>
                          <span className={`flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold border
                            ${isCorrectAnswer 
                              ? 'bg-emerald-600 border-emerald-600 text-white' 
                              : isStudent 
                                ? 'bg-red-600 border-red-600 text-white' 
                                : 'bg-white border-slate-205 text-slate-400 dark:bg-slate-900 dark:border-slate-750'
                            }
                          `}>
                            {key}
                          </span>
                          <span>{optText}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation box */}
                  {explanation && (
                    <div className="mt-5 rounded-2xl bg-blue-50/40 border border-blue-100/50 p-4 dark:bg-slate-850 dark:border-slate-800 text-xs">
                      <p className="font-bold text-primary-700 dark:text-primary-400">Explanation:</p>
                      <p className="text-slate-650 dark:text-slate-400 mt-1 leading-relaxed">{explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
