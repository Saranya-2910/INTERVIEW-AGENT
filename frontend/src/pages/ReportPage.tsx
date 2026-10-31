import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { interviewsApi } from '../api/interviews';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Alert } from '../components/Alert';
import { Badge } from '../components/Badge';
import {
  Award,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Info,
  Calendar,
  PlusCircle,
} from 'lucide-react';

export const ReportPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});

  const { data: report, isLoading, error } = useQuery({
    queryKey: ['interview-report', id],
    queryFn: () => interviewsApi.getReport(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return <LoadingSpinner message="Retrieving your interview evaluation report..." size="lg" />;
  }

  if (error || !report) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4">
        <Alert
          type="error"
          title="Report Not Available"
          message="Could not load the evaluation report for this interview. It may still be in progress or pending evaluation."
        />
        <div className="mt-4">
          <Link
            to="/history"
            className="text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            &larr; Return to Interview History
          </Link>
        </div>
      </div>
    );
  }

  const toggleQuestion = (qId: string) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  };

  const recColor = {
    'Ready to practise harder questions': 'bg-emerald-500 text-white',
    'Keep strengthening fundamentals': 'bg-blue-600 text-white',
    'Review these topics and retry': 'bg-amber-600 text-white',
  }[report.recommendation_label] || 'bg-slate-700 text-white';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Overall Score & Recommendation Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-10 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${recColor}`}>
                {report.recommendation_label}
              </span>
              <Badge variant="blue">{report.target_role}</Badge>
              <Badge variant="purple">{report.experience_level}</Badge>
              <Badge variant="amber">{report.difficulty}</Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold">{report.title}</h1>
            <p className="text-slate-400 text-xs flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" />
              Completed on {new Date(report.created_at).toLocaleDateString()}
            </p>
          </div>

          <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 text-center min-w-[150px] shrink-0">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block">
              Overall Score
            </span>
            <div className="mt-1 flex items-baseline justify-center gap-1">
              <span className="text-4xl sm:text-5xl font-black text-blue-400">
                {report.overall_score ?? '—'}
              </span>
              <span className="text-sm font-semibold text-slate-400">/ 10</span>
            </div>
          </div>
        </div>

        {/* Recommendation Reason */}
        <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <strong className="text-white">Guidance: </strong>
          {report.recommendation_reason}
        </div>
      </div>

      {/* Practice Plan & Key Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recommended Practice Plan */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            Targeted Next Practice Plan
          </h2>
          <ul className="space-y-2.5">
            {report.practice_plan.map((step, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Strengths & Missing Points Summary */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-600" />
            Strengths & Priority Revisions
          </h2>
          
          <div className="space-y-3">
            <div>
              <span className="text-xs font-bold text-emerald-700 block mb-1">Key Strengths:</span>
              <div className="flex flex-wrap gap-1.5">
                {report.summary_strengths.length > 0 ? (
                  report.summary_strengths.map((str, i) => (
                    <Badge key={i} variant="green">
                      {str}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">Answer more questions to highlight strengths.</span>
                )}
              </div>
            </div>

            <div>
              <span className="text-xs font-bold text-amber-700 block mb-1">Topics to Revise:</span>
              <div className="flex flex-wrap gap-1.5">
                {report.recommended_revision_topics.length > 0 ? (
                  report.recommended_revision_topics.map((rev, i) => (
                    <Badge key={i} variant="amber">
                      {rev}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">Solid coverage across evaluated topics.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Topic Score Breakdown */}
      {report.topic_breakdown.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-600" />
            Topic Performance Breakdown
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {report.topic_breakdown.map((tb, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-800">{tb.topic}</span>
                  <span className="text-slate-400">{tb.question_count} questions</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, (tb.average_score / 10) * 100)}%` }}
                      className="bg-blue-600 h-2 rounded-full"
                    />
                  </div>
                  <span className="text-xs font-extrabold text-slate-800 shrink-0">
                    {tb.average_score} / 10
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Question-by-Question Deep Dive */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Question Evaluation Breakdown</h2>
        <p className="text-xs text-slate-500">
          Review your submitted answers alongside benchmark reference answers and rubric dimensions.
        </p>

        <div className="space-y-4 mt-4">
          {report.questions.map((q, idx) => {
            const isExpanded = expandedQuestions[q.question_id] !== false; // expanded by default
            const ev = q.evaluation;

            return (
              <div
                key={q.question_id}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs transition-all"
              >
                {/* Accordion Header */}
                <button
                  type="button"
                  onClick={() => toggleQuestion(q.question_id)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        Q{idx + 1}
                      </span>
                      <Badge variant="purple">{q.topic}</Badge>
                      <Badge variant="slate">{q.difficulty}</Badge>
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm mt-1 sm:text-base">
                      {q.question_text}
                    </h3>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    {ev ? (
                      <div className="text-right">
                        <span className="text-xs text-slate-400 block">Score</span>
                        <span className="text-base font-extrabold text-blue-600">
                          {ev.total_score} <span className="text-xs text-slate-400">/ 10</span>
                        </span>
                      </div>
                    ) : (
                      <Badge variant="amber">Not evaluated</Badge>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Accordion Body */}
                {isExpanded && ev && (
                  <div className="p-5 pt-0 border-t border-slate-100 space-y-5 text-xs sm:text-sm">
                    {/* Rubric Dimension Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4">
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
                        <span className="text-[11px] font-semibold text-slate-500 block">Correctness</span>
                        <span className="text-base font-bold text-slate-800">{ev.technical_correctness} / 4</span>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
                        <span className="text-[11px] font-semibold text-slate-500 block">Completeness</span>
                        <span className="text-base font-bold text-slate-800">{ev.completeness} / 2</span>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
                        <span className="text-[11px] font-semibold text-slate-500 block">Reasoning</span>
                        <span className="text-base font-bold text-slate-800">{ev.reasoning} / 2</span>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
                        <span className="text-[11px] font-semibold text-slate-500 block">Clarity</span>
                        <span className="text-base font-bold text-slate-800">{ev.relevance_clarity} / 2</span>
                      </div>
                    </div>

                    {/* Candidate Answer */}
                    <div className="space-y-1">
                      <span className="font-bold text-slate-700 text-xs uppercase tracking-wider block">
                        Your Submitted Answer
                      </span>
                      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 whitespace-pre-wrap leading-relaxed text-xs">
                        {q.answer_text ? q.answer_text : <em className="text-slate-400">No answer submitted (unanswered).</em>}
                      </div>
                    </div>

                    {/* Feedback Highlights */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1.5">
                        <span className="font-bold text-emerald-800 text-xs flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> What Was Good
                        </span>
                        <ul className="list-disc list-inside space-y-1 text-emerald-900 text-xs">
                          {ev.strengths.map((s, idx) => (
                            <li key={idx}>{s}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-xl space-y-1.5">
                        <span className="font-bold text-amber-800 text-xs flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5" /> Missing Points / Edge Cases
                        </span>
                        <ul className="list-disc list-inside space-y-1 text-amber-900 text-xs">
                          {ev.missing_points.map((m, idx) => (
                            <li key={idx}>{m}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Concrete Improvement Suggestion */}
                    <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl text-xs space-y-1">
                      <span className="font-bold text-blue-900 flex items-center gap-1.5">
                        <Lightbulb className="w-3.5 h-3.5 text-blue-600" /> Actionable Improvement Tip
                      </span>
                      <p className="text-blue-900 leading-relaxed">{ev.improvement_suggestion}</p>
                    </div>

                    {/* Model Benchmark Answer */}
                    {ev.example_answer && (
                      <div className="space-y-1">
                        <span className="font-bold text-slate-700 text-xs uppercase tracking-wider block">
                          Model Answer Guidance
                        </span>
                        <div className="p-3.5 bg-slate-900 text-slate-200 rounded-xl whitespace-pre-wrap leading-relaxed text-xs">
                          {ev.example_answer}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Disclaimer Box */}
      <div className="p-4 bg-slate-100 border border-slate-200 rounded-2xl flex items-start gap-3 text-xs text-slate-600">
        <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <p>{report.disclaimer}</p>
      </div>

      {/* Bottom Action Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
        <Link
          to="/dashboard"
          className="text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          &larr; Back to Dashboard
        </Link>
        <Link
          to="/interviews/new"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all hover:scale-105"
        >
          <PlusCircle className="w-4 h-4" />
          Practice Another Interview
        </Link>
      </div>
    </div>
  );
};
