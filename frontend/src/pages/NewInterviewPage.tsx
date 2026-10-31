import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { interviewsApi } from '../api/interviews';
import { Alert } from '../components/Alert';
import {
  Sparkles,
  ArrowRight,
  Briefcase,
  Layers,
  Flame,
  FileText,
  Sliders,
  Plus,
  Check,
} from 'lucide-react';

const PRESET_ROLES = [
  'Python Developer',
  'Backend Developer',
  'Full-Stack Developer',
  'Data Analyst',
  'Data Scientist',
  'Machine Learning Engineer',
];

const PREDEFINED_TOPICS = [
  'Python Core',
  'FastAPI & APIs',
  'SQL & DBMS',
  'Data Structures & Algorithms',
  'System Design',
  'Concurrency & AsyncIO',
  'Object-Oriented Design',
  'Machine Learning Fundamentals',
  'Docker & Containerization',
  'Testing & CI/CD',
];

const newInterviewSchema = z.object({
  target_role: z.string().min(2, 'Role must be at least 2 characters'),
  experience_level: z.string().min(1, 'Please select experience level'),
  difficulty: z.string().min(1, 'Please select difficulty'),
  question_count: z.number().min(3, 'Minimum 3 questions').max(10, 'Maximum 10 questions'),
  job_description: z.string().max(5000, 'Context cannot exceed 5000 characters').optional(),
});

type NewInterviewFormData = z.infer<typeof newInterviewSchema>;

