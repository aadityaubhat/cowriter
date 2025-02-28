import { HistoryItem } from '@/types';

// Helper function to extract score from evaluation result text
export const extractScoreFromResult = (result: string): number => {
  // Look for patterns like "Rating: 8/10" or "Score: 8" or just a number between 0-10
  const ratingMatch = result.match(/rating:?\s*(\d+)(?:\s*\/\s*10)?/i);
  const scoreMatch = result.match(/score:?\s*(\d+)(?:\s*\/\s*10)?/i);

  if (ratingMatch && ratingMatch[1]) {
    const score = parseInt(ratingMatch[1], 10);
    return score >= 0 && score <= 10 ? score : 5;
  }

  if (scoreMatch && scoreMatch[1]) {
    const score = parseInt(scoreMatch[1], 10);
    return score >= 0 && score <= 10 ? score : 5;
  }

  // Default score if we can't extract one
  return 5;
};

// Load history from localStorage
export const loadHistory = (): HistoryItem[] => {
  if (typeof window === 'undefined') return [];

  const savedHistory = localStorage.getItem('cowriter_history');
  if (savedHistory) {
    return JSON.parse(savedHistory);
  }
  return [];
};

// Save history to localStorage
export const saveHistory = (history: HistoryItem[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('cowriter_history', JSON.stringify(history));
};

// Load configuration from localStorage
export const loadConfig = () => {
  if (typeof window === 'undefined') return null;

  const savedConfig = localStorage.getItem('cowriter_config');
  if (savedConfig) {
    return JSON.parse(savedConfig);
  }
  return null;
};

// Save configuration to localStorage
export const saveConfig = (config: Record<string, unknown>): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('cowriter_config', JSON.stringify(config));
};

// Create a new document
export const createNewDocument = (): HistoryItem => {
  const newId = Date.now().toString();
  return {
    id: newId,
    title: 'Untitled Document',
    content: '',
    timestamp: Date.now(),
    lastModified: Date.now(),
    document_type: 'Custom',
  };
};
