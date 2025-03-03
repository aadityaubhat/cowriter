import { Input } from '@/components/ui/input';
import { Editor } from '@/components/editor';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { HistoryItem, DocumentType } from '@/types';
import { getDocumentTypeIcon } from '@/utils/documentIcons';
import { useEffect, useState } from 'react';
import { ALL_DOCUMENT_TYPES } from '@/utils/constants';

interface DocumentEditorProps {
  selectedDocument: HistoryItem | null;
  editorContent: string;
  isProcessing: boolean;
  onUpdateContent: (content: string) => void;
  onRenameDocument: (id: string, newTitle: string) => void;
  onUpdateDocumentType: (id: string, type: DocumentType) => void;
}

export function DocumentEditor({
  selectedDocument,
  editorContent,
  isProcessing,
  onUpdateContent,
  onRenameDocument,
  onUpdateDocumentType,
}: DocumentEditorProps) {
  // State to store available document types from configuration - initialize with empty array
  const [availableDocTypes, setAvailableDocTypes] = useState<DocumentType[]>([]);

  // Load available document types from localStorage
  useEffect(() => {
    console.log('DocumentEditor: Loading document types from storage');
    const savedDocTypes = localStorage.getItem('selectedDocumentTypes');
    console.log('DocumentEditor: Saved document types:', savedDocTypes);
    if (savedDocTypes) {
      try {
        const parsedTypes = JSON.parse(savedDocTypes) as DocumentType[];
        console.log('DocumentEditor: Parsed document types:', parsedTypes);
        if (parsedTypes.length > 0) {
          setAvailableDocTypes(parsedTypes);
          console.log('DocumentEditor: Set available document types to:', parsedTypes);
        } else {
          // If empty array, set default to all document types
          setAvailableDocTypes(ALL_DOCUMENT_TYPES);
          console.log('DocumentEditor: Empty array, set to ALL_DOCUMENT_TYPES');
        }
      } catch (error) {
        console.error('DocumentEditor: Error parsing saved document types:', error);
        // If error, set default to all document types
        setAvailableDocTypes(ALL_DOCUMENT_TYPES);
        console.log('DocumentEditor: Error parsing, set to ALL_DOCUMENT_TYPES');
      }
    } else {
      // If no saved types, set default to all document types
      setAvailableDocTypes(ALL_DOCUMENT_TYPES);
      console.log('DocumentEditor: No saved types, set to ALL_DOCUMENT_TYPES');
    }

    // Add event listener for custom docTypesChanged event
    const handleDocTypesChanged = (e: CustomEvent) => {
      console.log('DocumentEditor: Received docTypesChanged event:', e.detail.types);
      setAvailableDocTypes(e.detail.types);
    };

    window.addEventListener('docTypesChanged', handleDocTypesChanged as EventListener);

    // Clean up event listener
    return () => {
      window.removeEventListener('docTypesChanged', handleDocTypesChanged as EventListener);
    };
  }, []);

  if (!selectedDocument) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <p className="text-muted-foreground">No document selected</p>
      </div>
    );
  }

  // If the current document type is not in available types, default to the first available
  const currentDocType = selectedDocument.document_type;
  const isCurrentTypeAvailable = availableDocTypes.includes(currentDocType);

  // Log the current document type and available types
  console.log('Current document type:', currentDocType);
  console.log('Is current type available:', isCurrentTypeAvailable);
  console.log('Available document types:', availableDocTypes);

  return (
    <div className="flex h-full flex-col">
      {/* Document Title Input */}
      <div className="mb-2 flex flex-col gap-2 border-b border-border/40 px-4 pb-3 pt-3">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <Input
              value={selectedDocument.title}
              onChange={e => {
                const newTitle = e.target.value;
                onRenameDocument(selectedDocument.id, newTitle);
              }}
              placeholder="Document Title"
              className="rounded-none border-0 bg-transparent px-0 py-1 text-xl font-medium focus-visible:ring-1"
              aria-label="Document Title"
            />
          </div>
          <div className="ml-2">
            <Select
              value={currentDocType}
              onValueChange={value => {
                console.log('Document type changed to:', value);
                onUpdateDocumentType(selectedDocument.id, value as DocumentType);
              }}
            >
              <SelectTrigger className="h-9 min-w-[140px] border-muted bg-muted/50 font-medium">
                <SelectValue placeholder="Document Type" />
              </SelectTrigger>
              <SelectContent>
                {/* Show current document type first if not in available types */}
                {!isCurrentTypeAvailable && (
                  <SelectItem
                    key={currentDocType}
                    value={currentDocType}
                    className="flex items-center"
                  >
                    {getDocumentTypeIcon(currentDocType, true)}
                    <span>{currentDocType}</span>
                  </SelectItem>
                )}
                {/* Then show all available document types */}
                {availableDocTypes.map(type => (
                  <SelectItem key={type} value={type} className="flex items-center">
                    {getDocumentTypeIcon(type, true)}
                    <span>{type}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          Last modified: {new Date(selectedDocument.lastModified).toLocaleString()}
        </div>
      </div>
      <div className="flex-1">
        <Editor content={editorContent} onUpdate={onUpdateContent} isLoading={isProcessing} />
      </div>
    </div>
  );
}
