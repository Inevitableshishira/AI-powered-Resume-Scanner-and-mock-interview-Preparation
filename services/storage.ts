
import { AnalysisResult, InterviewSession } from '../types';

const STORAGE_KEY = 'resumatch_history';
const INTERVIEW_KEY = 'resumatch_interviews';

export const saveAnalysis = (result: AnalysisResult) => {
  const history = getHistory();
  const updated = [result, ...history].slice(0, 20);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

export const getHistory = (): AnalysisResult[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
};

export const deleteAnalysis = (id: string) => {
  const history = getHistory();
  const updated = history.filter(item => item.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};

// Interview Storage
export const saveInterviewSession = (session: InterviewSession) => {
  const history = getInterviewHistory();
  const updated = [session, ...history].slice(0, 20);
  localStorage.setItem(INTERVIEW_KEY, JSON.stringify(updated));
};

export const getInterviewHistory = (): InterviewSession[] => {
  const data = localStorage.getItem(INTERVIEW_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
};

export const deleteInterviewSession = (id: string) => {
  const history = getInterviewHistory();
  const updated = history.filter(item => item.id !== id);
  localStorage.setItem(INTERVIEW_KEY, JSON.stringify(updated));
  return updated;
};
