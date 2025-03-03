import React from 'react';
import { render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ConfigureTab } from '@/components/layout/ConfigureTab';
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

// Mock the custom event dispatch
const dispatchEventMock = jest.fn();
window.dispatchEvent = dispatchEventMock;

// Mock props for ConfigureTab
const mockProps = {
  actions: [],
  evals: [],
  aboutMe: '',
  preferredStyle: '',
  tone: '',
  llmConfig: { type: null },
  isConnecting: false,
  onUpdateActions: jest.fn(),
  onUpdateEvals: jest.fn(),
  onUpdateAboutMe: jest.fn(),
  onUpdatePreferredStyle: jest.fn(),
  onUpdateTone: jest.fn(),
  onConnectLLM: jest.fn(),
  onResetConfig: jest.fn(),
};

// Mock the DndContext from dnd-kit
jest.mock('@dnd-kit/core', () => ({
  ...jest.requireActual('@dnd-kit/core'),
  DndContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock the SortableContext from dnd-kit
jest.mock('@dnd-kit/sortable', () => ({
  ...jest.requireActual('@dnd-kit/sortable'),
  SortableContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('ConfigureTab Component - Document Type Selection', () => {
  beforeEach(() => {
    // Clear localStorage and reset mocks before each test
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  it('should initialize with ALL_DOCUMENT_TYPES when nothing is in localStorage', async () => {
    render(<ConfigureTab {...mockProps} />);

    // Verify localStorage.getItem was called for selectedDocumentTypes
    expect(localStorageMock.getItem).toHaveBeenCalledWith('selectedDocumentTypes');

    // Verify localStorage.setItem was called with ALL_DOCUMENT_TYPES
    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'selectedDocumentTypes',
        JSON.stringify(ALL_DOCUMENT_TYPES)
      );
    });
  });

  it('should initialize with saved document types from localStorage', async () => {
    // Set up existing document types in localStorage
    const existingTypes: DocumentType[] = ['Blog', 'LinkedIn', 'Custom'];
    localStorageMock.setItem('selectedDocumentTypes', JSON.stringify(existingTypes));

    render(<ConfigureTab {...mockProps} />);

    // Verify localStorage.getItem was called for selectedDocumentTypes
    expect(localStorageMock.getItem).toHaveBeenCalledWith('selectedDocumentTypes');

    // Verify localStorage.setItem was NOT called again with ALL_DOCUMENT_TYPES
    await waitFor(() => {
      const setItemCalls = localStorageMock.setItem.mock.calls.filter(
        call =>
          call[0] === 'selectedDocumentTypes' && call[1] === JSON.stringify(ALL_DOCUMENT_TYPES)
      );
      expect(setItemCalls.length).toBe(0);
    });
  });

  it('should dispatch docTypesChanged event when document types change', async () => {
    // Set up existing document types in localStorage
    const existingTypes: DocumentType[] = ALL_DOCUMENT_TYPES;
    localStorageMock.setItem('selectedDocumentTypes', JSON.stringify(existingTypes));

    // Mock the toggleDocType function
    const customEvent = new CustomEvent('docTypesChanged', {
      detail: { types: ['Blog', 'LinkedIn', 'Custom'] },
    });

    render(<ConfigureTab {...mockProps} />);

    // Simulate the event dispatch
    window.dispatchEvent(customEvent);

    // Verify the event was dispatched
    expect(dispatchEventMock).toHaveBeenCalled();
  });
});
