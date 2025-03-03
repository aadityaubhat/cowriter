import {
  isLocalStorageAvailable,
  loadHistory,
  saveHistory,
  loadConfig,
  saveConfig,
  createNewDocument,
} from '@/utils/helpers';
import { HistoryItem } from '@/types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

// Replace the global localStorage with our mock
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('localStorage helper functions', () => {
  beforeEach(() => {
    // Clear localStorage and reset mocks before each test
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  describe('isLocalStorageAvailable', () => {
    it('should return true when localStorage is available', () => {
      expect(isLocalStorageAvailable()).toBe(true);
    });

    it('should return false when localStorage throws an error', () => {
      // Mock localStorage.setItem to throw an error
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('localStorage is not available');
      });

      expect(isLocalStorageAvailable()).toBe(false);
    });
  });

  describe('loadHistory and saveHistory', () => {
    it('should save and load history correctly', () => {
      const testHistory: HistoryItem[] = [
        {
          id: '123',
          title: 'Test Document',
          content: 'Test content',
          timestamp: 1234567890,
          lastModified: 1234567890,
          document_type: 'Custom',
        },
      ];

      // Save history
      saveHistory(testHistory);

      // Verify localStorage.setItem was called with the correct arguments
      const setItemCalls = localStorageMock.setItem.mock.calls.filter(
        call => call[0] === 'history'
      );
      expect(setItemCalls.length).toBe(1);
      expect(setItemCalls[0][1]).toBe(JSON.stringify(testHistory));

      // Load history
      const loadedHistory = loadHistory();

      // Verify localStorage.getItem was called
      expect(localStorageMock.getItem).toHaveBeenCalledWith('history');

      // Verify the loaded history matches the saved history
      expect(loadedHistory).toEqual(testHistory);
    });

    it('should return an empty array when no history is saved', () => {
      const loadedHistory = loadHistory();
      expect(loadedHistory).toEqual([]);
    });

    it('should handle invalid JSON in localStorage', () => {
      // Set invalid JSON in localStorage
      localStorageMock.getItem.mockReturnValueOnce('invalid json');

      const loadedHistory = loadHistory();
      expect(loadedHistory).toEqual([]);
    });

    it('should not save empty history array', () => {
      // Clear any previous calls
      jest.clearAllMocks();

      saveHistory([]);

      // Check if setItem was called with history
      const cowriterHistoryCalls = localStorageMock.setItem.mock.calls.filter(
        call => call[0] === 'history'
      );
      expect(cowriterHistoryCalls.length).toBe(0);
    });
  });

  describe('loadConfig and saveConfig', () => {
    it('should save and load config correctly', () => {
      const testConfig = {
        actions: [
          {
            id: '1',
            name: 'Test Action',
            action: 'Test action description',
            emoji: '🔹',
          },
        ],
        aboutMe: 'Test about me',
        preferredStyle: 'Professional',
        tone: 'Formal',
        evals: [],
      };

      // Save config
      saveConfig(testConfig);

      // Verify localStorage.setItem was called with the correct arguments
      const setItemCalls = localStorageMock.setItem.mock.calls.filter(call => call[0] === 'config');
      expect(setItemCalls.length).toBe(1);
      expect(setItemCalls[0][1]).toBe(JSON.stringify(testConfig));

      // Load config
      const loadedConfig = loadConfig();

      // Verify localStorage.getItem was called
      expect(localStorageMock.getItem).toHaveBeenCalledWith('config');

      // Verify the loaded config matches the saved config
      expect(loadedConfig).toEqual(testConfig);
    });

    it('should return default config when no config is saved', () => {
      // Clear any previous calls and localStorage
      jest.clearAllMocks();
      localStorageMock.clear();

      const loadedConfig = loadConfig();
      expect(loadedConfig).toHaveProperty('actions');
      expect(loadedConfig).toHaveProperty('evals');
      expect(loadedConfig).toHaveProperty('aboutMe', '');
      expect(loadedConfig).toHaveProperty('preferredStyle', 'Professional');
      expect(loadedConfig).toHaveProperty('tone', 'Formal');
    });
  });

  describe('createNewDocument', () => {
    it('should create a document with a unique ID', () => {
      // Mock the selectedDocumentTypes in localStorage to return 'Custom'
      localStorageMock.getItem.mockImplementation(key => {
        if (key === 'selectedDocumentTypes') {
          return JSON.stringify(['Custom']);
        }
        return null;
      });

      const doc1 = createNewDocument();
      const doc2 = createNewDocument();

      // Verify the documents have different IDs
      expect(doc1.id).not.toEqual(doc2.id);

      // Verify the document has the expected properties
      expect(doc1).toHaveProperty('title', 'Untitled Document');
      expect(doc1).toHaveProperty('content', '');
      expect(doc1).toHaveProperty('document_type', 'Custom');
      expect(doc1).toHaveProperty('timestamp');
      expect(doc1).toHaveProperty('lastModified');
    });
  });
});
