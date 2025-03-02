import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronUp, Edit2, Plus, FileText, X as XIcon, AlertTriangle } from 'lucide-react';
import { HistoryItem, DocumentType } from '@/types';
import { getDocumentTypeIcon } from '@/utils/documentIcons';
import { isLocalStorageAvailable } from '@/utils/helpers';

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
  onUpdateDocumentType,
  onToggleHistory,
}: HistorySidebarProps) {
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [storageAvailable, setStorageAvailable] = useState(true);

  // Check if localStorage is available
  useEffect(() => {
    setStorageAvailable(isLocalStorageAvailable());
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
      className={`flex border-r border-border/40 bg-background/95 backdrop-blur transition-all duration-300 supports-[backdrop-filter]:bg-background/60 ${isHistoryOpen ? 'w-64' : 'w-14'}`}
    >
      <div className="flex h-full w-full flex-col">
        <div className="flex h-14 items-center justify-between border-b border-border/40 px-4">
          {isHistoryOpen ? (
            <>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Documents</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 hover:bg-muted"
                  onClick={onToggleHistory}
                >
                  <ChevronUp className="h-4 w-4 rotate-90" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex w-full flex-col items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 hover:bg-muted"
                onClick={onToggleHistory}
              >
                <ChevronUp className="h-4 w-4 -rotate-90" />
              </Button>
            </div>
          )}
        </div>

        {isHistoryOpen && (
          <>
            {!storageAvailable && (
              <div className="m-2 rounded-md border border-yellow-500/50 bg-yellow-500/10 p-2 text-xs text-yellow-600">
                <div className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  <span className="font-medium">Warning:</span>
                </div>
                <p className="mt-1">
                  Local storage is not available. Your documents won&apos;t be saved when you close
                  the browser.
                </p>
              </div>
            )}
            <div className="flex-1 overflow-y-auto p-2">
              <Button
                variant="ghost"
                className="mb-2 w-full justify-start text-sm hover:bg-muted/50"
                onClick={onNewDocument}
              >
                <Plus className="mr-2 h-4 w-4" />
                New Document
              </Button>
              {history.map(item => (
                <div key={item.id} className="group relative mb-1">
                  <Button
                    variant="ghost"
                    className={`w-full justify-start text-left text-sm ${selectedHistoryId === item.id ? 'bg-muted/80 font-medium' : 'hover:bg-muted/50'}`}
                    onClick={() => onSelectHistory(item.id)}
                  >
                    <div className="flex-1 truncate">
                      {editingTitleId === item.id ? (
                        <form
                          onSubmit={e => {
                            e.preventDefault();
                            handleTitleSubmit(item.id);
                          }}
                          onClick={e => e.stopPropagation()}
                          className="flex-1"
                        >
                          <div className="flex flex-col gap-2 rounded-md border border-border/40 bg-background p-2 shadow-sm">
                            <div className="flex-1">
                              <Input
                                ref={titleInputRef}
                                value={editingTitle}
                                onChange={e => setEditingTitle(e.target.value)}
                                onBlur={() => handleTitleSubmit(item.id)}
                                className="rounded-sm border-border/60 px-2 py-1 text-sm font-medium focus-visible:ring-1"
                                aria-label="Document Title"
                                placeholder="Document Title"
                              />
                            </div>
                            <div className="w-full">
                              <Select
                                value={item.document_type}
                                onValueChange={value => {
                                  onUpdateDocumentType(item.id, value as DocumentType);
                                }}
                              >
                                <SelectTrigger className="h-9 min-w-[140px] border-muted bg-muted/50 font-medium">
                                  <SelectValue placeholder="Document Type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Custom" className="flex items-center">
                                    {getDocumentTypeIcon('Custom', true)}
                                    <span>Custom</span>
                                  </SelectItem>
                                  <SelectItem value="Blog" className="flex items-center">
                                    {getDocumentTypeIcon('Blog', true)}
                                    <span>Blog</span>
                                  </SelectItem>
                                  <SelectItem value="Essay" className="flex items-center">
                                    {getDocumentTypeIcon('Essay', true)}
                                    <span>Essay</span>
                                  </SelectItem>
                                  <SelectItem value="LinkedIn" className="flex items-center">
                                    {getDocumentTypeIcon('LinkedIn', true)}
                                    <span>LinkedIn</span>
                                  </SelectItem>
                                  <SelectItem value="X" className="flex items-center">
                                    {getDocumentTypeIcon('X', true)}
                                    <span>X</span>
                                  </SelectItem>
                                  <SelectItem value="Threads" className="flex items-center">
                                    {getDocumentTypeIcon('Threads', true)}
                                    <span>Threads</span>
                                  </SelectItem>
                                  <SelectItem value="Reddit" className="flex items-center">
                                    {getDocumentTypeIcon('Reddit', true)}
                                    <span>Reddit</span>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex justify-end">
                              <Button type="submit" size="sm" className="h-7 text-xs">
                                Save
                              </Button>
                            </div>
                          </div>
                        </form>
                      ) : (
                        <div className="truncate">{item.title}</div>
                      )}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground/70">
                        <span>{new Date(item.lastModified).toLocaleDateString()}</span>
                        {item.document_type && item.document_type !== 'Custom' && (
                          <span className="ml-1 inline-flex items-center rounded-sm bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                            <span className="mr-1">
                              {getDocumentTypeIcon(item.document_type, false)}
                            </span>
                            {item.document_type}
                          </span>
                        )}
                      </div>
                    </div>
                  </Button>
                  <div className="absolute right-1 top-1/2 flex -translate-y-1/2 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-muted"
                      onClick={e => {
                        e.stopPropagation();
                        setEditingTitleId(item.id);
                        setEditingTitle(item.title);
                      }}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={e => {
                        e.stopPropagation();
                        if (confirm('Are you sure you want to delete this document?')) {
                          onDeleteDocument(item.id);
                        }
                      }}
                    >
                      <XIcon className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-border/40 p-2 text-center text-xs text-muted-foreground/70">
              {storageAvailable
                ? 'History is stored in your browser'
                : 'History storage unavailable'}
            </div>
          </>
        )}
        {!isHistoryOpen && (
          <div className="flex flex-col items-center gap-1 py-2">
            <Button
              variant="ghost"
              size="sm"
              className="mb-2 h-9 w-9 p-0 hover:bg-muted/50"
              onClick={onNewDocument}
              title="New Document"
            >
              <Plus className="h-4 w-4" />
            </Button>
            {history.map(item => (
              <Button
                key={item.id}
                variant="ghost"
                size="sm"
                className={`h-9 w-9 p-0 ${selectedHistoryId === item.id ? 'bg-muted' : 'hover:bg-muted/50'}`}
                onClick={() => onSelectHistory(item.id)}
                title={item.title}
              >
                {item.document_type && item.document_type !== 'Custom' ? (
                  getDocumentTypeIcon(item.document_type, true)
                ) : (
                  <FileText className="h-4 w-4" />
                )}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
