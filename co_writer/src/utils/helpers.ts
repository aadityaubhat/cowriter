import { v4 as uuidv4 } from 'uuid';
import { HistoryItem, ActionButton, EvalItem, LLMConfig, DocumentType } from '@/types';
import { DEFAULT_ACTIONS, DEFAULT_EVALS, ALL_DOCUMENT_TYPES } from './constants';

// Helper to check if localStorage is available
export function isLocalStorageAvailable() {
  try {
    const testKey = '__test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

// Load history from localStorage
export function loadHistory(): HistoryItem[] {
  if (!isLocalStorageAvailable()) return [];

  try {
    const savedHistory = localStorage.getItem('history');
    if (savedHistory) {
      return JSON.parse(savedHistory);
    }
  } catch (error) {
    console.error('Error loading history:', error);
  }
  return [];
}

// Save history to localStorage
export function saveHistory(history: HistoryItem[]) {
  if (!isLocalStorageAvailable()) return;

  try {
    localStorage.setItem('history', JSON.stringify(history));
  } catch (error) {
    console.error('Error saving history:', error);
  }
}

// Load config from localStorage
export function loadConfig() {
  if (!isLocalStorageAvailable()) {
    return {
      actions: DEFAULT_ACTIONS,
      evals: DEFAULT_EVALS,
      aboutMe: '',
      preferredStyle: 'Professional',
      tone: 'Formal',
    };
  }

  try {
    const savedConfig = localStorage.getItem('config');
    if (savedConfig) {
      return JSON.parse(savedConfig);
    }
  } catch (error) {
    console.error('Error loading config:', error);
  }

  return {
    actions: DEFAULT_ACTIONS,
    evals: DEFAULT_EVALS,
    aboutMe: '',
    preferredStyle: 'Professional',
    tone: 'Formal',
  };
}

// Save config to localStorage
export function saveConfig(config: {
  actions: ActionButton[];
  evals: EvalItem[];
  aboutMe: string;
  preferredStyle: string;
  tone: string;
}) {
  if (!isLocalStorageAvailable()) return;

  try {
    localStorage.setItem('config', JSON.stringify(config));
  } catch (error) {
    console.error('Error saving config:', error);
  }
}

// Create a new document with a unique ID
export function createNewDocument(): HistoryItem {
  // Get the selected document types from localStorage
  let defaultDocType: DocumentType = 'Custom';
  console.log('createNewDocument: Getting selected document types from localStorage');

  try {
    const savedDocTypes = localStorage.getItem('selectedDocumentTypes');
    console.log('createNewDocument: Saved document types:', savedDocTypes);
    if (savedDocTypes) {
      const parsedTypes = JSON.parse(savedDocTypes) as DocumentType[];
      console.log('createNewDocument: Parsed document types:', parsedTypes);
      if (parsedTypes.length > 0) {
        // Use the first selected document type as default
        defaultDocType = parsedTypes[0];
        console.log('createNewDocument: Using first selected document type:', defaultDocType);
      } else {
        // If empty array, use the first type from all document types
        defaultDocType = ALL_DOCUMENT_TYPES[0];
        console.log(
          'createNewDocument: Empty array, using first type from ALL_DOCUMENT_TYPES:',
          defaultDocType
        );
      }
    } else {
      // If no saved types, use the first type from all document types
      defaultDocType = ALL_DOCUMENT_TYPES[0];
      console.log(
        'createNewDocument: No saved types, using first type from ALL_DOCUMENT_TYPES:',
        defaultDocType
      );
    }
  } catch (error) {
    console.error('createNewDocument: Error loading selected document types:', error);
    // If error, use the first type from all document types
    defaultDocType = ALL_DOCUMENT_TYPES[0];
    console.log(
      'createNewDocument: Error, using first type from ALL_DOCUMENT_TYPES:',
      defaultDocType
    );
  }

  const now = Date.now();
  return {
    id: uuidv4(),
    title: 'Untitled Document',
    content: '',
    timestamp: now,
    lastModified: now,
    document_type: defaultDocType,
  };
}

// Extract score from eval result
export function extractScoreFromResult(result: string): number | null {
  // Look for a score pattern like "Score: 7/10" or "Rating: 8 out of 10"
  const scorePattern = /(?:score|rating):\s*(\d+)(?:\s*\/|\s*out of\s*)(\d+)/i;
  const match = result.match(scorePattern);

  if (match) {
    const [, scoreStr, maxStr] = match;
    const score = parseInt(scoreStr, 10);
    const max = parseInt(maxStr, 10);

    if (!isNaN(score) && !isNaN(max) && max > 0) {
      // Normalize to a 0-100 scale
      return (score / max) * 100;
    }
  }

  return null;
}