export const NewInterviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<string>('Python Developer');
  const [isCustomRole, setIsCustomRole] = useState<boolean>(false);
  const [customRoleText, setCustomRoleText] = useState<string>('');
  
  const [selectedTopics, setSelectedTopics] = useState<string[]>([
    'Python Core',
    'FastAPI & APIs',
    'SQL & DBMS',
  ]);
  const [newTopicInput, setNewTopicInput] = useState<string>('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<NewInterviewFormData>({
    resolver: zodResolver(newInterviewSchema),
    defaultValues: {
      target_role: 'Python Developer',
      experience_level: 'Intermediate',
      difficulty: 'Medium',
      question_count: 5,
      job_description: '',
    },
  });

  const jobDescText = watch('job_description') || '';
  const questionCount = watch('question_count') || 5;

  const handleRoleSelect = (role: string) => {
    setSelectedRole(role);
    setIsCustomRole(false);
    setValue('target_role', role);
  };

  const handleCustomRoleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomRoleText(val);
    setValue('target_role', val);
  };

  const toggleTopic = (topic: string) => {
    if (selectedTopics.includes(topic)) {
      setSelectedTopics(selectedTopics.filter((t) => t !== topic));
    } else {
      setSelectedTopics([...selectedTopics, topic]);
    }
  };

  const addCustomTopic = () => {
    const trimmed = newTopicInput.trim();
    if (trimmed && !selectedTopics.includes(trimmed)) {
      setSelectedTopics([...selectedTopics, trimmed]);
      setNewTopicInput('');
    }
  };

  const onSubmit = async (data: NewInterviewFormData) => {
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      const interview = await interviewsApi.create({
        target_role: data.target_role,
        experience_level: data.experience_level,
        difficulty: data.difficulty,
        focus_topics: selectedTopics,
        question_count: data.question_count,
        job_description: data.job_description?.trim() || undefined,
      });
      navigate(`/interviews/${interview.id}/session`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to initialize interview questions. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Configure New Interview
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Customize your target role, experience level, and focus topics. Gemini generates fresh, realistic questions tailored to your session.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6">
          <Alert type="error" message={errorMsg} onClose={() => setErrorMsg(null)} />
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xs">
        {/* Step 1: Target Role */}
        <div>
          <label className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-3">
            <Briefcase className="w-4 h-4 text-blue-600" />
            1. Target Engineering Role
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {PRESET_ROLES.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => handleRoleSelect(role)}
                className={`py-3 px-4 rounded-xl text-xs font-semibold text-left border transition-all flex items-center justify-between ${
                  !isCustomRole && selectedRole === role
                    ? 'border-blue-600 bg-blue-50/70 text-blue-800 shadow-xs ring-2 ring-blue-100'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>{role}</span>
                {!isCustomRole && selectedRole === role && <Check className="w-4 h-4 text-blue-600" />}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setIsCustomRole(true);
                setValue('target_role', customRoleText || 'Custom Role');
              }}
              className={`py-3 px-4 rounded-xl text-xs font-semibold text-left border transition-all flex items-center justify-between ${
                isCustomRole
                  ? 'border-blue-600 bg-blue-50/70 text-blue-800 shadow-xs ring-2 ring-blue-100'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>Custom Role</span>
              {isCustomRole && <Check className="w-4 h-4 text-blue-600" />}
            </button>
          </div>

          {isCustomRole && (
            <div className="mt-3">
              <input
                type="text"
                value={customRoleText}
                onChange={handleCustomRoleChange}
                placeholder="e.g. Distributed Systems Engineer, QA Automation, DevOps Specialist"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>
          )}
          {errors.target_role && (
            <p className="mt-1 text-xs text-rose-600">{errors.target_role.message}</p>
          )}
        </div>

        {/* Step 2: Experience & Difficulty */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-3">
              <Layers className="w-4 h-4 text-indigo-600" />
              2. Experience Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['Beginner', 'Intermediate', 'Advanced'].map((lvl) => (
                <label
                  key={lvl}
                  className="cursor-pointer flex flex-col items-center justify-center py-3 px-2 rounded-xl border border-slate-200 text-xs font-semibold text-center hover:bg-slate-50 has-checked:border-indigo-600 has-checked:bg-indigo-50/60 has-checked:text-indigo-800 has-checked:ring-2 has-checked:ring-indigo-100 transition-all"
                >
                  <input
                    type="radio"
                    value={lvl}
                    {...register('experience_level')}
                    className="sr-only"
                  />
                  <span>{lvl}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-3">
              <Flame className="w-4 h-4 text-amber-600" />
              3. Difficulty Standard
            </label>
            <div className="grid grid-cols-4 gap-2">
              {['Easy', 'Medium', 'Hard', 'Mixed'].map((diff) => (
                <label
                  key={diff}
                  className="cursor-pointer flex flex-col items-center justify-center py-3 px-1 rounded-xl border border-slate-200 text-xs font-semibold text-center hover:bg-slate-50 has-checked:border-amber-600 has-checked:bg-amber-50/60 has-checked:text-amber-800 has-checked:ring-2 has-checked:ring-amber-100 transition-all"
                >
                  <input
                    type="radio"
                    value={diff}
                    {...register('difficulty')}
                    className="sr-only"
                  />
                  <span>{diff}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Step 3: Focus Topics */}
        <div className="pt-4 border-t border-slate-100">
          <label className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-2">
            <Sliders className="w-4 h-4 text-emerald-600" />
            4. Focus Topics & Concepts
          </label>
          <p className="text-xs text-slate-500 mb-3">
            Select the technical topics you want to practice or add custom ones:
          </p>

          <div className="flex flex-wrap gap-2 mb-3">
            {PREDEFINED_TOPICS.map((topic) => {
              const isSelected = selectedTopics.includes(topic);
              return (
                <button
                  key={topic}
                  type="button"
                  onClick={() => toggleTopic(topic)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  {topic}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 max-w-md">
            <input
              type="text"
              value={newTopicInput}
              onChange={(e) => setNewTopicInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustomTopic();
                }
              }}
              placeholder="Add custom topic (e.g. WebSockets, Redis)"
              className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
            />
            <button
              type="button"
              onClick={addCustomTopic}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
        </div>

        {/* Step 4: Question Count Slider */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-bold text-slate-900">
              5. Number of Questions
            </label>
            <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
              {questionCount} Questions
            </span>
          </div>
          <input
            type="range"
            min="3"
            max="10"
            step="1"
            value={questionCount}
            onChange={(e) => setValue('question_count', parseInt(e.target.value, 10))}
            className="w-full accent-blue-600 cursor-pointer"
          />
          <div className="flex justify-between text-[11px] text-slate-400 mt-1">
            <span>3 (Quick Drill)</span>
            <span>5 (Standard Interview)</span>
            <span>10 (Comprehensive)</span>
          </div>
        </div>

        {/* Step 5: Optional Job Description Context */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <FileText className="w-4 h-4 text-slate-600" />
              6. Optional Job Description / Skills Context
            </label>
            <span className="text-xs text-slate-400">
              {jobDescText.length} / 5,000 characters
            </span>
          </div>
          <textarea
            {...register('job_description')}
            rows={4}
            maxLength={5000}
            placeholder="Paste excerpts from a real job posting or list specific tech-stack tools you wish to focus on. Treated strictly as contextual data."
            className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-y transition-all"
          />
          {errors.job_description && (
            <p className="mt-1 text-xs text-rose-600">{errors.job_description.message}</p>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-6 border-t border-slate-200">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-md shadow-blue-500/25 flex items-center justify-center gap-3 transition-all disabled:opacity-50 hover:scale-[1.01]"
          >
            {isSubmitting ? (
              <>
                <Sparkles className="w-5 h-5 animate-spin" />
                Generating Questions with Gemini AI...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Interview Session
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
          <p className="text-center text-xs text-slate-400 mt-3">
            Questions are generated strictly adhering to role requirements and saved securely in your private workspace.
          </p>
        </div>
      </form>
    </div>
  );
};
