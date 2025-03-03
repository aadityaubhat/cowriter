import { createNewDocument } from '@/utils/helpers';
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

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid'),
}));

describe('createNewDocument Function - Document Type Selection', () => {
  beforeEach(() => {
    // Clear localStorage and reset mocks before each test
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  it('should use the first type from ALL_DOCUMENT_TYPES when nothing is in localStorage', () => {
    const newDocument = createNewDocument();

    // Verify localStorage.getItem was called for selectedDocumentTypes
    expect(localStorageMock.getItem).toHaveBeenCalledWith('selectedDocumentTypes');

    // Verify the document has the first type from ALL_DOCUMENT_TYPES
    expect(newDocument.document_type).toBe(ALL_DOCUMENT_TYPES[0]);
  });

  it('should use the first type from saved document types in localStorage', () => {
    // Set up existing document types in localStorage
    const existingTypes: DocumentType[] = ['LinkedIn', 'Custom', 'Blog'];
    localStorageMock.setItem('selectedDocumentTypes', JSON.stringify(existingTypes));

    const newDocument = createNewDocument();

    // Verify localStorage.getItem was called for selectedDocumentTypes
    expect(localStorageMock.getItem).toHaveBeenCalledWith('selectedDocumentTypes');

    // Verify the document has the first type from the saved types
    expect(newDocument.document_type).toBe(existingTypes[0]);
  });

  it('should handle invalid JSON in localStorage', () => {
    // Set invalid JSON in localStorage
    localStorageMock.setItem('selectedDocumentTypes', 'invalid json');

    const newDocument = createNewDocument();

    // Verify localStorage.getItem was called for selectedDocumentTypes
    expect(localStorageMock.getItem).toHaveBeenCalledWith('selectedDocumentTypes');

    // Verify the document has the first type from ALL_DOCUMENT_TYPES
    expect(newDocument.document_type).toBe(ALL_DOCUMENT_TYPES[0]);
  });

  it('should handle empty array in localStorage', () => {
    // Set empty array in localStorage
    localStorageMock.setItem('selectedDocumentTypes', '[]');

    const newDocument = createNewDocument();

    // Verify localStorage.getItem was called for selectedDocumentTypes
    expect(localStorageMock.getItem).toHaveBeenCalledWith('selectedDocumentTypes');

    // Verify the document has the first type from ALL_DOCUMENT_TYPES
    expect(newDocument.document_type).toBe(ALL_DOCUMENT_TYPES[0]);
  });

  it('should create a document with expected properties', () => {
    const newDocument = createNewDocument();

    // Verify the document has the expected properties
    expect(newDocument).toHaveProperty('id', 'mock-uuid');
    expect(newDocument).toHaveProperty('title', 'Untitled Document');
    expect(newDocument).toHaveProperty('content', '');
    expect(newDocument).toHaveProperty('timestamp');
    expect(newDocument).toHaveProperty('lastModified');
    expect(newDocument).toHaveProperty('document_type');
  });
});
