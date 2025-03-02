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

// Check if localStorage is available and working
export const isLocalStorageAvailable = (): boolean => {
  if (typeof window === 'undefined') return false;

  try {
    // Try to set and get a test item
    const testKey = '_test_localStorage_';
    localStorage.setItem(testKey, 'test');
    const result = localStorage.getItem(testKey);
    localStorage.removeItem(testKey);

    // Check if the test was successful
    return result === 'test';
  } catch (e) {
    return false;
  }
};

// Load history from localStorage
export const loadHistory = (): HistoryItem[] => {
  if (typeof window === 'undefined' || !isLocalStorageAvailable()) return [];

  try {
    const savedHistory = localStorage.getItem('cowriter_history');
    if (savedHistory) {
      const parsedHistory = JSON.parse(savedHistory);
      // Validate that we have an array of history items
      if (Array.isArray(parsedHistory) && parsedHistory.length > 0) {
        return parsedHistory;
      }
    }
    return [];
  } catch (error) {
    console.error('Error loading history from localStorage:', error);
    return [];
  }
};

// Save history to localStorage
export const saveHistory = (history: HistoryItem[]): void => {
  if (typeof window === 'undefined' || !isLocalStorageAvailable()) return;

  try {
    // Only save if we have valid history items
    if (Array.isArray(history) && history.length > 0) {
      localStorage.setItem('cowriter_history', JSON.stringify(history));
    }
  } catch (error) {
    console.error('Error saving history to localStorage:', error);
  }
};

// Load configuration from localStorage
export const loadConfig = () => {
  if (typeof window === 'undefined' || !isLocalStorageAvailable()) return null;

  const savedConfig = localStorage.getItem('cowriter_config');
  if (savedConfig) {
    return JSON.parse(savedConfig);
  }
  return null;
};

// Save configuration to localStorage
export const saveConfig = (config: Record<string, unknown>): void => {
  if (typeof window === 'undefined' || !isLocalStorageAvailable()) return;
  localStorage.setItem('cowriter_config', JSON.stringify(config));
};

// Create a new document with a guaranteed unique ID
export const createNewDocument = (): HistoryItem => {
  // Generate a unique ID using timestamp + random string
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 10);
  const newId = `${timestamp}-${randomStr}`;

  return {
    id: newId,
    title: 'Untitled Document',
    content: '',
    timestamp: timestamp,
    lastModified: timestamp,
    document_type: 'Custom',
  };
};
