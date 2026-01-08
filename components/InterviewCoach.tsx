
import React, { useState, useEffect, useRef } from 'react';
import { generateInterviewQuestion, evaluateInterviewAnswer } from '../services/geminiService';
import { InterviewFeedback, PracticeTurn, InterviewSession } from '../types';
import { saveInterviewSession } from '../services/storage';

interface Props {
  resumeText: string;
  jobDescription: string;
  jobTitle: string;
}

const COMMON_QUESTIONS = [
  "Tell me about yourself and your background.",
  "Why are you interested in this specific role and company?",
  "Describe a time you faced a significant technical challenge.",
  "What are your greatest professional strengths and weaknesses?",
  "How do you handle conflict within a team environment?",
  "Where do you see your career heading in the next 5 years?"
];

const InterviewCoach: React.FC<Props> = ({ resumeText, jobDescription, jobTitle }) => {
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  // Changed turns type to PracticeTurn[] to match usage
  const [turns, setTurns] = useState<PracticeTurn[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionFinished, setSessionFinished] = useState(false);
  const [viewMode, setViewMode] = useState<'PRACTICE' | 'REVIEW'>('PRACTICE');
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };
    }
  }, []);

  const handleStartPractice = async (q?: string) => {
    setIsLoading(true);
    setTranscript('');
    try {
      const targetQuestion = q || await generateInterviewQuestion(resumeText, jobDescription);
      setCurrentQuestion(targetQuestion);
      setViewMode('PRACTICE');
    } catch (e) {
      setCurrentQuestion("Could you elaborate on your relevant experience for this position?");
    }
    setIsLoading(false);
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      setTranscript('');
      try {
        recognitionRef.current?.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Speech recognition start failed:", err);
      }
    }
  };

  const handleSubmitTurn = async () => {
    if (!transcript || !currentQuestion) return;
    setIsLoading(true);
    try {
      const feedback = await evaluateInterviewAnswer(currentQuestion, transcript, jobDescription);
      // Corrected object structure using PracticeTurn
      const newTurn: PracticeTurn = {
        question: currentQuestion,
        answer: transcript,
        feedback,
        timestamp: Date.now()
      };
      setTurns(prev => [...prev, newTurn]);
      setCurrentQuestion(null);
      setTranscript('');
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  const handleFinishSession = () => {
    if (turns.length === 0) return;
    const avgScore = turns.reduce((acc, t) => acc + (t.feedback?.score || 0), 0) / turns.length;
    const session: InterviewSession = {
      id: Math.random().toString(36).substring(7),
      timestamp: Date.now(),
      jobTitle: jobTitle || "Role Practice",
      turns: turns,
      overallScore: Math.round(avgScore)
    };
    saveInterviewSession(session);
    setSessionFinished(true);
    setViewMode('REVIEW');
  };

  const wordCount = transcript.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="max-w-5xl mx-auto px-4 page-enter">
      <div className="glass rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 mb-10">
          <button 
            onClick={() => setViewMode('PRACTICE')}
            className={`px-8 py-4 font-black text-sm uppercase tracking-widest transition-all ${viewMode === 'PRACTICE' ? 'text-indigo-600 border-b-4 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Live Coach
          </button>
          <button 
            onClick={() => setViewMode('REVIEW')}
            disabled={turns.length === 0}
            className={`px-8 py-4 font-black text-sm uppercase tracking-widest transition-all ${viewMode === 'REVIEW' ? 'text-indigo-600 border-b-4 border-indigo-600' : 'text-slate-400 hover:text-slate-600 disabled:opacity-30'}`}
          >
            Session Review ({turns.length})
          </button>
        </div>

        {viewMode === 'PRACTICE' ? (
          <div className="space-y-8">
            {!currentQuestion && !isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <h3 className="text-2xl font-black dark:text-white">Generate Contextual Question</h3>
                  <p className="text-slate-500 font-medium">Gemini will analyze your resume and the job description to challenge you with role-specific scenarios.</p>
                  <button 
                    onClick={() => handleStartPractice()}
                    className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 active:scale-95 transition-all"
                  >
                    AI Deep Question
                  </button>
                </div>
                <div className="space-y-6">
                  <h3 className="text-2xl font-black dark:text-white">Quick Question Bank</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {COMMON_QUESTIONS.slice(0, 3).map((q, i) => (
                      <button 
                        key={i}
                        onClick={() => handleStartPractice(q)}
                        className="text-left p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all group"
                      >
                        <p className="text-xs font-black text-slate-400 group-hover:text-indigo-500 mb-1 uppercase">Recommended</p>
                        <p className="text-sm font-bold dark:text-slate-200 truncate">{q}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {isLoading && (
              <div className="flex flex-col items-center py-20 space-y-6">
                <div className="flex gap-2">
                  <div className="w-4 h-4 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-4 h-4 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-4 h-4 bg-indigo-600 rounded-full animate-bounce"></div>
                </div>
                <p className="text-indigo-600 font-black uppercase tracking-widest text-sm">Evaluating Performance...</p>
              </div>
            )}

            {currentQuestion && !isLoading && (
              <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
                <div className="bg-slate-900 dark:bg-white rounded-[2rem] p-8 text-white dark:text-slate-950 shadow-2xl relative">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Live Prompt</span>
                    <button onClick={() => setCurrentQuestion(null)} className="opacity-40 hover:opacity-100 transition-opacity">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                  </div>
                  <p className="text-2xl font-bold leading-tight tracking-tight">"{currentQuestion}"</p>
                </div>

                <div className="relative group">
                   {/* Real-time Indicator Bar */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 glass px-4 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 shadow-lg z-10">
                     <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-slate-300'}`}></div>
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                       {isRecording ? 'Recording Active' : 'Mic Off'}
                     </span>
                     <div className="w-px h-3 bg-slate-200 mx-2"></div>
                     <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">{wordCount} Words</span>
                  </div>

                  <textarea
                    className={`w-full h-64 p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-inner focus:ring-4 focus:ring-indigo-500/10 outline-none resize-none transition-all text-xl font-medium dark:text-slate-100 leading-relaxed ${isRecording ? 'border-indigo-400' : ''}`}
                    placeholder="Speak your mind..."
                    value={transcript}
                    readOnly
                  />

                  {isRecording && (
                    <div className="absolute inset-x-0 bottom-10 flex justify-center gap-1">
                      {[1,2,3,4,5,6,7,8,7,6,5,4,3,2,1].map((h, i) => (
                        <div 
                          key={i} 
                          className="w-1 bg-indigo-500 rounded-full animate-pulse-slow" 
                          style={{ 
                            height: `${h * 4}px`, 
                            animationDuration: `${0.5 + Math.random()}s`,
                            animationDelay: `${i * 0.05}s`
                          }}
                        ></div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button
                    onClick={toggleRecording}
                    className={`w-full sm:w-auto flex items-center justify-center gap-4 px-12 py-5 rounded-[2rem] font-black text-lg transition-all shadow-2xl group ${
                      isRecording 
                      ? 'bg-red-500 text-white hover:bg-red-600 shadow-red-500/30' 
                      : 'bg-slate-900 dark:bg-white dark:text-slate-950 text-white hover:opacity-90 shadow-slate-900/30'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full ${isRecording ? 'bg-white animate-ping' : 'bg-red-500'}`}></div>
                    {isRecording ? 'Stop Recording' : 'Start My Pitch'}
                  </button>

                  <button
                    onClick={handleSubmitTurn}
                    disabled={!transcript || isRecording}
                    className="w-full sm:w-auto bg-emerald-600 text-white px-12 py-5 rounded-[2rem] font-black text-lg hover:bg-emerald-700 transition-all disabled:opacity-30 shadow-2xl shadow-emerald-500/20 active:scale-95"
                  >
                    Evaluate Pitch
                  </button>
                </div>
              </div>
            )}

            {turns.length > 0 && !currentQuestion && !isLoading && (
              <div className="pt-10 border-t border-slate-100 dark:border-slate-800 flex justify-center">
                 <button 
                  onClick={handleFinishSession}
                  className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 px-10 py-4 rounded-2xl font-black text-lg hover:bg-indigo-100 transition-all border border-indigo-200"
                 >
                   Complete Practice Session
                 </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-10 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
               <div>
                 <h3 className="text-3xl font-black dark:text-white mb-2">Session Insights</h3>
                 <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">A comprehensive breakdown of your performance.</p>
               </div>
               {sessionFinished && (
                 <div className="bg-indigo-600 text-white px-6 py-4 rounded-2xl text-center shadow-xl shadow-indigo-600/20">
                    <span className="text-[10px] font-black uppercase block opacity-70">Overall Score</span>
                    <span className="text-2xl font-black">
                      {Math.round(turns.reduce((acc, t) => acc + (t.feedback?.score || 0), 0) / turns.length)}%
                    </span>
                 </div>
               )}
            </div>

            <div className="space-y-6">
              {turns.map((turn, idx) => (
                <div key={idx} className="glass p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 hover:border-indigo-200 transition-all">
                  <div className="flex items-start gap-6 mb-6">
                    <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black flex-shrink-0">
                      Q{idx + 1}
                    </div>
                    <div>
                      <h4 className="font-bold text-lg dark:text-white leading-snug">"{turn.question}"</h4>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Your Response</span>
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed italic">"{turn.answer}"</p>
                    </div>
                    {turn.feedback && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                           <div className="h-1 flex-grow bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500" style={{ width: `${turn.feedback.score}%` }}></div>
                           </div>
                           <span className="font-black text-emerald-600">{turn.feedback.score}%</span>
                        </div>
                        <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">"{turn.feedback.feedback}"</p>
                        <div className="flex flex-wrap gap-2">
                           {turn.feedback.strengths.slice(0, 2).map((s, i) => (
                             <span key={i} className="text-[10px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-lg border border-emerald-100">Strength: {s}</span>
                           ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center pt-10">
               <button 
                onClick={() => {
                  setTurns([]);
                  setSessionFinished(false);
                  setViewMode('PRACTICE');
                }}
                className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-lg hover:opacity-90 shadow-2xl transition-all"
               >
                 Start New Session
               </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewCoach;
