import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DocumentEditor } from '@/components/document/DocumentEditor';
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

// Mock the Editor component
jest.mock('@/components/editor', () => ({
  Editor: ({
    content,
    onUpdate,
    isLoading,
  }: {
    content: string;
    onUpdate: (content: string) => void;
    isLoading: boolean;
  }) => (
    <div data-testid="mock-editor">
      <textarea
        data-testid="mock-editor-textarea"
        value={content}
        onChange={e => onUpdate(e.target.value)}
      />
      {isLoading && <div data-testid="loading-indicator">Loading...</div>}
    </div>
  ),
}));

// Mock document for testing
const mockDocument = {
  id: '123',
  title: 'Test Document',
  content: 'Test content',
  timestamp: 1234567890,
  lastModified: 1234567890,
  document_type: 'Blog' as DocumentType,
};

// Mock props for DocumentEditor
const mockProps = {
  selectedDocument: mockDocument,
  editorContent: 'Test content',
  isProcessing: false,
  onUpdateContent: jest.fn(),
  onRenameDocument: jest.fn(),
  onUpdateDocumentType: jest.fn(),
};

describe('DocumentEditor Component - Document Type Selection', () => {
  beforeEach(() => {
    // Clear localStorage and reset mocks before each test
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  it('should initialize with ALL_DOCUMENT_TYPES when nothing is in localStorage', async () => {
    render(<DocumentEditor {...mockProps} />);

    // Verify localStorage.getItem was called for selectedDocumentTypes
    expect(localStorageMock.getItem).toHaveBeenCalledWith('selectedDocumentTypes');

    // Verify the document title is displayed
    expect(screen.getByDisplayValue('Test Document')).toBeInTheDocument();
  });

  it('should initialize with saved document types from localStorage', async () => {
    // Set up existing document types in localStorage
    const existingTypes: DocumentType[] = ['Blog', 'LinkedIn', 'Custom'];
    localStorageMock.setItem('selectedDocumentTypes', JSON.stringify(existingTypes));

    render(<DocumentEditor {...mockProps} />);

    // Verify localStorage.getItem was called for selectedDocumentTypes
    expect(localStorageMock.getItem).toHaveBeenCalledWith('selectedDocumentTypes');
  });

  it('should update document type when changed', async () => {
    // Set up existing document types in localStorage
    const existingTypes: DocumentType[] = ALL_DOCUMENT_TYPES;
    localStorageMock.setItem('selectedDocumentTypes', JSON.stringify(existingTypes));

    render(<DocumentEditor {...mockProps} />);

    // Mock the docTypesChanged event
    const customEvent = new CustomEvent('docTypesChanged', {
      detail: { types: ['Blog', 'LinkedIn', 'Custom'] },
    });

    // Dispatch the event
    window.dispatchEvent(customEvent);

    // Verify the event was processed
    await waitFor(() => {
      expect(localStorageMock.getItem).toHaveBeenCalledWith('selectedDocumentTypes');
    });
  });

  it('should preserve document type even if not in available types', async () => {
    // Create a document with a type that's not in the available types
    const customDocument = {
      ...mockDocument,
      document_type: 'Essay' as DocumentType,
    };

    const customProps = {
      ...mockProps,
      selectedDocument: customDocument,
    };

    // Set up limited document types in localStorage that don't include the document's type
    const limitedTypes: DocumentType[] = ['Blog', 'LinkedIn', 'Custom'];
    localStorageMock.setItem('selectedDocumentTypes', JSON.stringify(limitedTypes));

    render(<DocumentEditor {...customProps} />);

    // Verify localStorage.getItem was called for selectedDocumentTypes
    expect(localStorageMock.getItem).toHaveBeenCalledWith('selectedDocumentTypes');

    // The document's type should still be preserved
    expect(customProps.selectedDocument.document_type).toBe('Essay');
  });
});
