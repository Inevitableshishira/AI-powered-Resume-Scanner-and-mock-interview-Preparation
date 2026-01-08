
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, ATSScore, InterviewFeedback } from "../types";

const MODEL_NAME = "gemini-3-flash-preview";
// Use gemini-3-pro-preview for complex reasoning and evaluation tasks
const COMPLEX_MODEL = "gemini-3-pro-preview";

export const performAIAnalysis = async (resumeText: string, jobDescription: string): Promise<Partial<AnalysisResult>> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    Analyze the following Resume against the Job Description.
    1. Extract skills and group them into these categories: Programming, Frameworks, Databases, Tools, AI/ML.
    2. Identify skills present in the Job Description but missing in the Resume.
    3. Identify extra skills in the Resume not required by the Job Description.
    4. Provide a 2-sentence summary of the candidate's fitness.
    5. Provide 3 specific, actionable suggestions for improving the resume for this specific role.

    Resume: ${resumeText}
    Job Description: ${jobDescription}
  `;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          groupedSkills: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING },
                skills: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            }
          },
          missingSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
          extraSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
          suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["summary", "groupedSkills", "missingSkills", "extraSkills", "suggestions"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
};

export const generateATSReport = async (resumeText: string): Promise<ATSScore> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Perform a deep ATS (Applicant Tracking System) audit on this resume. 
  Check for:
  - Formatting (is it parseable?)
  - Keyword density (generic business/tech terms)
  - Readability (structure, dates, bullet points)
  
  Resume: ${resumeText}`;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          total: { type: Type.NUMBER },
          formatting: { type: Type.NUMBER },
          keywords: { type: Type.NUMBER },
          readability: { type: Type.NUMBER },
          findings: { type: Type.ARRAY, items: { type: Type.STRING } },
          improvements: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["total", "formatting", "keywords", "readability", "findings", "improvements"]
      }
    }
  });
  return JSON.parse(response.text || "{}");
};

// Implemented generateInterviewQuestion
export const generateInterviewQuestion = async (resumeText: string, jobDescription: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: COMPLEX_MODEL,
    contents: `Based on the following resume and job description, generate one specific and challenging interview question for this candidate.
    
    Resume: ${resumeText}
    Job Description: ${jobDescription}`,
  });
  return response.text || "Could you describe a technical challenge you recently solved?";
};

// Implemented evaluateInterviewAnswer
export const evaluateInterviewAnswer = async (question: string, answer: string, jobDescription: string): Promise<InterviewFeedback> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: COMPLEX_MODEL,
    contents: `Evaluate the candidate's response to the interview question within the context of the role requirements.
    
    Question: ${question}
    Answer: ${answer}
    Job Description: ${jobDescription}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER, description: "A percentage score from 0 to 100" },
          feedback: { type: Type.STRING, description: "Detailed constructive criticism" },
          strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific skills demonstrated" }
        },
        required: ["score", "feedback", "strengths"]
      }
    }
  });
  return JSON.parse(response.text || '{"score": 0, "feedback": "Evaluation unavailable", "strengths": []}');
};
