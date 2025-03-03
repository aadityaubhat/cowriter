import { renderHook, act } from '@testing-library/react';
import { useCoWriterState } from '@/hooks/useCoWriterState';
import * as helpers from '@/utils/helpers';

// Mock the helpers module
jest.mock('@/utils/helpers', () => ({
  ...jest.requireActual('@/utils/helpers'),
  loadHistory: jest.fn(),
  saveHistory: jest.fn(),
  loadConfig: jest.fn(),
  saveConfig: jest.fn(),
  createNewDocument: jest.fn(),
  isLocalStorageAvailable: jest.fn(),
}));

describe('useCoWriterState', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    (helpers.isLocalStorageAvailable as jest.Mock).mockReturnValue(true);
    (helpers.loadHistory as jest.Mock).mockReturnValue([]);
    (helpers.loadConfig as jest.Mock).mockReturnValue(null);
    (helpers.createNewDocument as jest.Mock).mockReturnValue({
      id: 'test-id',
      title: 'Untitled Document',
      content: '',
      timestamp: 1234567890,
      lastModified: 1234567890,
      document_type: 'Custom',
    });
  });

  it('should initialize with a new document when no history exists', () => {
    const { result } = renderHook(() => useCoWriterState());

    expect(helpers.loadHistory).toHaveBeenCalled();
    expect(helpers.createNewDocument).toHaveBeenCalled();
    expect(result.current.history.length).toBe(1);
    expect(result.current.selectedHistoryId).toBe('test-id');
    expect(result.current.editorContent).toBe('');
  });

  it('should load existing history if available', () => {
    const mockHistory = [
      {
        id: 'existing-id',
        title: 'Existing Document',
        content: 'Existing content',
        timestamp: 1234567890,
        lastModified: 1234567890,
        document_type: 'Custom',
      },
    ];

    (helpers.loadHistory as jest.Mock).mockReturnValue(mockHistory);

    const { result } = renderHook(() => useCoWriterState());

    expect(helpers.loadHistory).toHaveBeenCalled();
    expect(helpers.createNewDocument).not.toHaveBeenCalled();
    expect(result.current.history).toEqual(mockHistory);
    expect(result.current.selectedHistoryId).toBe('existing-id');
    expect(result.current.editorContent).toBe('Existing content');
  });

  it('should create a new document when handleNewDocument is called', () => {
    const newDocument = {
      id: 'new-id',
      title: 'Untitled Document',
      content: '',
      timestamp: 1234567890,
      lastModified: 1234567890,
      document_type: 'Custom',
    };

    (helpers.createNewDocument as jest.Mock).mockReturnValue(newDocument);

    const { result } = renderHook(() => useCoWriterState());

    act(() => {
      result.current.handleNewDocument();
    });

    expect(helpers.createNewDocument).toHaveBeenCalledTimes(2); // Once on init, once on handleNewDocument
    expect(result.current.history.length).toBe(2);
    expect(result.current.selectedHistoryId).toBe('new-id');
    expect(result.current.editorContent).toBe('');
  });

  it('should delete a document when handleDeleteDocument is called', () => {
    const mockHistory = [
      {
        id: 'doc1',
        title: 'Document 1',
        content: 'Content 1',
        timestamp: 1234567890,
        lastModified: 1234567890,
        document_type: 'Custom',
      },
      {
        id: 'doc2',
        title: 'Document 2',
        content: 'Content 2',
        timestamp: 1234567891,
        lastModified: 1234567891,
        document_type: 'Custom',
      },
    ];

    (helpers.loadHistory as jest.Mock).mockReturnValue(mockHistory);

    const { result } = renderHook(() => useCoWriterState());

    act(() => {
      result.current.handleDeleteDocument('doc1');
    });

    expect(result.current.history.length).toBe(1);
    expect(result.current.history[0].id).toBe('doc2');
    expect(result.current.selectedHistoryId).toBe('doc2');
    expect(result.current.editorContent).toBe('Content 2');
  });

  it('should create a new document when the last document is deleted', () => {
    const mockHistory = [
      {
        id: 'doc1',
        title: 'Document 1',
        content: 'Content 1',
        timestamp: 1234567890,
        lastModified: 1234567890,
        document_type: 'Custom',
      },
    ];

    const newDocument = {
      id: 'new-id',
      title: 'Untitled Document',
      content: '',
      timestamp: 1234567890,
      lastModified: 1234567890,
      document_type: 'Custom',
    };

    (helpers.loadHistory as jest.Mock).mockReturnValue(mockHistory);
    (helpers.createNewDocument as jest.Mock).mockReturnValue(newDocument);

    const { result } = renderHook(() => useCoWriterState());

    act(() => {
      result.current.handleDeleteDocument('doc1');
    });

    expect(helpers.createNewDocument).toHaveBeenCalled();
    expect(result.current.history.length).toBe(1);
    expect(result.current.selectedHistoryId).toBe('new-id');
    expect(result.current.editorContent).toBe('');
  });

  it('should rename a document when handleRenameDocument is called', () => {
    const mockHistory = [
      {
        id: 'doc1',
        title: 'Document 1',
        content: 'Content 1',
        timestamp: 1234567890,
        lastModified: 1234567890,
        document_type: 'Custom',
      },
    ];

    (helpers.loadHistory as jest.Mock).mockReturnValue(mockHistory);

    const { result } = renderHook(() => useCoWriterState());

    act(() => {
      result.current.handleRenameDocument('doc1', 'New Title');
    });

    expect(result.current.history[0].title).toBe('New Title');
  });

  it('should update document type when handleUpdateDocumentType is called', () => {
    const mockHistory = [
      {
        id: 'doc1',
        title: 'Document 1',
        content: 'Content 1',
        timestamp: 1234567890,
        lastModified: 1234567890,
        document_type: 'Custom',
      },
    ];

    (helpers.loadHistory as jest.Mock).mockReturnValue(mockHistory);

    const { result } = renderHook(() => useCoWriterState());

    act(() => {
      result.current.handleUpdateDocumentType('doc1', 'Blog');
    });

    expect(result.current.history[0].document_type).toBe('Blog');
  });

  it('should update editor content', () => {
    const mockHistory = [
      {
        id: 'doc1',
        title: 'Document 1',
        content: 'Content 1',
        timestamp: 1234567890,
        lastModified: 1234567890,
        document_type: 'Custom',
      },
    ];

    (helpers.loadHistory as jest.Mock).mockReturnValue(mockHistory);

    const { result } = renderHook(() => useCoWriterState());

    // Mock the Date.now() to return a consistent value for testing
    const originalDateNow = Date.now;
    Date.now = jest.fn(() => 1234567899);

    act(() => {
      result.current.setEditorContent('Updated content');
    });

    // We can't easily test the debounced update in this test environment
    // So we'll just verify the editor content was updated
    expect(result.current.editorContent).toBe('Updated content');

    // Restore original Date.now
    Date.now = originalDateNow;
  });

  it('should handle localStorage not being available', () => {
    // Mock console.error to prevent error output in tests
    const originalConsoleError = console.error;
    console.error = jest.fn();

    (helpers.isLocalStorageAvailable as jest.Mock).mockReturnValue(false);
    (helpers.loadHistory as jest.Mock).mockImplementation(() => {
      throw new Error('localStorage not available');
    });

    const { result } = renderHook(() => useCoWriterState());

    expect(helpers.createNewDocument).toHaveBeenCalled();
    expect(result.current.history.length).toBe(1);

    // Restore console.error
    console.error = originalConsoleError;
  });
});
