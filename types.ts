
export type Page = 'HOME' | 'ANALYZE' | 'ATS' | 'HISTORY' | 'INTERVIEW';

export interface SkillCategory {
  category: string;
  skills: string[];
}

export interface AnalysisResult {
  id: string;
  timestamp: number;
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  extraSkills: string[];
  groupedSkills: SkillCategory[];
  suggestions: string[];
  summary: string;
  jobTitle?: string;
}

export interface ATSScore {
  total: number;
  formatting: number;
  keywords: number;
  readability: number;
  findings: string[];
  improvements: string[];
}

export interface InterviewTurn {
  role: 'AI' | 'USER';
  text: string;
  timestamp: number;
}

// Added InterviewFeedback interface
export interface InterviewFeedback {
  score: number;
  feedback: string;
  strengths: string[];
}

// Added PracticeTurn interface specifically for structured Q&A feedback
export interface PracticeTurn {
  question: string;
  answer: string;
  feedback: InterviewFeedback;
  timestamp: number;
}

// Added InterviewSession interface for archiving practice sessions
export interface InterviewSession {
  id: string;
  timestamp: number;
  jobTitle: string;
  turns: PracticeTurn[];
  overallScore: number;
}

export enum AnalysisStatus {
  IDLE = 'IDLE',
  PARSING = 'PARSING',
  ANALYZING = 'ANALYZING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}
