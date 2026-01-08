
import React from 'react';
import { AnalysisResult } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

interface Props {
  data: AnalysisResult;
}

const ResultDashboard: React.FC<Props> = ({ data }) => {
  const chartData = [
    { name: 'Match', value: data.score },
    { name: 'Gap', value: 100 - data.score },
  ];
  const COLORS = ['#6366F1', '#E2E8F0'];
  const DARK_COLORS = ['#818CF8', '#1E293B'];

  const skillCountData = data.groupedSkills.map(g => ({
    name: g.category,
    count: g.skills.length
  }));

  const isDarkMode = document.documentElement.classList.contains('dark');

  return (
    <div className="space-y-10 page-enter">
      {/* High-Impact Match Overview */}
      <div className="glass rounded-[3rem] p-12 shadow-2xl border border-white/40 dark:border-white/5 flex flex-col lg:flex-row items-center gap-16">
        <div className="relative w-56 h-56 flex-shrink-0 animate-in zoom-in duration-700">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chartData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value" startAngle={90} endAngle={450}>
                {chartData.map((_, index) => <Cell key={`cell-${index}`} fill={isDarkMode ? DARK_COLORS[index] : COLORS[index]} cornerRadius={12} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-black text-slate-900 dark:text-white leading-none">{Math.round(data.score)}%</span>
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Intelligence Match</span>
          </div>
        </div>

        <div className="flex-grow text-center lg:text-left">
          <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-4 tracking-tight leading-none">Analysis Verdict</h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed mb-8 italic font-medium">"{data.summary}"</p>
          <div className="flex flex-wrap justify-center lg:justify-start gap-4">
            <div className="bg-indigo-50 dark:bg-indigo-950/30 px-6 py-4 rounded-[1.5rem] border border-indigo-100 dark:border-indigo-900/50">
              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block mb-1">Keywords Verified</span>
              <span className="text-2xl font-black text-indigo-700 dark:text-indigo-400">{data.matchedSkills.length}</span>
            </div>
            <div className="bg-rose-50 dark:bg-rose-950/30 px-6 py-4 rounded-[1.5rem] border border-rose-100 dark:border-rose-900/50">
              <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest block mb-1">Critical Gaps</span>
              <span className="text-2xl font-black text-rose-700 dark:text-rose-400">{data.missingSkills.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Missing Keywords Analysis */}
        <div className="glass p-10 rounded-[3rem] shadow-xl border border-white/30">
          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-8 flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></div>
            Competitive Gaps
          </h3>
          <div className="space-y-8">
            <div className="flex flex-wrap gap-2.5">
              {data.missingSkills.length > 0 ? data.missingSkills.map((s, i) => (
                <span key={i} className="bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 px-5 py-2.5 rounded-2xl text-xs font-black border border-rose-100 dark:border-rose-900/50 uppercase tracking-widest">
                  {s}
                </span>
              )) : <p className="text-slate-400 font-bold uppercase text-sm italic">Maximum relevance achieved.</p>}
            </div>
            <div className="pt-8 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Optimization Roadmap</h4>
              <ul className="space-y-4">
                {data.suggestions.map((s, i) => (
                  <li key={i} className="flex gap-4 text-sm text-slate-700 dark:text-slate-300 font-medium leading-snug">
                    <span className="text-indigo-500 font-black">•</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Career Intelligence Graph */}
        <div className="glass p-10 rounded-[3rem] shadow-xl border border-white/30">
          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-8 flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div>
            Expertise Matrix
          </h3>
          <div className="h-56 mb-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={skillCountData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={110} tick={{fontSize: 10, fontWeight: 900, fill: isDarkMode ? '#94A3B8' : '#64748B'}} axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', background: isDarkMode ? '#0F172A' : '#FFFFFF'}} />
                <Bar dataKey="count" fill={isDarkMode ? '#818CF8' : '#6366F1'} radius={[0, 12, 12, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {data.groupedSkills.slice(0, 4).map((group, idx) => (
              <div key={idx} className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 transition-all hover:border-indigo-200">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 leading-none">{group.category}</p>
                <div className="flex flex-wrap gap-1.5">
                  {group.skills.slice(0, 2).map((s, i) => (
                    <span key={i} className="text-[10px] bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg font-bold border border-slate-200 dark:border-slate-700 dark:text-slate-300">{s}</span>
                  ))}
                  {group.skills.length > 2 && <span className="text-[10px] font-black text-indigo-500 self-center">+{group.skills.length - 2}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultDashboard;
