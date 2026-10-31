import { apiRequest } from './client';
import {
  AnalyticsSummary,
  TopicAnalyticsResponse,
  ProgressAnalyticsResponse,
} from '../types';

export const analyticsApi = {
  async getSummary(): Promise<AnalyticsSummary> {
    return apiRequest<AnalyticsSummary>('/analytics/summary');
  },

  async getTopics(): Promise<TopicAnalyticsResponse> {
    return apiRequest<TopicAnalyticsResponse>('/analytics/topics');
  },

  async getProgress(): Promise<ProgressAnalyticsResponse> {
    return apiRequest<ProgressAnalyticsResponse>('/analytics/progress');
  },
};
