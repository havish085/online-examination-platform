import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import { db, functions, httpsCallable } from '../../firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp, 
  collection, 
  getDocs, 
  deleteDoc, 
  writeBatch 
} from 'firebase/firestore';
import { 
  Save, 
  Plus, 
  Trash2, 
  Sparkles, 
  Upload, 
  AlertCircle, 
  ChevronLeft, 
  Edit3, 
  CheckCircle2, 
  Check, 
  PlusCircle, 
  ArrowRight,
  FileSpreadsheet
} from 'lucide-react';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';

export const ExamManagement: React.FC = () => {
  const { examId } = useParams<{ examId?: string }>();
  const isNew = !examId;
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [exam, setExam] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  
  // Tabs: 'details' | 'questions'
  const [activeTab, setActiveTab] = useState<'details' | 'questions'>('details');

  // Question Creation Form State
  const [editingQId, setEditingQId] = useState<string | null>(null);
  const [showQForm, setShowQForm] = useState(false);
  const [qForm, setQForm] = useState({
    questionText: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: 'A' as 'A' | 'B' | 'C' | 'D',
    explanation: '',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    marks: 2
  });

  // AI Generator Panel State
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiForm, setAiForm] = useState({
    subject: '',
    topic: '',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    count: 10
  });
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiQuestions, setAiQuestions] = useState<any[]>([]);
  const [selectedAIIndices, setSelectedAIIndices] = useState<Record<number, boolean>>({});

  // File Import State
  const [showImportPanel, setShowImportPanel] = useState(false);

  // Form hooks for Exam Details
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();

  // Load Exam and Questions
  useEffect(() => {
    const loadExamData = async () => {
      if (isNew) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const examDoc = await getDoc(doc(db, 'exams', examId));
        if (!examDoc.exists()) {
          setError("Exam blueprint not found.");
          setLoading(false);
          return;
        }
        const data = examDoc.data();
        setExam({ id: examDoc.id, ...data });

        // Set Form defaults
        setValue('title', data.title);
        setValue('description', data.description);
        setValue('subject', data.subject);
        setValue('topic', data.topic);
        setValue('duration', data.duration);
        setValue('passPercentage', data.passPercentage);
        
        // Format dates for HTML input type datetime-local
        if (data.startTime) {
          const startDt = data.startTime.toDate();
          setValue('startTime', startDt.toISOString().slice(0, 16));
        }
        if (data.endTime) {
          const endDt = data.endTime.toDate();
          setValue('endTime', endDt.toISOString().slice(0, 16));
        }

        // Fetch Questions
        const qSnap = await getDocs(collection(db, `exams/${examId}/questions`));
        const qList = qSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setQuestions(qList);

        // Fetch Answers
        const aSnap = await getDocs(collection(db, `exams/${examId}/answers`));
        const aMap: Record<string, any> = {};
        aSnap.docs.forEach(doc => {
          aMap[doc.id] = doc.data();
        });
        setAnswers(aMap);

      } catch (err) {
        console.error("Error loading exam blueprints:", err);
        setError("Failed to load exam blueprints.");
      } finally {
        setLoading(false);
      }
    };

    loadExamData();
  }, [examId, isNew, setValue]);

  // Recalculate Exam Totals in Firestore
  const updateExamTotals = async (updatedQuestions: any[]) => {
    if (isNew || !examId) return;
    const totalQuestions = updatedQuestions.length;
    const totalMarks = updatedQuestions.reduce((acc, q) => acc + (parseInt(q.marks) || 1), 0);

    try {
      await updateDoc(doc(db, 'exams', examId), {
        totalQuestions,
        totalMarks
      });
      setExam((prev: any) => ({ ...prev, totalQuestions, totalMarks }));
    } catch (err) {
      console.error("Failed to update exam summary totals:", err);
    }
  };

  // Create/Edit Exam Details
  const onSubmitExamDetails = async (data: any) => {
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        title: data.title,
        description: data.description,
        subject: data.subject,
        topic: data.topic,
        duration: parseInt(data.duration),
        passPercentage: parseInt(data.passPercentage),
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        updatedAt: serverTimestamp()
      };

      if (isNew) {
        const freshRef = doc(collection(db, 'exams'));
        const newExam = {
          ...payload,
          createdBy: user.uid,
          isPublished: false,
          totalQuestions: 0,
          totalMarks: 0,
          createdAt: serverTimestamp()
        };
        await setDoc(freshRef, newExam);
        alert("Exam Blueprint created! Now you can manage its questions.");
        navigate(`/faculty/exams/${freshRef.id}`);
      } else {
        await updateDoc(doc(db, 'exams', examId), payload);
        alert("Exam details updated successfully.");
        setExam((prev: any) => ({ ...prev, ...payload }));
      }
    } catch (err: any) {
      console.error("Failed to save exam details:", err);
      setError(err.message || "Failed to save exam configurations.");
    } finally {
      setSaving(false);
    }
  };

  // Add/Edit Question Handler
  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examId) return;

    if (!qForm.questionText || !qForm.optionA || !qForm.optionB || !qForm.optionC || !qForm.optionD) {
      alert("Please fill in the question and all four option fields.");
      return;
    }

    setSaving(true);
    try {
      const qRef = editingQId 
        ? doc(db, `exams/${examId}/questions`, editingQId) 
        : doc(collection(db, `exams/${examId}/questions`));
      
      const aRef = doc(db, `exams/${examId}/answers`, qRef.id);

      const questionData = {
        questionText: qForm.questionText,
        options: {
          A: qForm.optionA,
          B: qForm.optionB,
          C: qForm.optionC,
          D: qForm.optionD,
        },
        difficulty: qForm.difficulty,
        marks: parseInt(qForm.marks.toString()) || 1
      };

      const answerData = {
        correctAnswer: qForm.correctAnswer,
        explanation: qForm.explanation
      };

      // Write both
      await setDoc(qRef, questionData);
      await setDoc(aRef, answerData);

      // Update Local State
      let newQuestions = [...questions];
      if (editingQId) {
        newQuestions = newQuestions.map(q => q.id === editingQId ? { id: q.id, ...questionData } : q);
      } else {
        newQuestions.push({ id: qRef.id, ...questionData });
      }

      setQuestions(newQuestions);
      setAnswers(prev => ({ ...prev, [qRef.id]: answerData }));
      
      // Update totals in Firestore
      await updateExamTotals(newQuestions);

      // Reset Form
      setEditingQId(null);
      setShowQForm(false);
      setQForm({
        questionText: '',
        optionA: '',
        optionB: '',
        optionC: '',
        optionD: '',
        correctAnswer: 'A',
        explanation: '',
        difficulty: 'medium',
        marks: 2
      });

      alert("Question saved successfully.");
    } catch (err) {
      console.error("Error saving question:", err);
      alert("Failed to save question.");
    } finally {
      setSaving(false);
    }
  };

  const handleEditQuestionClick = (q: any) => {
    const qAns = answers[q.id] || {};
    setEditingQId(q.id);
    setQForm({
      questionText: q.questionText,
      optionA: q.options?.A || '',
      optionB: q.options?.B || '',
      optionC: q.options?.C || '',
      optionD: q.options?.D || '',
      correctAnswer: qAns.correctAnswer || 'A',
      explanation: qAns.explanation || '',
      difficulty: q.difficulty || 'medium',
      marks: q.marks || 2
    });
    setShowQForm(true);
    setShowAIPanel(false);
    setShowImportPanel(false);
  };

  const handleDeleteQuestion = async (qId: string) => {
    if (!examId || !window.confirm("Are you sure you want to delete this question?")) return;

    try {
      await deleteDoc(doc(db, `exams/${examId}/questions`, qId));
      await deleteDoc(doc(db, `exams/${examId}/answers`, qId));
      
      const filtered = questions.filter(q => q.id !== qId);
      setQuestions(filtered);
      setAnswers(prev => {
        const next = { ...prev };
        delete next[qId];
        return next;
      });

      await updateExamTotals(filtered);
      alert("Question deleted.");
    } catch (err) {
      console.error(err);
      alert("Failed to delete question.");
    }
  };

  // AI Question Generation Trigger
  const handleGenerateAI = async () => {
    if (!aiForm.subject || !aiForm.topic) {
      alert("Please enter both Subject and Topic names.");
      return;
    }

    setAiGenerating(true);
    setAiQuestions([]);
    try {
      const generateCallable = httpsCallable(functions, 'generateAIQuestions');
      const response: any = await generateCallable({
        subject: aiForm.subject,
        topic: aiForm.topic,
        difficulty: aiForm.difficulty,
        count: parseInt(aiForm.count.toString()) || 10
      });

      if (response.data?.success && Array.isArray(response.data.questions)) {
        setAiQuestions(response.data.questions);
        // Select all by default
        const selectedMap: Record<number, boolean> = {};
        response.data.questions.forEach((_: any, index: number) => {
          selectedMap[index] = true;
        });
        setSelectedAIIndices(selectedMap);
      } else {
        alert("Failed to generate questions. Try again.");
      }
    } catch (err: any) {
      console.warn("AI Cloud Function generation failed, triggering client-side mock generator:", err);
      
      const mockQs = Array.from({ length: aiForm.count }).map((_, idx) => ({
        questionText: `What is the key principle of ${aiForm.topic} in ${aiForm.subject}? (Generated by AI Fallback #${idx + 1})`,
        options: {
          A: `Optimized execution of ${aiForm.topic} processes.`,
          B: `Redundant overhead in ${aiForm.subject} structures.`,
          C: `Linear searches across dynamic nodes.`,
          D: `None of the options.`
        },
        correctAnswer: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)] as any,
        explanation: `${aiForm.topic} is a core concept in ${aiForm.subject} that prioritizes efficiency and structural integrity.`,
        difficulty: aiForm.difficulty,
        marks: aiForm.difficulty === 'easy' ? 1 : aiForm.difficulty === 'medium' ? 2 : 5
      }));

      setAiQuestions(mockQs);
      const selectedMap: Record<number, boolean> = {};
      mockQs.forEach((_, index) => {
        selectedMap[index] = true;
      });
      setSelectedAIIndices(selectedMap);
    } finally {
      setAiGenerating(false);
    }
  };

  const handleToggleAISelect = (index: number) => {
    setSelectedAIIndices(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleEditAIQuestion = (index: number, field: string, value: any) => {
    setAiQuestions(prev => prev.map((q, idx) => {
      if (idx !== index) return q;
      if (field.startsWith('option')) {
        const key = field.replace('option', '');
        return {
          ...q,
          options: {
            ...q.options,
            [key]: value
          }
        };
      }
      return { ...q, [field]: value };
    }));
  };

  const handleSaveAIQuestions = async () => {
    if (!examId) return;

    const questionsToSave = aiQuestions.filter((_, idx) => selectedAIIndices[idx]);
    if (questionsToSave.length === 0) {
      alert("No questions selected.");
      return;
    }

    setSaving(true);
    try {
      const batch = writeBatch(db);
      
      const newSavedQs: any[] = [];
      const newAnswers: Record<string, any> = {};

      questionsToSave.forEach(q => {
        const qRef = doc(collection(db, `exams/${examId}/questions`));
        const aRef = doc(db, `exams/${examId}/answers`, qRef.id);

        const questionData = {
          questionText: q.questionText,
          options: q.options,
          difficulty: q.difficulty || aiForm.difficulty,
          marks: parseInt(q.marks) || (aiForm.difficulty === 'easy' ? 1 : aiForm.difficulty === 'medium' ? 2 : 5)
        };

        const answerData = {
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || `The correct answer is ${q.correctAnswer}.`
        };

        batch.set(qRef, questionData);
        batch.set(aRef, answerData);

        newSavedQs.push({ id: qRef.id, ...questionData });
        newAnswers[qRef.id] = answerData;
      });

      await batch.commit();

      const combinedQuestions = [...questions, ...newSavedQs];
      setQuestions(combinedQuestions);
      setAnswers(prev => ({ ...prev, ...newAnswers }));

      await updateExamTotals(combinedQuestions);

      alert(`Successfully added ${questionsToSave.length} AI generated questions to the exam blueprint.`);
      setAiQuestions([]);
      setShowAIPanel(false);
    } catch (err) {
      console.error(err);
      alert("Failed to batch save AI questions.");
    } finally {
      setSaving(false);
    }
  };

  // CSV/JSON File Import Parser
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !examId) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const content = evt.target?.result as string;
      try {
        let importedList: any[] = [];

        if (file.name.endsWith('.json')) {
          importedList = JSON.parse(content);
          if (!Array.isArray(importedList)) {
            alert("JSON file must contain an array of question objects.");
            return;
          }
        } else if (file.name.endsWith('.csv')) {
          // simple csv parser: questionText, A, B, C, D, correctAnswer, explanation, difficulty, marks
          const lines = content.split('\n').filter(l => l.trim() !== '');
          // skip header if it starts with question
          const startIdx = lines[0].toLowerCase().includes('question') ? 1 : 0;
          
          for (let i = startIdx; i < lines.length; i++) {
            // simple comma split (doesn't handle commas in quotes perfectly, but sufficient for CSE project imports)
            const parts = lines[i].split(',').map(p => p.replace(/^"|"$/g, '').trim());
            if (parts.length >= 6) {
              importedList.push({
                questionText: parts[0],
                options: {
                  A: parts[1],
                  B: parts[2],
                  C: parts[3],
                  D: parts[4]
                },
                correctAnswer: parts[5] as 'A'|'B'|'C'|'D',
                explanation: parts[6] || 'No explanation provided.',
                difficulty: (parts[7] || 'medium') as any,
                marks: parseInt(parts[8]) || 2
              });
            }
          }
        } else {
          alert("Unsupported file type. Use JSON or CSV.");
          return;
        }

        // Batch save imported questions
        if (importedList.length === 0) {
          alert("No questions could be parsed.");
          return;
        }

        setSaving(true);
        const batch = writeBatch(db);
        const newSavedQs: any[] = [];
        const newAnswers: Record<string, any> = {};

        importedList.forEach(q => {
          const qRef = doc(collection(db, `exams/${examId}/questions`));
          const aRef = doc(db, `exams/${examId}/answers`, qRef.id);

          const questionData = {
            questionText: q.questionText,
            options: q.options || { A: q.optionA, B: q.optionB, C: q.optionC, D: q.optionD },
            difficulty: q.difficulty || 'medium',
            marks: parseInt(q.marks) || 2
          };

          const answerData = {
            correctAnswer: q.correctAnswer || 'A',
            explanation: q.explanation || ''
          };

          batch.set(qRef, questionData);
          batch.set(aRef, answerData);

          newSavedQs.push({ id: qRef.id, ...questionData });
          newAnswers[qRef.id] = answerData;
        });

        await batch.commit();

        const combinedQuestions = [...questions, ...newSavedQs];
        setQuestions(combinedQuestions);
        setAnswers(prev => ({ ...prev, ...newAnswers }));
        await updateExamTotals(combinedQuestions);

        alert(`Successfully imported ${importedList.length} questions.`);
        setShowImportPanel(false);
      } catch (err) {
        console.error("Import failed:", err);
        alert("Failed to parse file. Make sure file format matches template rules.");
      } finally {
        setSaving(false);
        e.target.value = ''; // reset file input
      }
    };
    reader.readAsText(file);
  };

  if (loading) {
    return (
      <div className="flex h-[75vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate('/faculty/exams')}
        className="flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Exams List
      </button>

      {/* Header Info */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {isNew ? 'Create New Examination' : `Manage: ${exam?.title}`}
        </h1>
        <p className="text-sm text-slate-450 dark:text-slate-400">
          Configure exam settings, timing rules, passing conditions, and design question pools.
        </p>
      </div>

      {/* Tabs */}
      {!isNew && (
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-2 px-1 text-sm font-semibold border-b-2 transition-all
              ${activeTab === 'details'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-white'
              }
            `}
          >
            Exam Settings
          </button>
          <button
            onClick={() => setActiveTab('questions')}
            className={`py-2 px-1 text-sm font-semibold border-b-2 transition-all
              ${activeTab === 'questions'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-white'
              }
            `}
          >
            Manage Questions ({questions.length})
          </button>
        </div>
      )}

      {/* Tab Contents: details */}
      {(isNew || activeTab === 'details') && (
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Blueprint Specifications</h2>
          
          {error && (
            <div className="mb-6 flex items-center gap-3 rounded-2xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/20 dark:text-red-400">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p className="font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmitExamDetails)} className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Exam Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. End Semester Algorithm Design"
                  {...register('title', { required: 'Title is required' })}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 px-4 text-sm outline-none transition-all dark:border-slate-800 dark:bg-slate-900 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  placeholder="e.g. Computer Science"
                  {...register('subject', { required: 'Subject is required' })}
                  className="w-full rounded-2xl border border-slate-205 bg-slate-50/50 py-3 px-4 text-sm outline-none transition-all dark:border-slate-800 dark:bg-slate-900 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Topic
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dynamic Programming"
                  {...register('topic', { required: 'Topic is required' })}
                  className="w-full rounded-2xl border border-slate-205 bg-slate-50/50 py-3 px-4 text-sm outline-none transition-all dark:border-slate-800 dark:bg-slate-900 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Duration (Minutes)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 60"
                  {...register('duration', { required: 'Duration is required', min: 1 })}
                  className="w-full rounded-2xl border border-slate-205 bg-slate-50/50 py-3 px-4 text-sm outline-none transition-all dark:border-slate-800 dark:bg-slate-900 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Start Window Time
                </label>
                <input
                  type="datetime-local"
                  {...register('startTime', { required: 'Start time is required' })}
                  className="w-full rounded-2xl border border-slate-205 bg-slate-50/50 py-3 px-4 text-sm outline-none transition-all dark:border-slate-800 dark:bg-slate-900 focus:border-primary-500 text-slate-700 dark:text-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  End/Deadline Time
                </label>
                <input
                  type="datetime-local"
                  {...register('endTime', { required: 'End time is required' })}
                  className="w-full rounded-2xl border border-slate-205 bg-slate-50/50 py-3 px-4 text-sm outline-none transition-all dark:border-slate-800 dark:bg-slate-900 focus:border-primary-500 text-slate-700 dark:text-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Passing Percentage (%)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 50"
                  {...register('passPercentage', { required: 'Pass percentage is required', min: 0, max: 100 })}
                  className="w-full rounded-2xl border border-slate-205 bg-slate-50/50 py-3 px-4 text-sm outline-none transition-all dark:border-slate-800 dark:bg-slate-900 focus:border-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Exam Description
              </label>
              <textarea
                rows={3}
                placeholder="Include examination instructions, scopes..."
                {...register('description')}
                className="w-full rounded-2xl border border-slate-205 bg-slate-50/50 py-3 px-4 text-sm outline-none transition-all dark:border-slate-800 dark:bg-slate-900 focus:border-primary-500"
              />
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-2xl bg-primary-600 px-6 py-3 font-semibold text-white hover:bg-primary-500 active:scale-95 disabled:opacity-50 shadow-md shadow-primary-500/10"
              >
                {saving ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <Save className="h-4.5 w-4.5" />
                    {isNew ? 'Create Blueprint' : 'Save Changes'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab Contents: questions */}
      {!isNew && activeTab === 'questions' && (
        <div className="grid gap-6 lg:grid-cols-3 items-start">
          {/* Questions Pool list */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Question Pool ({questions.length})</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-400">Total Marks: {exam?.totalMarks || 0}</span>
              </div>
            </div>

            {questions.length === 0 ? (
              <div className="rounded-3xl border border-slate-100 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
                <p className="text-sm text-slate-400 dark:text-slate-550">No questions added yet. Use the tools on the right to add questions.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((q, idx) => {
                  const qAns = answers[q.id] || {};
                  return (
                    <div key={q.id} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-50 dark:border-slate-800">
                        <span className="text-xs font-bold text-slate-400">Question {idx + 1}</span>
                        <div className="flex items-center gap-2">
                          <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-350">
                            {q.difficulty} • {q.marks} Mark(s)
                          </span>
                          <button
                            onClick={() => handleEditQuestionClick(q)}
                            className="p-1 text-slate-450 hover:text-slate-800 dark:hover:text-white"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteQuestion(q.id)}
                            className="p-1 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <h3 className="font-bold text-slate-900 dark:text-white mt-3 leading-relaxed whitespace-pre-line">
                        {q.questionText}
                      </h3>

                      {/* Options */}
                      <div className="mt-4 grid gap-2.5 sm:grid-cols-2 text-xs">
                        {['A', 'B', 'C', 'D'].map(key => {
                          const isCorrect = qAns.correctAnswer === key;
                          return (
                            <div 
                              key={key} 
                              className={`flex items-center gap-3 rounded-xl border p-3
                                ${isCorrect 
                                  ? 'border-emerald-250 bg-emerald-50/20 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/10 dark:text-emerald-400 font-semibold' 
                                  : 'border-slate-100 bg-slate-50/50 text-slate-600 dark:border-slate-800 dark:bg-slate-800/20 dark:text-slate-400'
                                }
                              `}
                            >
                              <span className={`flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold border
                                ${isCorrect 
                                  ? 'bg-emerald-600 border-emerald-600 text-white' 
                                  : 'bg-white border-slate-200 text-slate-400 dark:bg-slate-900 dark:border-slate-700'
                                }
                              `}>
                                {key}
                              </span>
                              <span>{q.options?.[key]}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation */}
                      {qAns.explanation && (
                        <div className="mt-4 rounded-xl bg-slate-50 border border-slate-100 p-3.5 dark:bg-slate-800/40 dark:border-slate-800 text-xs text-slate-550 dark:text-slate-400 leading-relaxed">
                          <strong>Solution:</strong> {qAns.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Question management toolkit Sidebar */}
          <div className="space-y-6">
            {/* Toolbar Selector buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  setShowQForm(true);
                  setEditingQId(null);
                  setShowAIPanel(false);
                  setShowImportPanel(false);
                }}
                className={`rounded-2xl border p-3 flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-semibold
                  ${showQForm && !editingQId
                    ? 'border-primary-500 bg-primary-50/40 text-primary-700 dark:bg-primary-950/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800'
                  }
                `}
              >
                <PlusCircle className="h-5 w-5" />
                <span>Manual</span>
              </button>
              
              <button
                onClick={() => {
                  setShowAIPanel(true);
                  setShowQForm(false);
                  setShowImportPanel(false);
                }}
                className={`rounded-2xl border p-3 flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-semibold
                  ${showAIPanel
                    ? 'border-primary-500 bg-primary-50/40 text-primary-700 dark:bg-primary-950/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800'
                  }
                `}
              >
                <Sparkles className="h-5 w-5 text-purple-550" />
                <span>Gemini AI</span>
              </button>

              <button
                onClick={() => {
                  setShowImportPanel(true);
                  setShowQForm(false);
                  setShowAIPanel(false);
                }}
                className={`rounded-2xl border p-3 flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-semibold
                  ${showImportPanel
                    ? 'border-primary-500 bg-primary-50/40 text-primary-700 dark:bg-primary-950/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800'
                  }
                `}
              >
                <Upload className="h-5 w-5 text-indigo-500" />
                <span>Import File</span>
              </button>
            </div>

            {/* Manual Question Form */}
            {showQForm && (
              <div className="rounded-3xl border border-slate-105 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Edit3 className="h-4 w-4" />
                  {editingQId ? 'Edit Question' : 'Add Question Manually'}
                </h3>

                <form onSubmit={handleSaveQuestion} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-500 mb-1">Question Body</label>
                    <textarea
                      rows={3}
                      value={qForm.questionText}
                      onChange={(e) => setQForm(p => ({ ...p, questionText: e.target.value }))}
                      placeholder="Type the question query..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 outline-none dark:border-slate-800 dark:bg-slate-900"
                    />
                  </div>

                  {['A', 'B', 'C', 'D'].map(key => (
                    <div key={key}>
                      <label className="block font-semibold text-slate-500 mb-1">Option {key}</label>
                      <input
                        type="text"
                        value={(qForm as any)[`option${key}`]}
                        onChange={(e) => setQForm(p => ({ ...p, [`option${key}`]: e.target.value }))}
                        placeholder={`Option ${key} text`}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 outline-none dark:border-slate-800 dark:bg-slate-900"
                      />
                    </div>
                  ))}

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold text-slate-500 mb-1">Correct Answer</label>
                      <select
                        value={qForm.correctAnswer}
                        onChange={(e) => setQForm(p => ({ ...p, correctAnswer: e.target.value as any }))}
                        className="w-full rounded-xl border border-slate-205 bg-slate-50/50 p-2.5 outline-none dark:border-slate-800 dark:bg-slate-900 text-slate-700"
                      >
                        <option value="A">Option A</option>
                        <option value="B">Option B</option>
                        <option value="C">Option C</option>
                        <option value="D">Option D</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-500 mb-1">Difficulty</label>
                      <select
                        value={qForm.difficulty}
                        onChange={(e) => setQForm(p => ({ ...p, difficulty: e.target.value as any }))}
                        className="w-full rounded-xl border border-slate-205 bg-slate-50/50 p-2.5 outline-none dark:border-slate-800 dark:bg-slate-900 text-slate-700"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-500 mb-1">Marks Assigned</label>
                      <input
                        type="number"
                        min={1}
                        value={qForm.marks}
                        onChange={(e) => setQForm(p => ({ ...p, marks: parseInt(e.target.value) || 1 }))}
                        className="w-full rounded-xl border border-slate-205 bg-slate-50/50 p-2.5 outline-none dark:border-slate-800 dark:bg-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-500 mb-1">Explanation / Solution</label>
                    <textarea
                      rows={2}
                      value={qForm.explanation}
                      onChange={(e) => setQForm(p => ({ ...p, explanation: e.target.value }))}
                      placeholder="Explain solution steps..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 outline-none dark:border-slate-800 dark:bg-slate-900"
                    />
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setShowQForm(false)}
                      className="rounded-xl border border-slate-200 px-4 py-2 font-semibold hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 text-slate-550"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2 font-bold text-white hover:bg-primary-500"
                    >
                      {saving ? <LoadingSpinner size="sm" /> : <Save className="h-4 w-4" />}
                      Save Question
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* AI Generator Panel */}
            {showAIPanel && (
              <div className="rounded-3xl border border-slate-105 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Sparkles className="h-4.5 w-4.5 text-purple-550" />
                  Gemini AI Question Generator
                </h3>

                {aiQuestions.length === 0 ? (
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-500 mb-1">Subject Area</label>
                      <input
                        type="text"
                        value={aiForm.subject}
                        onChange={(e) => setAiForm(p => ({ ...p, subject: e.target.value }))}
                        placeholder="e.g. Data Structures"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 outline-none dark:border-slate-800 dark:bg-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-500 mb-1">Topic Name</label>
                      <input
                        type="text"
                        value={aiForm.topic}
                        onChange={(e) => setAiForm(p => ({ ...p, topic: e.target.value }))}
                        placeholder="e.g. AVL Trees"
                        className="w-full rounded-xl border border-slate-205 bg-slate-50/50 p-2.5 outline-none dark:border-slate-800 dark:bg-slate-900"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-semibold text-slate-500 mb-1">Difficulty</label>
                        <select
                          value={aiForm.difficulty}
                          onChange={(e) => setAiForm(p => ({ ...p, difficulty: e.target.value as any }))}
                          className="w-full rounded-xl border border-slate-205 bg-slate-50/50 p-2.5 outline-none dark:border-slate-800 dark:bg-slate-900 text-slate-700"
                        >
                          <option value="easy">Easy</option>
                          <option value="medium">Medium</option>
                          <option value="hard">Hard</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-500 mb-1">Count</label>
                        <input
                          type="number"
                          min={1}
                          max={20}
                          value={aiForm.count}
                          onChange={(e) => setAiForm(p => ({ ...p, count: parseInt(e.target.value) || 10 }))}
                          className="w-full rounded-xl border border-slate-205 bg-slate-50/50 p-2.5 outline-none dark:border-slate-800 dark:bg-slate-900"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleGenerateAI}
                      disabled={aiGenerating}
                      className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-purple-600 py-3 font-semibold text-white hover:bg-purple-500 transition-colors shadow-lg shadow-purple-500/10"
                    >
                      {aiGenerating ? (
                        <>
                          <LoadingSpinner size="sm" />
                          <span>Generating from Gemini...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4.5 w-4.5" />
                          <span>Generate MCQs</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  // Preview generated questions
                  <div className="space-y-4 text-xs max-h-[80vh] overflow-y-auto pr-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-500">Preview AI MCQs</span>
                      <button
                        onClick={() => setAiQuestions([])}
                        className="text-xs text-primary-600 font-semibold"
                      >
                        Reset / Re-run
                      </button>
                    </div>

                    {aiQuestions.map((q, idx) => {
                      const isSelected = !!selectedAIIndices[idx];
                      return (
                        <div 
                          key={idx} 
                          className={`rounded-2xl border p-4.5 space-y-3 transition-colors
                            ${isSelected 
                              ? 'border-purple-200 bg-purple-50/10 dark:border-purple-900/40 dark:bg-purple-950/5' 
                              : 'border-slate-100 bg-slate-50/50 dark:border-slate-800'
                            }
                          `}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <button
                              onClick={() => handleToggleAISelect(idx)}
                              className={`h-5 w-5 rounded-lg border flex items-center justify-center transition-colors
                                ${isSelected 
                                  ? 'bg-purple-600 border-purple-600 text-white' 
                                  : 'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800'
                                }
                              `}
                            >
                              {isSelected && <Check className="h-3.5 w-3.5" />}
                            </button>
                            <span className="text-[10px] font-semibold text-slate-400">MCQ #{idx + 1}</span>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-450 uppercase mb-0.5">Question Body</label>
                            <textarea
                              rows={2}
                              value={q.questionText}
                              onChange={(e) => handleEditAIQuestion(idx, 'questionText', e.target.value)}
                              className="w-full rounded-lg border border-slate-200 bg-white p-2 outline-none dark:border-slate-850 dark:bg-slate-900"
                            />
                          </div>

                          {/* Options */}
                          <div className="space-y-1.5">
                            {['A', 'B', 'C', 'D'].map(k => (
                              <div key={k} className="flex gap-2 items-center">
                                <span className="font-semibold text-slate-400">{k}:</span>
                                <input
                                  type="text"
                                  value={q.options?.[k] || ''}
                                  onChange={(e) => handleEditAIQuestion(idx, `option${k}`, e.target.value)}
                                  className="w-full rounded-lg border border-slate-205 bg-white p-1.5 outline-none dark:border-slate-850 dark:bg-slate-900"
                                />
                              </div>
                            ))}
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-450 uppercase mb-0.5">Correct Answer</label>
                              <select
                                value={q.correctAnswer}
                                onChange={(e) => handleEditAIQuestion(idx, 'correctAnswer', e.target.value)}
                                className="w-full rounded-lg border border-slate-200 bg-white p-1.5 outline-none dark:border-slate-850 dark:bg-slate-900"
                              >
                                <option value="A">A</option>
                                <option value="B">B</option>
                                <option value="C">C</option>
                                <option value="D">D</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-450 uppercase mb-0.5">Marks</label>
                              <input
                                type="number"
                                value={q.marks || 2}
                                onChange={(e) => handleEditAIQuestion(idx, 'marks', parseInt(e.target.value) || 2)}
                                className="w-full rounded-lg border border-slate-200 bg-white p-1.5 outline-none dark:border-slate-850 dark:bg-slate-900"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-450 uppercase mb-0.5">Explanation</label>
                            <textarea
                              rows={2}
                              value={q.explanation || ''}
                              onChange={(e) => handleEditAIQuestion(idx, 'explanation', e.target.value)}
                              className="w-full rounded-lg border border-slate-200 bg-white p-2 outline-none dark:border-slate-850 dark:bg-slate-900"
                            />
                          </div>
                        </div>
                      );
                    })}

                    <button
                      onClick={handleSaveAIQuestions}
                      disabled={saving}
                      className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-purple-600 py-3 font-semibold text-white hover:bg-purple-500"
                    >
                      {saving ? <LoadingSpinner size="sm" /> : <Save className="h-4.5 w-4.5" />}
                      <span>Add Selected to Exam</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Import Panel */}
            {showImportPanel && (
              <div className="rounded-3xl border border-slate-105 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Upload className="h-4.5 w-4.5 text-indigo-500" />
                  Import Questions Pool
                </h3>
                
                <div className="text-xs space-y-3.5">
                  <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center cursor-pointer hover:border-slate-400 transition-colors relative">
                    <input
                      type="file"
                      accept=".csv,.json"
                      onChange={handleFileUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <FileSpreadsheet className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                    <p className="font-semibold text-slate-700 dark:text-slate-350">Click to upload JSON or CSV file</p>
                    <p className="text-[10px] text-slate-400 mt-1">Accepts CSV template or standard MCQ arrays</p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/40 p-4 border border-slate-100 dark:border-slate-800 text-[10px] space-y-2">
                    <p className="font-bold text-slate-700 dark:text-slate-300">File Formats Required:</p>
                    <p className="font-semibold">JSON Format Array:</p>
                    <pre className="bg-slate-100 dark:bg-slate-900 p-2 rounded text-[9px] overflow-x-auto text-slate-600 dark:text-slate-400">
{`[
  {
    "questionText": "What is 2+2?",
    "options": {
      "A": "3", "B": "4", "C": "5", "D": "6"
    },
    "correctAnswer": "B",
    "explanation": "Simple arithmetic.",
    "difficulty": "easy",
    "marks": 1
  }
]`}
                    </pre>
                    <p className="font-semibold mt-2">CSV Column Order (No Headers):</p>
                    <p className="font-mono bg-slate-105 dark:bg-slate-900 p-1.5 rounded text-[8px] text-slate-600 dark:text-slate-400">
                      questionText, optionA, optionB, optionC, optionD, correctAnswer, explanation, difficulty, marks
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
