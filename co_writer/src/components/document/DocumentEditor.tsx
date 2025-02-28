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
  if (!selectedDocument) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <p className="text-muted-foreground">No document selected</p>
      </div>
    );
  }

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
              value={selectedDocument.document_type}
              onValueChange={value => {
                onUpdateDocumentType(selectedDocument.id, value as DocumentType);
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
