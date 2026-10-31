import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { interviewsApi } from '../api/interviews';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Alert } from '../components/Alert';
import { Badge } from '../components/Badge';
import {
  ChevronLeft,
  ChevronRight,
  Save,
  Send,
  Sparkles,
  CheckCircle,
  Code,
  Check,
} from 'lucide-react';

export const InterviewSessionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [currentAnswer, setCurrentAnswer] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);

  const { data: interview, isLoading, error } = useQuery({
    queryKey: ['interview-session', id],
    queryFn: () => interviewsApi.get(id!),
    enabled: !!id,
  });

  const questions = interview?.questions || [];
  const currentQuestion = questions[currentIndex];

  // Sync editor text when switching questions
  useEffect(() => {
    if (currentQuestion) {
      setCurrentAnswer(currentQuestion.answer_text || '');
      setSaveStatus(null);
      setActionError(null);
    }
  }, [currentIndex, currentQuestion]);

  // If already completed, redirect to report
  useEffect(() => {
    if (interview && interview.status === 'completed') {
      navigate(`/interviews/${id}/report`, { replace: true });
    }
  }, [interview, id, navigate]);

  // Save Draft Mutation
  const saveDraftMutation = useMutation({
    mutationFn: async () => {
      if (!currentQuestion) return;
      return interviewsApi.saveDraft(id!, currentQuestion.id, currentAnswer);
    },
    onSuccess: () => {
      setSaveStatus('Draft saved');
      queryClient.invalidateQueries({ queryKey: ['interview-session', id] });
      setTimeout(() => setSaveStatus(null), 3000);
    },
    onError: (err: any) => {
      setActionError(err.message || 'Failed to save draft');
    },
  });

  // Submit Answer Mutation
  const submitAnswerMutation = useMutation({
    mutationFn: async () => {
      if (!currentQuestion) return;
      return interviewsApi.submitAnswer(id!, currentQuestion.id, currentAnswer);
    },
    onSuccess: () => {
      setSaveStatus('Answer submitted');
      queryClient.invalidateQueries({ queryKey: ['interview-session', id] });
      setTimeout(() => setSaveStatus(null), 3000);
    },
    onError: (err: any) => {
      setActionError(err.message || 'Failed to submit answer');
    },
  });

  // Evaluate Interview Mutation
  const evaluateMutation = useMutation({
    mutationFn: async () => {
      setIsEvaluating(true);
      return interviewsApi.evaluate(id!);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interview-session', id] });
      navigate(`/interviews/${id}/report`);
    },
    onError: (err: any) => {
      setIsEvaluating(false);
      setActionError(err.message || 'Evaluation failed. Please try again.');
    },
  });

  if (isLoading) {
    return <LoadingSpinner message="Loading interview questions..." size="lg" />;
  }

  if (error || !interview) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4">
        <Alert
          type="error"
          title="Interview Unavailable"
          message="Could not load the requested interview session. Please check your connection or return to history."
        />
      </div>
    );
  }

  const answeredCount = questions.filter(
    (q) => q.answer_status === 'submitted' || (q.answer_text && q.answer_text.trim().length > 0)
  ).length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
      {/* Evaluation In-Progress Overlay */}
      {isEvaluating && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto animate-pulse">
              <Sparkles className="w-8 h-8 animate-spin" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Evaluating Your Responses</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Gemini AI is assessing your answers against the 0-10 technical rubric across correctness, completeness, reasoning, and clarity.
            </p>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div className="bg-blue-600 h-2 rounded-full animate-indeterminate" />
            </div>
          </div>
        </div>
      )}

      {/* Top Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">{interview.title}</h1>
            <Badge variant="blue">{interview.experience_level}</Badge>
            <Badge variant="amber">{interview.difficulty}</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Role: <strong className="text-slate-700">{interview.target_role}</strong> &bull; Total Questions: {questions.length}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="text-xs text-right">
            <span className="text-slate-400 block">Progress</span>
            <span className="font-bold text-slate-700">
              {answeredCount} of {questions.length} Addressed
            </span>
          </div>

          <button
            onClick={() => evaluateMutation.mutate()}
            disabled={isEvaluating}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            Finish & Evaluate
          </button>
        </div>
      </div>

      {actionError && (
        <div className="mb-4">
          <Alert type="error" message={actionError} onClose={() => setActionError(null)} />
        </div>
      )}

      {/* Question Navigation Quick-Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6">
        {questions.map((q, idx) => {
          const isCurrent = idx === currentIndex;
          const isSubmitted = q.answer_status === 'submitted';
          const isDraft = q.answer_status === 'draft' || (q.answer_text && q.answer_text.length > 0);

          return (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(idx)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 ${
                isCurrent
                  ? 'bg-blue-600 text-white shadow-xs'
                  : isSubmitted
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : isDraft
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>Q{idx + 1}</span>
              {isSubmitted ? (
                <Check className="w-3.5 h-3.5" />
              ) : isDraft ? (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Main Question & Answer Card */}
      {currentQuestion && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          {/* Question Metadata */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <Badge variant="purple">{currentQuestion.topic}</Badge>
              <Badge variant="slate">{currentQuestion.question_type}</Badge>
            </div>

            {currentQuestion.answer_status === 'submitted' && (
              <Badge variant="green">
                <CheckCircle className="w-3.5 h-3.5" /> Submitted
              </Badge>
            )}
          </div>

          {/* Question Prompt */}
          <div className="space-y-2">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
              {currentQuestion.question_text}
            </h2>
          </div>

          {/* Answer Editor Area */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-blue-600" />
                Your Technical Answer
              </label>
              <div className="flex items-center gap-3">
                {saveStatus && (
                  <span className="text-xs font-semibold text-emerald-600 animate-fade-in flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> {saveStatus}
                  </span>
                )}
                <span className="text-xs text-slate-400">
                  {currentAnswer.length} / 10,000 characters
                </span>
              </div>
            </div>

            <textarea
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              rows={10}
              maxLength={10000}
              placeholder="Structure your answer clearly:
1. Direct explanation / core definition
2. Mechanism / how it works
3. Key trade-offs, constraints, and failure modes
4. Practical example or edge cases"
              className="w-full p-4 rounded-2xl border border-slate-300 font-sans text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-y leading-relaxed"
            />
          </div>

          {/* Action Buttons for Current Question */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => saveDraftMutation.mutate()}
                disabled={saveDraftMutation.isPending}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                Save Draft
              </button>

              <button
                type="button"
                onClick={() => submitAnswerMutation.mutate()}
                disabled={submitAnswerMutation.isPending}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                Submit Answer
              </button>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold disabled:opacity-40 transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>

              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                disabled={currentIndex === questions.length - 1}
                className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold disabled:opacity-40 transition-colors flex items-center gap-1"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
