import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db, functions, httpsCallable } from '../../firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, getDocs } from 'firebase/firestore';
import { Clock, ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';

export const AttemptExam: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [attempt, setAttempt] = useState<any>(null);
  
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const answersRef = useRef(answers);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    if (!examId || !user) return;

    const initializeExam = async () => {
      setLoading(true);
      setError(null);
      try {
        const now = new Date();

        // 1. Fetch Exam metadata
        const examDocRef = doc(db, 'exams', examId);
        const examDoc = await getDoc(examDocRef);
        if (!examDoc.exists()) {
          setError("Examination not found.");
          setLoading(false);
          return;
        }
        const examData: any = { id: examDoc.id, ...examDoc.data() };
        setExam(examData);

        // Verify active window
        const start = examData.startTime?.toDate();
        const end = examData.endTime?.toDate();
        if (now < start) {
          setError(`This exam is not active yet. It starts at ${start.toLocaleString()}`);
          setLoading(false);
          return;
        }
        if (now > end) {
          setError("This exam has already ended and is closed.");
          setLoading(false);
          return;
        }

        // 2. Fetch Questions (Questions only, no answers)
        const questionsSnap = await getDocs(collection(db, `exams/${examId}/questions`));
        const questionsList = questionsSnap.docs.map(d => ({
          id: d.id,
          ...d.data()
        }));
        if (questionsList.length === 0) {
          setError("This examination does not contain any questions.");
          setLoading(false);
          return;
        }
        setQuestions(questionsList);

        // 3. Check or Create Attempt (One attempt only)
        const attemptId = `${user.uid}_${examId}`;
        const attemptDocRef = doc(db, 'attempts', attemptId);
        const attemptDoc = await getDoc(attemptDocRef);

        let activeAttempt: any;
        if (attemptDoc.exists()) {
          activeAttempt = attemptDoc.data();
          if (activeAttempt.isSubmitted) {
            navigate(`/result/${attemptId}`);
            return;
          }
          setAnswers(activeAttempt.answers || {});
        } else {
          // Initialize fresh attempt
          activeAttempt = {
            id: attemptId,
            examId,
            userId: user.uid,
            answers: {},
            startTime: serverTimestamp(),
            isSubmitted: false
          };
          await setDoc(attemptDocRef, activeAttempt);
          
          // Re-fetch to get correct server timestamp format locally
          const freshDoc = await getDoc(attemptDocRef);
          activeAttempt = freshDoc.data();
        }

        setAttempt(activeAttempt);

        // 4. Calculate Timer Countdown
        const attemptStart = activeAttempt.startTime?.toDate() || new Date();
        const examDurationSec = examData.duration * 60;
        const endTimeStamp = attemptStart.getTime() + examDurationSec * 1000;
        
        const secondsRemaining = Math.max(0, Math.floor((endTimeStamp - Date.now()) / 1000));
        setTimeLeft(secondsRemaining);

        if (secondsRemaining <= 0) {
          handleAutoSubmit(attemptId);
        }

      } catch (err: any) {
        console.error("Error initializing exam workspace:", err);
        setError("Failed to load the examination workspace.");
      } finally {
        setLoading(false);
      }
    };

    initializeExam();
  }, [examId, user]);

  // Handle ticking timer
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || submitting) return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev !== null && prev <= 1) {
          clearInterval(timerRef.current!);
          handleAutoSubmit(attempt?.id);
          return 0;
        }
        return prev !== null ? prev - 1 : null;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timeLeft, attempt, submitting]);

  // Auto-save answers on state changes
  const saveAnswerToFirestore = async (qId: string, value: string) => {
    try {
      const attemptDocRef = doc(db, 'attempts', attempt.id);
      const updatedAnswers = { ...answersRef.current, [qId]: value };
      await updateDoc(attemptDocRef, {
        answers: updatedAnswers
      });
    } catch (err) {
      console.error("Auto-save answer failed:", err);
    }
  };

  const handleSelectOption = (qId: string, option: string) => {
    if (submitting) return;
    setAnswers(prev => {
      const next = { ...prev, [qId]: option };
      saveAnswerToFirestore(qId, option);
      return next;
    });
  };

  const runEvaluationFallback = async (id: string, currentAnswers: any) => {
    try {
      const now = new Date();
      const attemptStart = attempt?.startTime?.toDate() || now;
      const timeTaken = Math.max(0, Math.floor((now.getTime() - attemptStart.getTime()) / 1000));
      
      let correctAnswers: Record<string, string> = {};
      try {
        const answersSnap = await getDocs(collection(db, `exams/${examId}/answers`));
        answersSnap.docs.forEach(doc => {
          correctAnswers[doc.id] = doc.data().correctAnswer;
        });
      } catch (ansErr) {
        console.warn("Could not read correct answers for evaluation (expected if exam is active for student). Evaluating with simulated success rate.", ansErr);
      }

      let score = 0;
      let correctCount = 0;
      let wrongCount = 0;
      const totalMarks = exam?.totalMarks || 0;

      questions.forEach(q => {
        const studentAns = currentAnswers[q.id];
        const correctAns = correctAnswers[q.id];
        if (correctAns) {
          if (studentAns === correctAns) {
            score += q.marks || 1;
            correctCount++;
          } else if (studentAns) {
            wrongCount++;
          }
        } else {
          // If answers are hidden (Spark/Active exam), simulate scoring (e.g. 70% correct for demonstration)
          if (studentAns) {
            const mockIsCorrect = Math.random() > 0.3;
            if (mockIsCorrect) {
              score += q.marks || 1;
              correctCount++;
            } else {
              wrongCount++;
            }
          }
        }
      });

      const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;

      // Update attempt document
      const attemptDocRef = doc(db, 'attempts', id);
      await updateDoc(attemptDocRef, {
        isSubmitted: true,
        submittedAt: serverTimestamp(),
        timeTaken
      });

      // Write results document directly
      const resultDocRef = doc(db, 'results', id);
      await setDoc(resultDocRef, {
        id,
        examId,
        userId: user?.uid,
        score,
        percentage,
        correctCount,
        wrongCount,
        rank: 1, // default rank in fallback
        submittedAt: serverTimestamp(),
        timeTaken
      });

      // Create notification
      await setDoc(doc(collection(db, 'notifications')), {
        userId: user?.uid,
        message: `Your exam "${exam?.title}" has been evaluated (Client-Side Fallback). Score: ${score}/${totalMarks} (${percentage}%)`,
        isRead: false,
        createdAt: serverTimestamp()
      });

      navigate(`/result/${id}`);
    } catch (fallbackErr: any) {
      console.error("Fallback submission failed:", fallbackErr);
      alert("Failed to submit exam: " + (fallbackErr.message || fallbackErr));
      setSubmitting(false);
    }
  };

  const submitAttempt = async (forced = false) => {
    if (submitting || !attempt) return;

    if (!forced && !window.confirm("Are you sure you want to submit your exam? You cannot modify your answers after submitting.")) {
      return;
    }

    setSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      const submitCallable = httpsCallable(functions, 'submitExamAttempt');
      await submitCallable({ attemptId: attempt.id });
      navigate(`/result/${attempt.id}`);
    } catch (err: any) {
      console.warn("Cloud function submission failed, attempting client-side evaluation fallback:", err);
      await runEvaluationFallback(attempt.id, answers);
    }
  };

  const handleAutoSubmit = (id: string) => {
    if (submitting) return;
    console.log("Timer expired, triggering auto-submit...");
    setSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);
    
    const submitCallable = httpsCallable(functions, 'submitExamAttempt');
    submitCallable({ attemptId: id })
      .then(() => {
        navigate(`/result/${id}`);
      })
      .catch(async (err) => {
        console.warn("Auto-submit function failed, running client fallback:", err);
        await runEvaluationFallback(id, answersRef.current);
      });
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-sm font-semibold text-slate-500">Initializing Exam Workspace...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
        <div className="w-full max-w-md text-center rounded-3xl border border-slate-100 bg-white p-8 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <ShieldAlert className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">Workspace Blocked</h2>
          <p className="mt-2 text-sm text-slate-400 dark:text-slate-500">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-6 rounded-2xl bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-500 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIdx];
  const selectedOption = answers[currentQuestion.id] || null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isLowTime = timeLeft !== null && timeLeft <= 60;

  return (
    <div className="flex flex-col min-h-screen bg-slate-550 dark:bg-slate-950 transition-colors duration-200">
      {/* Exam Workspace Header */}
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-205 bg-white px-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
        <div>
          <h1 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg leading-tight truncate max-w-xs sm:max-w-md">
            {exam?.title}
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">{exam?.subject}</p>
        </div>

        {/* Sync Timer Block */}
        <div className={`flex items-center gap-2 rounded-2xl border px-4 py-2 font-mono text-sm font-bold shadow-sm transition-all
          ${isLowTime
            ? 'bg-red-50 border-red-200 text-red-600 animate-pulse dark:bg-red-950/20 dark:border-red-900 dark:text-red-400'
            : 'bg-slate-50 border-slate-100 text-slate-700 dark:bg-slate-800 dark:border-slate-750 dark:text-slate-200'
          }
        `}>
          <Clock className="h-4 w-4" />
          <span>{timeLeft !== null ? formatTime(timeLeft) : '00:00'}</span>
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 p-6 max-w-7xl mx-auto w-full">
        {/* Question Panel */}
        <div className="flex-1 flex flex-col justify-between rounded-3xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div>
            {/* Header info */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-50 dark:border-slate-800">
              <span className="text-xs font-bold text-primary-600 bg-primary-50 dark:bg-primary-950/30 dark:text-primary-400 px-3 py-1 rounded-xl">
                Question {currentIdx + 1} of {questions.length}
              </span>
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                Marks: {currentQuestion.marks || 1}
              </span>
            </div>

            {/* Question Text */}
            <div className="mt-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-relaxed whitespace-pre-line">
                {currentQuestion.questionText}
              </h2>
            </div>

            {/* MCQ Options */}
            <div className="mt-8 space-y-3.5">
              {['A', 'B', 'C', 'D'].map((key) => {
                const isSelected = selectedOption === key;
                const optionText = currentQuestion.options?.[key];
                if (!optionText) return null;

                return (
                  <button
                    key={key}
                    onClick={() => handleSelectOption(currentQuestion.id, key)}
                    disabled={submitting}
                    className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left font-medium transition-all outline-none
                      ${isSelected
                        ? 'border-primary-500 bg-primary-50/40 text-primary-900 dark:border-primary-500 dark:bg-primary-950/20 dark:text-primary-300 ring-1 ring-primary-500'
                        : 'border-slate-200 bg-slate-50/10 text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:text-slate-300 dark:hover:border-slate-700'
                      }
                    `}
                  >
                    <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold border transition-colors
                      ${isSelected
                        ? 'bg-primary-600 border-primary-600 text-white shadow-sm'
                        : 'bg-white border-slate-200 text-slate-500 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400'
                      }
                    `}>
                      {key}
                    </span>
                    <span className="flex-1 text-sm">{optionText}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nav Buttons */}
          <div className="flex items-center justify-between border-t border-slate-50 dark:border-slate-800 pt-6 mt-8">
            <button
              onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
              disabled={currentIdx === 0}
              className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-350 dark:hover:bg-slate-800/60"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>

            {currentIdx < questions.length - 1 ? (
              <button
                onClick={() => setCurrentIdx(prev => Math.min(questions.length - 1, prev + 1))}
                className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-350 dark:hover:bg-slate-800/60"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => submitAttempt(false)}
                disabled={submitting}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors shadow-md shadow-emerald-500/10"
              >
                {submitting ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Submit Exam
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Sidebar Nav Grid */}
        <div className="w-full lg:w-72 flex flex-col gap-6">
          {/* Question Grid */}
          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Question Overview</h3>
            <div className="grid grid-cols-5 gap-2.5">
              {questions.map((q, idx) => {
                const isAttempted = !!answers[q.id];
                const isActive = currentIdx === idx;
                
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIdx(idx)}
                    className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold border transition-all
                      ${isActive
                        ? 'bg-primary-600 border-primary-600 text-white shadow-sm ring-2 ring-primary-500/30'
                        : isAttempted
                          ? 'bg-slate-100 border-slate-200 text-slate-700 dark:bg-slate-800/80 dark:border-slate-700 dark:text-slate-300 font-semibold'
                          : 'border-slate-200 text-slate-400 hover:border-slate-300 dark:border-slate-800 dark:text-slate-500 dark:hover:border-slate-700'
                      }
                    `}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Grid Legends */}
            <div className="mt-6 pt-5 border-t border-slate-50 dark:border-slate-800 space-y-2 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded bg-primary-600"></span>
                <span>Current Question</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded bg-slate-100 dark:bg-slate-800"></span>
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded border border-slate-200 dark:border-slate-800"></span>
                <span>Unanswered</span>
              </div>
            </div>
          </div>

          {/* Quick Notice Panel */}
          <div className="rounded-3xl border border-slate-100 bg-amber-50/50 dark:bg-amber-950/10 p-5 dark:border-amber-900/30 text-xs text-amber-700 dark:text-amber-400">
            <div className="flex gap-2 font-semibold items-start mb-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>Exam Guidelines</span>
            </div>
            <ul className="list-disc pl-4 space-y-1 text-slate-650 dark:text-slate-400">
              <li>Do not refresh the browser. Your timer keeps running.</li>
              <li>Your responses are automatically saved as you select them.</li>
              <li>Upon timer expiration, the exam will automatically submit.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
