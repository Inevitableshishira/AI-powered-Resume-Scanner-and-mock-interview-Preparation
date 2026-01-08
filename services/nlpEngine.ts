
import { STOPWORDS } from '../constants';

/**
 * Basic NLP Engine implementing TF-IDF and Cosine Similarity in TypeScript
 */

export const tokenize = (text: string): string[] => {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(token => token.length > 2 && !STOPWORDS.has(token));
};

const getTermFrequency = (tokens: string[]): Map<string, number> => {
  const tf = new Map<string, number>();
  tokens.forEach(token => {
    tf.set(token, (tf.get(token) || 0) + 1);
  });
  return tf;
};

export const calculateCosineSimilarity = (text1: string, text2: string): number => {
  const tokens1 = tokenize(text1);
  const tokens2 = tokenize(text2);
  
  if (tokens1.length === 0 || tokens2.length === 0) return 0;

  const tf1 = getTermFrequency(tokens1);
  const tf2 = getTermFrequency(tokens2);

  const allTerms = new Set([...tf1.keys(), ...tf2.keys()]);
  
  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;

  allTerms.forEach(term => {
    const v1 = tf1.get(term) || 0;
    const v2 = tf2.get(term) || 0;
    dotProduct += v1 * v2;
    mag1 += v1 * v1;
    mag2 += v2 * v2;
  });

  const magnitude = Math.sqrt(mag1) * Math.sqrt(mag2);
  if (magnitude === 0) return 0;
  
  return (dotProduct / magnitude) * 100;
};

export const extractSkillsFromText = (text: string, taxonomy: Record<string, string[]>): string[] => {
  const tokens = new Set(tokenize(text));
  const foundSkills: string[] = [];
  
  Object.values(taxonomy).flat().forEach(skill => {
    if (text.toLowerCase().includes(skill.toLowerCase())) {
      foundSkills.push(skill);
    }
  });
  
  return Array.from(new Set(foundSkills));
};
