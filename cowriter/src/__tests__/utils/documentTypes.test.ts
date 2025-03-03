import { ALL_DOCUMENT_TYPES } from '@/utils/constants';
import { DocumentType } from '@/types';

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

describe('Document Type Selection', () => {
  beforeEach(() => {
    // Clear localStorage and reset mocks before each test
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  it('should initialize with ALL_DOCUMENT_TYPES when nothing is in localStorage', () => {
    // Simulate the initialization logic from the app
    const savedDocTypes = localStorageMock.getItem('selectedDocumentTypes');

    if (!savedDocTypes) {
      localStorageMock.setItem('selectedDocumentTypes', JSON.stringify(ALL_DOCUMENT_TYPES));
    }

    // Verify localStorage.setItem was called with ALL_DOCUMENT_TYPES
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'selectedDocumentTypes',
      JSON.stringify(ALL_DOCUMENT_TYPES)
    );

    // Verify the saved document types match ALL_DOCUMENT_TYPES
    const savedTypes = JSON.parse(localStorageMock.getItem('selectedDocumentTypes') || '[]');
    expect(savedTypes).toEqual(ALL_DOCUMENT_TYPES);
  });

  it('should preserve existing document type selection in localStorage', () => {
    // Set up existing document types in localStorage
    const existingTypes: DocumentType[] = ['Blog', 'LinkedIn', 'Custom'];
    localStorageMock.setItem('selectedDocumentTypes', JSON.stringify(existingTypes));

    // Simulate the initialization logic from the app
    const savedDocTypes = localStorageMock.getItem('selectedDocumentTypes');

    if (!savedDocTypes) {
      localStorageMock.setItem('selectedDocumentTypes', JSON.stringify(ALL_DOCUMENT_TYPES));
    } else {
      try {
        const parsedTypes = JSON.parse(savedDocTypes);
        if (!Array.isArray(parsedTypes) || parsedTypes.length === 0) {
          localStorageMock.setItem('selectedDocumentTypes', JSON.stringify(ALL_DOCUMENT_TYPES));
        }
      } catch (error) {
        localStorageMock.setItem('selectedDocumentTypes', JSON.stringify(ALL_DOCUMENT_TYPES));
      }
    }

    // Verify localStorage.setItem was NOT called again (since we already had valid types)
    expect(localStorageMock.setItem).toHaveBeenCalledTimes(1);

    // Verify the saved document types still match the existing types
    const savedTypes = JSON.parse(localStorageMock.getItem('selectedDocumentTypes') || '[]');
    expect(savedTypes).toEqual(existingTypes);
  });

  it('should handle invalid JSON in localStorage', () => {
    // Set invalid JSON in localStorage
    localStorageMock.setItem('selectedDocumentTypes', 'invalid json');

    // Simulate the initialization logic from the app
    const savedDocTypes = localStorageMock.getItem('selectedDocumentTypes');

    if (!savedDocTypes) {
      localStorageMock.setItem('selectedDocumentTypes', JSON.stringify(ALL_DOCUMENT_TYPES));
    } else {
      try {
        const parsedTypes = JSON.parse(savedDocTypes);
        if (!Array.isArray(parsedTypes) || parsedTypes.length === 0) {
          localStorageMock.setItem('selectedDocumentTypes', JSON.stringify(ALL_DOCUMENT_TYPES));
        }
      } catch (error) {
        localStorageMock.setItem('selectedDocumentTypes', JSON.stringify(ALL_DOCUMENT_TYPES));
      }
    }

    // Verify localStorage.setItem was called with ALL_DOCUMENT_TYPES
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'selectedDocumentTypes',
      JSON.stringify(ALL_DOCUMENT_TYPES)
    );

    // Verify the saved document types match ALL_DOCUMENT_TYPES
    const savedTypes = JSON.parse(localStorageMock.getItem('selectedDocumentTypes') || '[]');
    expect(savedTypes).toEqual(ALL_DOCUMENT_TYPES);
  });

  it('should handle empty array in localStorage', () => {
    // Set empty array in localStorage
    localStorageMock.setItem('selectedDocumentTypes', '[]');

    // Simulate the initialization logic from the app
    const savedDocTypes = localStorageMock.getItem('selectedDocumentTypes');

    if (!savedDocTypes) {
      localStorageMock.setItem('selectedDocumentTypes', JSON.stringify(ALL_DOCUMENT_TYPES));
    } else {
      try {
        const parsedTypes = JSON.parse(savedDocTypes);
        if (!Array.isArray(parsedTypes) || parsedTypes.length === 0) {
          localStorageMock.setItem('selectedDocumentTypes', JSON.stringify(ALL_DOCUMENT_TYPES));
        }
      } catch (error) {
        localStorageMock.setItem('selectedDocumentTypes', JSON.stringify(ALL_DOCUMENT_TYPES));
      }
    }

    // Verify localStorage.setItem was called with ALL_DOCUMENT_TYPES
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'selectedDocumentTypes',
      JSON.stringify(ALL_DOCUMENT_TYPES)
    );

    // Verify the saved document types match ALL_DOCUMENT_TYPES
    const savedTypes = JSON.parse(localStorageMock.getItem('selectedDocumentTypes') || '[]');
    expect(savedTypes).toEqual(ALL_DOCUMENT_TYPES);
  });
});
