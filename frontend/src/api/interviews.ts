import { apiRequest } from './client';
import {
  Interview,
  InterviewDetail,
  InterviewListResponse,
  InterviewReport,
} from '../types';

export interface CreateInterviewPayload {
  target_role: string;
  experience_level: string;
  difficulty: string;
  focus_topics: string[];
  question_count: number;
  job_description?: string;
}

export const interviewsApi = {
  async create(payload: CreateInterviewPayload): Promise<InterviewDetail> {
    return apiRequest<InterviewDetail>('/interviews', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async list(params?: {
    limit?: number;
    offset?: number;
    status?: string;
    role?: string;
  }): Promise<InterviewListResponse> {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));
    if (params?.status) query.set('status', params.status);
    if (params?.role) query.set('role', params.role);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return apiRequest<InterviewListResponse>(`/interviews${qs}`);
  },

  async get(id: string): Promise<InterviewDetail> {
    return apiRequest<InterviewDetail>(`/interviews/${id}`);
  },

  async updateTitle(id: string, title: string): Promise<Interview> {
    return apiRequest<Interview>(`/interviews/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ title }),
    });
  },

  async delete(id: string): Promise<void> {
    return apiRequest<void>(`/interviews/${id}`, {
      method: 'DELETE',
    });
  },

  async saveDraft(interviewId: string, questionId: string, answerText: string) {
    return apiRequest(`/interviews/${interviewId}/questions/${questionId}/answer`, {
      method: 'PUT',
      body: JSON.stringify({ answer_text: answerText }),
    });
  },

  async submitAnswer(interviewId: string, questionId: string, answerText: string) {
    return apiRequest(`/interviews/${interviewId}/questions/${questionId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answer_text: answerText }),
    });
  },

  async evaluate(interviewId: string): Promise<InterviewReport> {
    return apiRequest<InterviewReport>(`/interviews/${interviewId}/evaluate`, {
      method: 'POST',
    });
  },

  async getReport(interviewId: string): Promise<InterviewReport> {
    return apiRequest<InterviewReport>(`/interviews/${interviewId}/report`);
  },
};
