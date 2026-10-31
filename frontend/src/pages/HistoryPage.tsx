import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { interviewsApi } from '../api/interviews';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Alert } from '../components/Alert';
import { Badge } from '../components/Badge';
import {
  Calendar,
  Trash2,
  ExternalLink,
  Play,
  Search,
  Filter,
  PlusCircle,
  AlertTriangle,
} from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [roleSearch, setRoleSearch] = useState<string>('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['interviews-history', statusFilter, roleSearch],
    queryFn: () =>
      interviewsApi.list({
        limit: 50,
        status: statusFilter || undefined,
        role: roleSearch || undefined,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => interviewsApi.delete(id),
    onSuccess: () => {
      setDeleteConfirmId(null);
      queryClient.invalidateQueries({ queryKey: ['interviews-history'] });
      queryClient.invalidateQueries({ queryKey: ['recent-interviews'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-summary'] });
    },
    onError: (err: any) => {
      setActionError(err.message || 'Failed to delete interview');
    },
  });

  if (isLoading) {
    return <LoadingSpinner message="Loading your interview history..." size="lg" />;
  }

  const interviews = data?.items || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Interview History
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review past practice sessions, inspect scores, and continue drafts.
          </p>
        </div>
        <Link
          to="/interviews/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs"
        >
          <PlusCircle className="w-4 h-4" /> New Interview
        </Link>
      </div>

      {actionError && (
        <Alert type="error" message={actionError} onClose={() => setActionError(null)} />
      )}

      {/* Filter and Search Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={roleSearch}
            onChange={(e) => setRoleSearch(e.target.value)}
            placeholder="Filter by role (e.g. Python, Backend)..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-2 px-3 text-xs rounded-xl border border-slate-300 bg-white font-medium text-slate-700 outline-none focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="in_progress">In Progress</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Interview Table / Cards */}
      {interviews.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100">
          {interviews.map((item) => {
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
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm">{item.title}</h3>
                    <Badge variant={statusVariant}>{item.status.replace('_', ' ')}</Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="font-medium text-slate-700">{item.target_role}</span>
                    <span>&bull;</span>
                    <span>{item.experience_level}</span>
                    <span>&bull;</span>
                    <span>{item.difficulty}</span>
                    <span>&bull;</span>
                    <span>{item.question_count} questions</span>
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
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-semibold">
                        Score
                      </span>
                      <span className="text-base font-extrabold text-blue-600">
                        {item.overall_score} <span className="text-xs text-slate-400">/ 10</span>
                      </span>
                    </div>
                  ) : null}

                  {item.status === 'completed' ? (
                    <Link
                      to={`/interviews/${item.id}/report`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View Report
                    </Link>
                  ) : item.status === 'in_progress' ? (
                    <Link
                      to={`/interviews/${item.id}/session`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-colors"
                    >
                      <Play className="w-3.5 h-3.5" />
                      Continue
                    </Link>
                  ) : (
                    <span className="text-xs text-slate-400">Pending</span>
                  )}

                  <button
                    onClick={() => setDeleteConfirmId(item.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete interview session"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 text-center py-16 px-4 shadow-xs">
          <p className="text-sm font-bold text-slate-700">No interviews match your filters</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria or create a fresh interview session.
          </p>
          <Link
            to="/interviews/new"
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
          >
            <PlusCircle className="w-3.5 h-3.5" /> New Interview
          </Link>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-bold text-slate-900 text-base">Delete Interview Session?</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              This will permanently delete this interview session, all submitted answers, and generated evaluations. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(deleteConfirmId)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
