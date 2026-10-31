export interface User {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Question {
  id: string;
  interview_id: string;
  position: number;
  question_text: string;
  question_type: string;
  topic: string;
  difficulty: string;
  created_at: string;
  answer_text?: string;
  answer_status?: string;
  submitted_at?: string;
}

export interface Interview {
  id: string;
  user_id: string;
  title: string;
  target_role: string;
  experience_level: string;
  difficulty: string;
  focus_topics: string[];
  question_count: number;
  status: 'draft' | 'generating' | 'in_progress' | 'evaluating' | 'completed' | 'failed';
  overall_score?: number | null;
  error_code?: string | null;
  created_at: string;
  started_at?: string | null;
  completed_at?: string | null;
  updated_at: string;
}

export interface InterviewDetail extends Interview {
  questions: Question[];
}

export interface InterviewListResponse {
  items: Interview[];
  total: number;
  limit: number;
  offset: number;
}

export interface Evaluation {
  id: string;
  answer_id: string;
  technical_correctness: number;
  completeness: number;
  reasoning: number;
  relevance_clarity: number;
  total_score: number;
  strengths: string[];
  missing_points: string[];
  improvement_suggestion: string;
  revision_topics: string[];
  example_answer?: string | null;
  rubric_version: string;
  model_name: string;
  created_at: string;
}

export interface QuestionReportItem {
  question_id: string;
  position: number;
  question_text: string;
  topic: string;
  difficulty: string;
  question_type: string;
  reference_answer?: string | null;
  answer_text?: string;
  answer_status: string;
  evaluation?: Evaluation | null;
}

export interface TopicScoreItem {
  topic: string;
  average_score: number;
  question_count: number;
}

export interface InterviewReport {
  interview_id: string;
  title: string;
  target_role: string;
  experience_level: string;
  difficulty: string;
  status: string;
  overall_score?: number | null;
  created_at: string;
  completed_at?: string | null;
  recommendation_label: string;
  recommendation_reason: string;
  disclaimer: string;
  summary_strengths: string[];
  summary_improvement_areas: string[];
  recommended_revision_topics: string[];
  practice_plan: string[];
  topic_breakdown: TopicScoreItem[];
  questions: QuestionReportItem[];
}

export interface TopicMetric {
  topic: string;
  practice_count: number;
  average_score?: number | null;
}

export interface ProgressDataPoint {
  interview_id: string;
  title: string;
  target_role: string;
  date: string;
  score: number;
}

export interface AnalyticsSummary {
  total_interviews: number;
  completed_interviews: number;
  in_progress_interviews: number;
  average_score?: number | null;
  latest_score?: number | null;
  top_strengths: string[];
  top_revision_topics: string[];
  most_practiced_topics: TopicMetric[];
}

export interface TopicAnalyticsResponse {
  topics: TopicMetric[];
}

export interface ProgressAnalyticsResponse {
  points: ProgressDataPoint[];
}
