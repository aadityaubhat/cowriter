import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X as XIcon, ChevronLeft, ChevronRight, Trash2, Edit, Check } from 'lucide-react';
import { HistoryItem, DocumentType } from '@/types';
import { getDocumentTypeIcon } from '@/utils/documentIcons';
import { ALL_DOCUMENT_TYPES } from '@/utils/constants';

interface HistorySidebarProps {
  history: HistoryItem[];
  selectedHistoryId: string | null;
  isHistoryOpen: boolean;
  onSelectHistory: (id: string) => void;
  onNewDocument: () => void;
  onDeleteDocument: (id: string) => void;
  onRenameDocument: (id: string, newTitle: string) => void;
  onUpdateDocumentType: (id: string, type: DocumentType) => void;
  onToggleHistory: () => void;
}

export function HistorySidebar({
  history,
  selectedHistoryId,
  isHistoryOpen,
  onSelectHistory,
  onNewDocument,
  onDeleteDocument,
  onRenameDocument,
  onToggleHistory,
}: HistorySidebarProps) {
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);

  // State to store available document types from configuration - initialize with empty array
  const [availableDocTypes, setAvailableDocTypes] = useState<DocumentType[]>([]);

  // Load available document types from localStorage
  useEffect(() => {
    console.log('HistorySidebar: Loading document types from storage');
    const savedDocTypes = localStorage.getItem('selectedDocumentTypes');
    console.log('HistorySidebar: Saved document types:', savedDocTypes);
    if (savedDocTypes) {
      try {
        const parsedTypes = JSON.parse(savedDocTypes) as DocumentType[];
        console.log('HistorySidebar: Parsed document types:', parsedTypes);
        if (parsedTypes.length > 0) {
          setAvailableDocTypes(parsedTypes);
          console.log('HistorySidebar: Set available document types to:', parsedTypes);
        } else {
          // If empty array, set default to all document types
          setAvailableDocTypes(ALL_DOCUMENT_TYPES);
          console.log('HistorySidebar: Empty array, set to ALL_DOCUMENT_TYPES');
        }
      } catch (error) {
        console.error('HistorySidebar: Error parsing saved document types:', error);
        // If error, set default to all document types
        setAvailableDocTypes(ALL_DOCUMENT_TYPES);
        console.log('HistorySidebar: Error parsing, set to ALL_DOCUMENT_TYPES');
      }
    } else {
      // If no saved types, set default to all document types
      setAvailableDocTypes(ALL_DOCUMENT_TYPES);
      console.log('HistorySidebar: No saved types, set to ALL_DOCUMENT_TYPES');
    }

    // Add event listener for custom docTypesChanged event
    const handleDocTypesChanged = (e: CustomEvent) => {
      console.log('HistorySidebar: Received docTypesChanged event:', e.detail.types);
      setAvailableDocTypes(e.detail.types);
    };

    window.addEventListener('docTypesChanged', handleDocTypesChanged as EventListener);

    // Clean up event listener
    return () => {
      window.removeEventListener('docTypesChanged', handleDocTypesChanged as EventListener);
    };
  }, []);

  // Update document types that are no longer available
  useEffect(() => {
    // We're removing this effect to ensure historical document types are preserved
    // regardless of what document types are selected in the configuration
  }, []);

  // Focus input when editing starts
  useEffect(() => {
    if (editingTitleId && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [editingTitleId]);

  // Handle title edit submission
  const handleTitleSubmit = (id: string) => {
    if (editingTitle.trim()) {
      onRenameDocument(id, editingTitle);
    }
    setEditingTitleId(null);
    setEditingTitle('');
  };

  return (
    <div
      className={`flex h-full flex-col border-r border-border/40 bg-muted/20 transition-all ${
        isHistoryOpen ? 'w-64' : 'w-0'
      }`}
    >
      {isHistoryOpen && (
        <>
          <div className="flex items-center justify-between border-b border-border/40 p-4">
            <h2 className="text-lg font-medium">History</h2>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onNewDocument}
                title="New Document"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onToggleHistory}
                title="Hide History"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <div className="space-y-1">
              {history.map(item => (
                <div key={item.id} className="group relative mb-1">
                  <div
                    className={`flex cursor-pointer flex-col rounded-md p-2 transition-colors ${
                      selectedHistoryId === item.id ? 'bg-muted/80' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => onSelectHistory(item.id)}
                  >
                    <div className="flex items-center justify-between">
                      {editingTitleId === item.id ? (
                        <div className="flex w-full items-center gap-1">
                          <Input
                            ref={titleInputRef}
                            value={editingTitle}
                            onChange={e => setEditingTitle(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                handleTitleSubmit(item.id);
                              } else if (e.key === 'Escape') {
                                setEditingTitleId(null);
                              }
                            }}
                            className="h-7 text-sm"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            onClick={() => handleTitleSubmit(item.id)}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            onClick={() => setEditingTitleId(null)}
                          >
                            <XIcon className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {getDocumentTypeIcon(item.document_type)}
                          <span className="line-clamp-1 text-sm">{item.title}</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                      <div>{new Date(item.lastModified).toLocaleDateString()}</div>
                      <div className="invisible flex gap-1 group-hover:visible">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={e => {
                            e.stopPropagation();
                            setEditingTitleId(item.id);
                            setEditingTitle(item.title);
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive"
                          onClick={e => {
                            e.stopPropagation();
                            onDeleteDocument(item.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="w-full"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
      {!isHistoryOpen && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-4 top-4 h-8 w-8"
          onClick={onToggleHistory}
          title="Show History"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
