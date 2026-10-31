import React from 'react';
import { Info } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs py-8 border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <div className="space-y-1">
            <p className="font-semibold text-slate-300">
              AI Interview Agent 2.0 &bull; Technical Practice Platform
            </p>
            <p className="text-slate-500">
              Built with FastAPI, React, TypeScript, and Google Gemini API.
            </p>
          </div>

          <div className="flex items-center gap-2 text-slate-400 bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700/60 max-w-xl text-left">
            <Info className="w-4 h-4 text-blue-400 shrink-0" />
            <p className="text-[11px] leading-relaxed">
              <strong className="text-slate-300">Practice Notice:</strong> All scores and feedback are AI-generated for educational rehearsal and self-improvement only. They do not constitute formal employment or hiring decisions.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
