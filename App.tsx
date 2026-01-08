import React, { useState, useEffect } from 'react';
import { Page, AnalysisResult, AnalysisStatus } from './types';
import { SKILL_TAXONOMY } from './constants';
import { calculateCosineSimilarity, extractSkillsFromText } from './services/nlpEngine';
import { performAIAnalysis } from './services/geminiService';
import { saveAnalysis, getHistory, deleteAnalysis } from './services/storage';
import Layout from './components/Layout';
import ResultDashboard from './components/ResultDashboard';
import LiveInterview from './components/LiveInterview';
import ATSScore from './components/ATSScore';

const extractTextFromPdf = async (file: File): Promise<string> => {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@${pdfjs.version}/build/pdf.worker.mjs`;
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    fullText += textContent.items.map((item: any) => item.str).join(" ") + "\n";
  }
  return fullText;
};

const App: React.FC = () => {
  const [currentPage, setPage] = useState<Page>('HOME');
  const [jobDescription, setJobDescription] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [isFileLoading, setIsFileLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setHistory(getHistory());
  }, [currentPage]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsFileLoading(true);
    setError(null);
    try {
      if (file.type === 'application/pdf') {
        const text = await extractTextFromPdf(file);
        setResumeText(text);
      } else {
        const reader = new FileReader();
        reader.onload = (event) => setResumeText(event.target?.result as string);
        reader.readAsText(file);
      }
    } catch (err) {
      setError("Failed to extract text. Try pasting manually.");
    } finally {
      setIsFileLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!jobDescription.trim() || !resumeText.trim()) {
      setError("Please provide both Job Description and Resume.");
      return;
    }
    setStatus(AnalysisStatus.PARSING);
    setError(null);
    try {
      await new Promise(r => setTimeout(r, 800));
      setStatus(AnalysisStatus.ANALYZING);
      const score = calculateCosineSimilarity(resumeText, jobDescription);
      const aiResult = await performAIAnalysis(resumeText, jobDescription);
      const finalResult: AnalysisResult = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        score: score,
        matchedSkills: extractSkillsFromText(resumeText, SKILL_TAXONOMY).filter(s => jobDescription.includes(s)),
        missingSkills: aiResult.missingSkills || [],
        extraSkills: aiResult.extraSkills || [],
        groupedSkills: aiResult.groupedSkills || [],
        suggestions: aiResult.suggestions || [],
        summary: aiResult.summary || "",
        jobTitle: jobDescription.split('\n')[0].substring(0, 40)
      };
      setResult(finalResult);
      saveAnalysis(finalResult);
      setStatus(AnalysisStatus.SUCCESS);
    } catch (err) {
      setError("Deep analysis failed. Verify your inputs.");
      setStatus(AnalysisStatus.ERROR);
    }
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'HOME':
        return (
          <div className="max-w-7xl mx-auto px-4 py-32 page-transition-enter">
            <div className="text-center mb-32">
                <div className="inline-flex items-center gap-2.5 glass-card px-5 py-2 rounded-full text-brand-700 dark:text-brand-400 text-[10px] font-black uppercase tracking-[0.2em] mb-12 shadow-sm animate-float">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse"></span>
                AI-Powered Career Intelligence
                </div>
                <h1 className="text-8xl md:text-9xl font-black tracking-tighter leading-[0.8] mb-12 dark:text-white">
                Resume Match<br/>
                <span className="text-brand-600 bg-clip-text text-transparent bg-gradient-to-r from-brand-600 via-indigo-500 to-rose-600">for elite careers.</span>
                </h1>
                <p className="text-xl md:text-2xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-20 font-medium leading-relaxed">
                Smart resume analysis, real-time match scoring, and AI-powered interview practice in one powerful suite.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-8 items-center">
                <button onClick={() => setPage('ANALYZE')} className="px-14 py-6 bg-brand-600 text-white rounded-[2rem] font-black text-lg hover:bg-brand-700 shadow-2xl shadow-brand-500/30 transition-all transform active:scale-95">
                    Match Engine
                </button>
                <button onClick={() => setPage('INTERVIEW')} className="glass-card px-14 py-6 rounded-[2rem] font-black text-lg hover:bg-white dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
                    Start Interview
                </button>
                </div>
            </div>

            <div className="mt-40 pt-40 border-t border-slate-200/50 dark:border-slate-800/50">
               <div className="flex flex-col lg:flex-row gap-20 items-start">
                  <div className="lg:w-1/3 space-y-8">
                     <div className="p-1 bg-brand-600 w-12 h-1 rounded-full"></div>
                     <h2 className="text-4xl md:text-5xl font-black dark:text-white leading-none tracking-tighter">System<br/>Intelligence</h2>
                     <p className="text-slate-500 font-medium leading-relaxed">
                        Our platform uses advanced NLP and real-time audio processing to provide a seamless career preparation experience.
                     </p>
                     <div className="grid grid-cols-1 gap-3">
                        {[
                          { l: 'NLP Match Engine', d: 'Vector-based semantic analysis' },
                          { l: 'ATS Audit', d: 'Industry-standard compatibility checks' },
                          { l: 'Live Simulation', d: 'Low-latency voice interview practice' },
                          { l: 'Private Data', d: 'Client-side processing and storage' }
                        ].map((t, i) => (
                          <div key={i} className="glass-card p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50">
                             <span className="block text-[10px] font-black uppercase tracking-widest text-brand-600 mb-1">{t.l}</span>
                             <span className="text-sm font-bold text-slate-500">{t.d}</span>
                          </div>
                        ))}
                     </div>
                  </div>
                  <div className="lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="glass-card p-12 rounded-[3.5rem] hover:border-brand-500/30 transition-all group">
                        <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center text-xl mb-6 group-hover:rotate-12 transition-transform">📊</div>
                        <h4 className="font-black text-slate-900 dark:text-white mb-4 uppercase text-sm tracking-widest">Match Logic</h4>
                        <p className="text-sm text-slate-500 leading-relaxed font-medium">
                           Calculate term frequencies and normalize vectors to derive a high-accuracy match score via Cosine Similarity.
                        </p>
                     </div>
                     <div className="glass-card p-12 rounded-[3.5rem] hover:border-rose-500/30 transition-all group">
                        <div className="w-10 h-10 bg-rose-50 dark:bg-rose-900/20 rounded-xl flex items-center justify-center text-xl mb-6 group-hover:rotate-12 transition-transform">🎙️</div>
                        <h4 className="font-black text-slate-900 dark:text-white mb-4 uppercase text-sm tracking-widest">Voice Engine</h4>
                        <p className="text-sm text-slate-500 leading-relaxed font-medium">
                           Full-duplex audio pipeline utilizing the Web Audio API for a low-latency, conversational interview simulation.
                        </p>
                     </div>
                     <div className="glass-card p-12 rounded-[3.5rem] hover:border-emerald-500/30 transition-all group">
                        <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center text-xl mb-6 group-hover:rotate-12 transition-transform">🛡️</div>
                        <h4 className="font-black text-slate-900 dark:text-white mb-4 uppercase text-sm tracking-widest">ATS Audit</h4>
                        <p className="text-sm text-slate-500 leading-relaxed font-medium">
                           Analyze document structure and formatting to ensure your profile is optimized for modern applicant tracking systems.
                        </p>
                     </div>
                     <div className="glass-card p-12 rounded-[3.5rem] hover:border-brand-500/30 transition-all group">
                        <div className="w-10 h-10 bg-brand-50 dark:bg-brand-900/20 rounded-xl flex items-center justify-center text-xl mb-6 group-hover:rotate-12 transition-transform">📂</div>
                        <h4 className="font-black text-slate-900 dark:text-white mb-4 uppercase text-sm tracking-widest">Local Parse</h4>
                        <p className="text-sm text-slate-500 leading-relaxed font-medium">
                           Documents are parsed directly in your browser, ensuring maximum privacy and fast processing times without server-side storage.
                        </p>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        );

      case 'ANALYZE':
        if (status === AnalysisStatus.SUCCESS && result) {
          return (
            <div className="max-w-7xl mx-auto px-4 py-16 page-transition-enter">
              <div className="flex items-center justify-between mb-16">
                <button onClick={() => { setStatus(AnalysisStatus.IDLE); setResult(null); }} className="text-slate-900 dark:text-white font-black flex items-center gap-2 group">
                  <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
                  New Scan
                </button>
              </div>
              <ResultDashboard data={result} />
            </div>
          );
        }

        return (
          <div className="max-w-7xl mx-auto px-4 py-16 page-transition-enter">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="glass-card p-12 rounded-[3.5rem]">
                <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 mb-10">Target Requirements</h3>
                <textarea 
                  className="w-full h-[500px] p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 bg-white/30 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all text-sm font-medium leading-relaxed dark:text-slate-200"
                  placeholder="Paste job description here..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                />
              </div>

              <div className="glass-card p-12 rounded-[3.5rem] relative">
                <div className="flex items-center justify-between mb-10">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Candidate Profile</h3>
                  <label className="text-[10px] font-black text-brand-600 dark:text-brand-400 uppercase tracking-widest cursor-pointer hover:underline">
                    Load Document
                    <input type="file" className="hidden" accept=".txt,.pdf" onChange={handleFileUpload} />
                  </label>
                </div>
                <textarea 
                  className={`w-full h-[500px] p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 bg-white/30 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all text-sm font-medium leading-relaxed dark:text-slate-200 ${isFileLoading ? 'opacity-30' : ''}`}
                  placeholder="Paste content or upload resume..."
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                />
                {isFileLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/20 dark:bg-black/20 backdrop-blur-sm rounded-[3.5rem]">
                    <div className="animate-spin h-10 w-10 border-4 border-brand-600 border-t-transparent rounded-full"></div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-20 flex flex-col items-center">
              <button 
                onClick={handleAnalyze}
                disabled={status !== AnalysisStatus.IDLE && status !== AnalysisStatus.ERROR || isFileLoading}
                className="px-24 py-7 bg-slate-900 dark:bg-brand-600 text-white rounded-[2.5rem] font-black text-xl shadow-2xl hover:opacity-95 active:scale-95 transition-all flex items-center gap-6"
              >
                {status === AnalysisStatus.PARSING ? 'Parsing Data...' : status === AnalysisStatus.ANALYZING ? 'Benchmarking Profile...' : 'Execute Match Engine'}
                {(status === AnalysisStatus.PARSING || status === AnalysisStatus.ANALYZING) && <div className="animate-spin h-6 w-6 border-4 border-white border-t-transparent rounded-full"></div>}
              </button>
              {error && <p className="text-rose-500 font-black mt-10 text-xl">{error}</p>}
            </div>
          </div>
        );

      case 'ATS':
        if (!resumeText) return (
            <div className="max-w-2xl mx-auto py-32 text-center page-transition-enter">
              <h2 className="text-4xl font-black mb-8 dark:text-white">Profile Required</h2>
              <button onClick={() => setPage('ANALYZE')} className="bg-brand-600 text-white px-10 py-4 rounded-2xl font-black shadow-xl">Go to Engine</button>
            </div>
        );
        return <ATSScore resumeText={resumeText} />;

      case 'INTERVIEW':
        if (!resumeText || !jobDescription) return (
            <div className="max-w-2xl mx-auto py-32 text-center page-transition-enter">
              <h2 className="text-4xl font-black mb-8 dark:text-white">Context Required</h2>
              <p className="text-slate-500 font-medium mb-12">Match Engine data is required to tailor the simulation.</p>
              <button onClick={() => setPage('ANALYZE')} className="bg-brand-600 text-white px-10 py-4 rounded-2xl font-black shadow-xl">Setup Engine Data</button>
            </div>
        );
        return <LiveInterview resumeText={resumeText} jobDescription={jobDescription} />;

      case 'HISTORY':
        return (
          <div className="max-w-5xl mx-auto px-4 py-20 page-transition-enter">
            <h2 className="text-6xl font-black dark:text-white mb-20 tracking-tighter leading-none">History</h2>
            {history.length === 0 ? (
              <div className="glass-card p-24 rounded-[4rem] text-center border-dashed border-2 border-slate-200 dark:border-slate-800">
                <p className="text-slate-400 font-black text-xl mb-12 uppercase tracking-widest">No previous analysis</p>
                <button onClick={() => setPage('ANALYZE')} className="bg-brand-600 text-white px-12 py-5 rounded-[2rem] font-black text-lg shadow-xl">Begin Analysis</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {history.map((item) => (
                  <div key={item.id} className="glass-card p-10 rounded-[3rem] flex items-center justify-between group hover:border-brand-500/50 transition-all cursor-pointer shadow-xl" onClick={() => { setResult(item); setPage('ANALYZE'); setStatus(AnalysisStatus.SUCCESS); }}>
                    <div className="flex items-center gap-12">
                      <div className="w-20 h-20 bg-brand-600 text-white rounded-[1.8rem] flex items-center justify-center font-black text-2xl shadow-xl shadow-brand-500/30">
                        {Math.round(item.score)}
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 dark:text-white text-2xl leading-none mb-3">{item.jobTitle}</h4>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{new Date(item.timestamp).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setHistory(deleteAnalysis(item.id)); }} className="p-5 text-slate-300 hover:text-rose-500 transition-all">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <Layout currentPage={currentPage} setPage={setPage}>
      <div className="relative min-h-[calc(100vh-64px)] overflow-hidden">
        {renderContent()}
      </div>
    </Layout>
  );
};

export default App;