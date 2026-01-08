
import React, { useState, useEffect } from 'react';
import { generateATSReport } from '../services/geminiService';
import { ATSScore as ATSScoreType } from '../types';

interface Props {
  resumeText: string;
}

const ATSScore: React.FC<Props> = ({ resumeText }) => {
  const [report, setReport] = useState<ATSScoreType | null>(null);
  const [loading, setLoading] = useState(false);

  const runAudit = async () => {
    setLoading(true);
    try {
      const res = await generateATSReport(resumeText);
      setReport(res);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (resumeText) runAudit();
  }, [resumeText]);

  if (loading) return (
    <div className="max-w-4xl mx-auto py-24 flex flex-col items-center">
       <div className="w-20 h-20 border-8 border-brand-100 border-t-brand-600 rounded-full animate-spin mb-8"></div>
       <h3 className="text-2xl font-black text-slate-900 dark:text-white">Simulating ATS Parsing...</h3>
       <p className="text-slate-500 font-medium">Auditing format and keyword signatures.</p>
    </div>
  );

  if (!report) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 page-transition-enter">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Score Card */}
        <div className="lg:col-span-1 glass-card rounded-[3rem] p-10 flex flex-col items-center text-center">
           <div className="w-32 h-32 rounded-full border-8 border-brand-500/20 flex items-center justify-center mb-6 shadow-2xl">
              <span className="text-5xl font-black text-brand-600">{report.total}%</span>
           </div>
           <h3 className="text-xl font-black dark:text-white mb-2">Overall Score</h3>
           <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Global ATS Readiness</p>
        </div>

        {/* Breakdown Card */}
        <div className="lg:col-span-3 glass-card rounded-[3rem] p-10 grid grid-cols-1 md:grid-cols-3 gap-10">
          {[
            { label: 'Formatting', val: report.formatting, color: 'text-indigo-500' },
            { label: 'Keyword Signature', val: report.keywords, color: 'text-rose-500' },
            { label: 'Contextual Readability', val: report.readability, color: 'text-emerald-500' }
          ].map((m, i) => (
            <div key={i} className="space-y-4">
               <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{m.label}</span>
                  <span className={`text-lg font-black ${m.color}`}>{m.val}%</span>
               </div>
               <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full bg-current ${m.color.replace('text', 'bg')}`} style={{ width: `${m.val}%` }}></div>
               </div>
            </div>
          ))}
        </div>

        {/* Findings and Improvements */}
        <div className="lg:col-span-2 glass-card rounded-[3rem] p-10">
           <h4 className="font-black text-slate-900 dark:text-white mb-6 uppercase text-sm tracking-widest">Audit Findings</h4>
           <div className="space-y-4">
              {report.findings.map((f, i) => (
                <div key={i} className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                   <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0"></div>
                   <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{f}</p>
                </div>
              ))}
           </div>
        </div>

        <div className="lg:col-span-2 glass-card rounded-[3rem] p-10">
           <h4 className="font-black text-slate-900 dark:text-white mb-6 uppercase text-sm tracking-widest">Required Fixes</h4>
           <div className="space-y-4">
              {report.improvements.map((f, i) => (
                <div key={i} className="flex gap-4 p-4 bg-brand-50 dark:bg-brand-950/20 rounded-2xl border border-brand-100 dark:border-brand-900/50">
                   <div className="w-2 h-2 rounded-full bg-brand-500 mt-1.5 flex-shrink-0"></div>
                   <p className="text-sm font-medium text-slate-700 dark:text-brand-300">{f}</p>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default ATSScore;
