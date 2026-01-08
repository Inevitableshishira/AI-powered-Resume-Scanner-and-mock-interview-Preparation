import React, { useEffect, useState } from 'react';
import { Page } from '../types';

interface Props {
  currentPage: Page;
  setPage: (p: Page) => void;
  children: React.ReactNode;
}

const Layout: React.FC<Props> = ({ currentPage, setPage, children }) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (saved === 'dark' || (!saved && systemDark)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-400">
      <header className="sticky top-0 z-[100] backdrop-blur-3xl border-b border-slate-200/50 dark:border-slate-800/50 bg-white/40 dark:bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <button onClick={() => setPage('HOME')} className="flex items-center gap-3 group text-left">
            <div className="w-11 h-11 bg-brand-600 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xl shadow-brand-500/30 rotate-3">
              <span className="text-white font-black text-xl">RM</span>
            </div>
            <div className="flex flex-col leading-none">
                <span className="text-lg font-black tracking-tighter dark:text-white uppercase">Resume<span className="text-brand-600">Match</span> AI</span>
                <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400">Intelligent Analysis</span>
            </div>
          </button>
          
          <nav className="hidden lg:flex items-center gap-1.5 p-1 bg-slate-100/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200/50 dark:border-slate-800/50">
            {[
              { id: 'HOME', label: 'Home' },
              { id: 'ANALYZE', label: 'Match Engine' },
              { id: 'ATS', label: 'ATS Audit' },
              { id: 'INTERVIEW', label: 'Practice' },
              { id: 'HISTORY', label: 'History' }
            ].map((p) => (
              <button 
                key={p.id}
                onClick={() => setPage(p.id as Page)}
                className={`px-5 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all ${
                  currentPage === p.id 
                  ? 'text-white bg-brand-600 shadow-lg shadow-brand-500/20' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-brand-600 hover:bg-white dark:hover:bg-slate-800'
                }`}
              >
                {p.label}
              </button>
            ))}
          </nav>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme}
              className="p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400"
            >
              {isDark ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M16.243 16.243l.707.707M7.757 7.757l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {children}
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 py-16 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex flex-col gap-2 items-center md:items-start text-center md:text-left">
            <span className="font-black dark:text-white uppercase tracking-tighter text-lg">Resume Match AI</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">© 2024 AI-Powered Career Tools</span>
          </div>
          <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <a href="#" className="hover:text-brand-600 transition-colors">Documentation</a>
            <a href="#" className="hover:text-brand-600 transition-colors">Privacy</a>
            <a href="#" className="hover:text-brand-600 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;