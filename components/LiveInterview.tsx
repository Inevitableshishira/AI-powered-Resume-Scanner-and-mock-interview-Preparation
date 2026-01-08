
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { InterviewTurn } from '../types';

interface Props {
  resumeText: string;
  jobDescription: string;
}

const LiveInterview: React.FC<Props> = ({ resumeText, jobDescription }) => {
  const [isActive, setIsActive] = useState(false);
  const [dialogue, setDialogue] = useState<InterviewTurn[]>([]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [rms, setRms] = useState(0); // For visualizer

  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef(new Set<AudioBufferSourceNode>());

  // Base64 helper manually as per instructions
  const encodeBase64 = (bytes: Uint8Array) => {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  };

  const decodeBase64 = (base64: string) => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext) => {
    const dataInt16 = new Int16Array(data.buffer);
    const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < dataInt16.length; i++) {
      channelData[i] = dataInt16[i] / 32768.0;
    }
    return buffer;
  };

  const startSession = async () => {
    if (isActive) return;

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Initialize Audio
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const source = inputCtx.createMediaStreamSource(stream);
    const processor = inputCtx.createScriptProcessor(4096, 1, 1);

    const sessionPromise = ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      callbacks: {
        onopen: () => {
          setIsActive(true);
          source.connect(processor);
          processor.connect(inputCtx.destination);
        },
        onmessage: async (message) => {
          // Handle Audio
          const audioBase64 = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (audioBase64 && audioContextRef.current) {
            const ctx = audioContextRef.current;
            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
            const buffer = await decodeAudioData(decodeBase64(audioBase64), ctx);
            const node = ctx.createBufferSource();
            node.buffer = buffer;
            node.connect(ctx.destination);
            node.start(nextStartTimeRef.current);
            nextStartTimeRef.current += buffer.duration;
            sourcesRef.current.add(node);
            node.onended = () => sourcesRef.current.delete(node);
          }

          // Handle Transcriptions
          if (message.serverContent?.outputTranscription) {
            const text = message.serverContent.outputTranscription.text;
            setDialogue(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'AI') {
                    return [...prev.slice(0, -1), { ...last, text: last.text + text }];
                }
                return [...prev, { role: 'AI', text, timestamp: Date.now() }];
            });
          }

          if (message.serverContent?.inputTranscription) {
            const text = message.serverContent.inputTranscription.text;
            setDialogue(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'USER') {
                    return [...prev.slice(0, -1), { ...last, text: last.text + text }];
                }
                return [...prev, { role: 'USER', text, timestamp: Date.now() }];
            });
          }

          if (message.serverContent?.interrupted) {
            sourcesRef.current.forEach(s => s.stop());
            sourcesRef.current.clear();
            nextStartTimeRef.current = 0;
          }
        },
        onclose: () => setIsActive(false),
        onerror: (e) => console.error("Live session error:", e)
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
        inputAudioTranscription: {},
        outputAudioTranscription: {},
        systemInstruction: `You are an elite executive interviewer. You are interviewing a candidate for a role.
        Context: ${jobDescription}.
        Candidate Background: ${resumeText}.
        Start by introducing yourself and asking a direct behavioral question based on their resume. 
        Be professional, slightly challenging, and wait for them to finish speaking before responding.`
      }
    });

    processor.onaudioprocess = (e) => {
      const input = e.inputBuffer.getChannelData(0);
      
      // Calculate RMS for visualization
      let sum = 0;
      for (let i = 0; i < input.length; i++) sum += input[i] * input[i];
      setRms(Math.sqrt(sum / input.length));

      const int16 = new Int16Array(input.length);
      for (let i = 0; i < input.length; i++) int16[i] = input[i] * 32768;
      
      sessionPromise.then(session => {
        session.sendRealtimeInput({
          media: {
            data: encodeBase64(new Uint8Array(int16.buffer)),
            mimeType: 'audio/pcm;rate=16000'
          }
        });
      });
    };

    sessionRef.current = await sessionPromise;
  };

  const stopSession = () => {
    sessionRef.current?.close();
    setIsActive(false);
    setRms(0);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 page-transition-enter">
      <div className="glass-card rounded-[3rem] p-12 overflow-hidden relative">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h2 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-2">Live Interview Theater</h2>
            <p className="text-slate-500 font-medium">Full-duplex voice simulation with real-time intelligence.</p>
          </div>
          
          <button 
            onClick={isActive ? stopSession : startSession}
            className={`px-10 py-5 rounded-[2rem] font-black text-lg shadow-2xl transition-all active:scale-95 flex items-center gap-4 ${
              isActive 
              ? 'bg-rose-500 text-white hover:bg-rose-600 shadow-rose-500/30' 
              : 'bg-brand-600 text-white hover:bg-brand-700 shadow-brand-500/30'
            }`}
          >
            <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-white animate-pulse' : 'bg-white/40'}`}></div>
            {isActive ? 'End Session' : 'Begin Simulation'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Audio Visualizer Column */}
          <div className="lg:col-span-1 space-y-8">
            <div className="glass-card rounded-[2.5rem] p-10 flex flex-col items-center justify-center h-80 bg-slate-900 dark:bg-slate-950 shadow-inner">
               <div className="flex items-center gap-1 h-32">
                  {[...Array(12)].map((_, i) => (
                    <div 
                      key={i} 
                      className="bar w-2 bg-brand-500 rounded-full" 
                      style={{ height: `${isActive ? Math.max(4, rms * 300 * (1 + Math.sin(i + Date.now()/100))) : 4}px` }}
                    ></div>
                  ))}
               </div>
               <p className="mt-8 text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">
                 {isActive ? 'Live Audio Stream' : 'Microphone Ready'}
               </p>
            </div>
            
            <div className="glass-card rounded-[2.5rem] p-8 border-brand-500/20">
               <h4 className="font-black text-sm uppercase tracking-widest text-brand-600 dark:text-brand-400 mb-4">Interview Tips</h4>
               <ul className="space-y-4">
                  <li className="flex gap-3 text-sm text-slate-500 font-medium">
                    <span className="text-brand-500">01</span>
                    Speak clearly and wait for the AI to complete its question.
                  </li>
                  <li className="flex gap-3 text-sm text-slate-500 font-medium">
                    <span className="text-brand-500">02</span>
                    Use the STAR method for behavioral answers.
                  </li>
               </ul>
            </div>
          </div>

          {/* Transcript Column */}
          <div className="lg:col-span-2 h-[500px] flex flex-col glass-card rounded-[2.5rem] overflow-hidden border-slate-200 dark:border-slate-800">
             <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Continuous Dialogue</span>
                {isActive && <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 animate-pulse">Encrypted Session</span>}
             </div>
             <div className="flex-grow overflow-y-auto p-8 space-y-8 scroll-smooth" id="dialogue-box">
                {dialogue.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center opacity-30">
                    <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                    <p className="font-bold">Transcript will appear here...</p>
                  </div>
                ) : (
                  dialogue.map((turn, i) => (
                    <div key={i} className={`flex ${turn.role === 'AI' ? 'justify-start' : 'justify-end'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
                      <div className={`max-w-[85%] rounded-[2rem] p-6 shadow-sm ${
                        turn.role === 'AI' 
                        ? 'bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-900 dark:text-slate-100' 
                        : 'bg-brand-600 text-white shadow-brand-500/20'
                      }`}>
                        <p className="text-sm font-medium leading-relaxed">{turn.text}</p>
                        <span className="text-[9px] font-bold opacity-40 uppercase tracking-widest mt-2 block">{turn.role}</span>
                      </div>
                    </div>
                  ))
                )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveInterview;
