import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Target,
  BarChart3,
  BrainCircuit,
  ArrowRight,
  Shield,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: Target,
      title: 'Role-Specific Technical Questions',
      description:
        'Generate interviews tailored to Python Developer, Backend, Full-Stack, Data Analyst, Data Science, or ML Engineer roles.',
    },
    {
      icon: BrainCircuit,
      title: 'Transparent 0-10 Rubric',
      description:
        'Scored across technical correctness (0-4), completeness (0-2), reasoning (0-2), and clarity (0-2). Never trust black-box scores.',
    },
    {
      icon: BarChart3,
      title: 'Actionable Practice Plans',
      description:
        'Receive concrete improvement suggestions, revision topics, and reference model answers to guide your next study session.',
    },
    {
      icon: Shield,
      title: 'Zero Personality Gimmicks',
      description:
        'No facial emotion analysis, appearance scoring, or pseudo-scientific personality tests. Only your technical reasoning matters.',
    },
  ];

  return (
    <div className="space-y-16 py-12">
      {/* Hero Section */}
      <section className="text-center max-w-4xl mx-auto px-4 sm:px-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          Powered by Google Gemini 2.5 &bull; Production Architecture
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight sm:leading-none">
          Master Technical Interviews with <span className="text-blue-600">Objective AI Feedback</span>
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Practice realistic coding and engineering interviews. Submit written answers, get graded on a transparent rubric, and follow targeted revision plans.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to={isAuthenticated ? '/dashboard' : '/register'}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base shadow-md shadow-blue-500/25 transition-all hover:-translate-y-0.5"
          >
            {isAuthenticated ? 'Go to Dashboard' : 'Start Free Practice'}
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to={isAuthenticated ? '/interviews/new' : '/login'}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-base transition-colors"
          >
            {isAuthenticated ? 'Create New Session' : 'Sign In'}
          </Link>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Engineered for Serious Preparation
          </h2>
          <p className="mt-2 text-slate-500">
            Built from scratch to deliver consistent, transparent evaluation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-2">{feat.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{feat.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Rubric Breakdown Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-3xl p-8 sm:p-12 shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <span className="text-blue-400 text-xs font-bold uppercase tracking-wider">
                Transparent Scoring Standard
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold mt-2">
                10-Point Technical Evaluation Rubric
              </h2>
              <p className="mt-4 text-slate-300 text-sm leading-relaxed">
                Every response is evaluated against fixed criteria. Answers are saved before evaluation, and scores are derived server-side.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-300">
                  Python Developer
                </span>
                <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-300">
                  Backend Engineer
                </span>
                <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-300">
                  Data Scientist
                </span>
                <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-300">
                  ML Engineer
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-4">
                <span className="text-2xl font-black text-blue-400">0 - 4</span>
                <h4 className="font-semibold text-white text-sm mt-1">Technical Correctness</h4>
                <p className="text-xs text-slate-400 mt-1">Factual accuracy and terminology.</p>
              </div>
              <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-4">
                <span className="text-2xl font-black text-indigo-400">0 - 2</span>
                <h4 className="font-semibold text-white text-sm mt-1">Completeness</h4>
                <p className="text-xs text-slate-400 mt-1">Addresses all core components.</p>
              </div>
              <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-4">
                <span className="text-2xl font-black text-emerald-400">0 - 2</span>
                <h4 className="font-semibold text-white text-sm mt-1">Reasoning & Trade-offs</h4>
                <p className="text-xs text-slate-400 mt-1">Explains why and under what conditions.</p>
              </div>
              <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-4">
                <span className="text-2xl font-black text-amber-400">0 - 2</span>
                <h4 className="font-semibold text-white text-sm mt-1">Relevance & Clarity</h4>
                <p className="text-xs text-slate-400 mt-1">Clear, structured communication.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
