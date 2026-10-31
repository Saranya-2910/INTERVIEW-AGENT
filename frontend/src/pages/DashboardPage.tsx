import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../api/analytics';
import { interviewsApi } from '../api/interviews';
import { useAuth } from '../context/AuthContext';
import { StatCard } from '../components/StatCard';
import { Badge } from '../components/Badge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import {
  CheckCircle,
  Clock,
  Award,
  Sparkles,
  TrendingUp,
  PlusCircle,
  ArrowRight,
  BookOpen,
  Calendar,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  const { data: summary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['analytics-summary'],
    queryFn: () => analyticsApi.getSummary(),
  });

  const { data: progress, isLoading: isProgressLoading } = useQuery({
    queryKey: ['analytics-progress'],
    queryFn: () => analyticsApi.getProgress(),
  });

  const { data: interviewsData, isLoading: isInterviewsLoading } = useQuery({
    queryKey: ['recent-interviews'],
    queryFn: () => interviewsApi.list({ limit: 5 }),
  });

  const isLoading = isSummaryLoading || isProgressLoading || isInterviewsLoading;

  if (isLoading) {
    return <LoadingSpinner message="Loading your dashboard analytics..." size="lg" />;
  }

  const recentList = interviewsData?.items || [];
  const progressPoints = progress?.points || [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome & Action Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <span className="text-blue-200 text-xs font-semibold tracking-wider uppercase block">
            Practice Dashboard
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
            Hello, {user?.name || 'Candidate'}!
          </h1>
          <p className="text-blue-100 text-sm mt-1 max-w-xl">
            Track your technical interview mastery, target revision topics, and hone your engineering communication.
          </p>
        </div>
        <Link
          to="/interviews/new"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-blue-700 font-bold text-sm shadow-md hover:bg-blue-50 transition-all hover:scale-105 shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          Start New Interview
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Completed Interviews"
          value={summary?.completed_interviews || 0}
          subtitle={`Out of ${summary?.total_interviews || 0} total sessions`}
          icon={<CheckCircle className="w-5 h-5 text-emerald-600" />}
        />
        <StatCard
          title="Average Score"
          value={summary?.average_score != null ? `${summary.average_score} / 10` : '—'}
          subtitle="Calculated on 0-10 rubric"
          icon={<Award className="w-5 h-5 text-blue-600" />}
        />
        <StatCard
          title="Latest Score"
          value={summary?.latest_score != null ? `${summary.latest_score} / 10` : '—'}
          subtitle="Most recently evaluated"
          icon={<TrendingUp className="w-5 h-5 text-indigo-600" />}
        />
        <StatCard
          title="In Progress"
          value={summary?.in_progress_interviews || 0}
          subtitle="Waiting for answer completion"
          icon={<Clock className="w-5 h-5 text-amber-600" />}
        />
      </div>

      {/* Progress Chart & Revision Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score Progression Trend */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Performance Over Time</h2>
              <p className="text-xs text-slate-500">Dated scores from completed practice sessions</p>
            </div>
          </div>

          {progressPoints.length >= 2 ? (
            <div className="h-64 flex flex-col justify-end pt-6">
              <div className="flex items-end justify-between gap-2 h-44 border-b border-slate-200 pb-2 px-2">
                {progressPoints.map((pt, i) => {
                  const heightPercent = Math.max(10, Math.min(100, (pt.score / 10) * 100));
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative">
                      {/* Tooltip */}
                      <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[11px] font-semibold py-1 px-2 rounded pointer-events-none whitespace-nowrap z-10">
                        {pt.title}: {pt.score}/10
                      </div>
                      <span className="text-xs font-bold text-blue-600">{pt.score}</span>
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full max-w-[48px] bg-gradient-to-t from-blue-600 to-indigo-500 rounded-t-lg transition-all group-hover:brightness-110"
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 mt-2 px-2">
                <span>Earliest Session</span>
                <span>Latest Session</span>
              </div>
            </div>
          ) : (
            <div className="h-56 flex flex-col items-center justify-center text-center p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <Sparkles className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-700">Not enough data for chart</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Complete at least 2 interview sessions to see your score progression timeline.
              </p>
            </div>
          )}
        </div>

        {/* Most Practiced & Recommended Revision */}
        <div className="space-y-6">
          {/* Top Practiced Topics */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              Most Practiced Topics
            </h3>
            {summary?.most_practiced_topics && summary.most_practiced_topics.length > 0 ? (
              <ul className="space-y-2.5">
                {summary.most_practiced_topics.map((t, idx) => (
                  <li key={idx} className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{t.topic}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">{t.practice_count} questions</span>
                      {t.average_score != null && (
                        <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                          {t.average_score}/10
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-400">No topic data recorded yet.</p>
            )}
          </div>

          {/* Key Revision Areas */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-2">Focus Areas to Revise</h3>
            {summary?.top_revision_topics && summary.top_revision_topics.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {summary.top_revision_topics.map((item, idx) => (
                  <Badge key={idx} variant="amber">
                    {item}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">Complete an interview to reveal topics to strengthen.</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Interviews List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Recent Interview Sessions</h2>
            <p className="text-xs text-slate-500">Your latest practice sessions and evaluation status</p>
          </div>
          <Link
            to="/history"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentList.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {recentList.map((item) => {
              const statusVariant = {
                completed: 'green',
                in_progress: 'blue',
                generating: 'amber',
                failed: 'red',
                draft: 'slate',
                evaluating: 'purple',
              }[item.status] as any;

              return (
                <div
                  key={item.id}
                  className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm">{item.title}</h4>
                      <Badge variant={statusVariant}>{item.status.replace('_', ' ')}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>{item.target_role}</span>
                      <span>&bull;</span>
                      <span>{item.experience_level}</span>
                      <span>&bull;</span>
                      <span>{item.difficulty}</span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    {item.overall_score != null ? (
                      <div className="text-right">
                        <span className="text-xs text-slate-400 block">Score</span>
                        <span className="text-lg font-extrabold text-blue-600">
                          {item.overall_score} <span className="text-xs text-slate-400">/ 10</span>
                        </span>
                      </div>
                    ) : null}

                    {item.status === 'completed' ? (
                      <Link
                        to={`/interviews/${item.id}/report`}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                      >
                        View Report
                      </Link>
                    ) : item.status === 'in_progress' ? (
                      <Link
                        to={`/interviews/${item.id}/session`}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-colors"
                      >
                        Continue
                      </Link>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium">
                        {item.status === 'evaluating' ? 'Grading...' : 'Pending'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 px-4">
            <Sparkles className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">No interviews completed yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Configure your first role-specific session and test your technical knowledge.
            </p>
            <Link
              to="/interviews/new"
              className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs"
            >
              <PlusCircle className="w-4 h-4" /> Start Interview
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
