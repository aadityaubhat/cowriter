import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { HistorySidebar } from '@/components/history/HistorySidebar';
import { DocumentEditor } from '@/components/document/DocumentEditor';
import { ActionButtons } from '@/components/actions/ActionButtons';
import { EvalButtons } from '@/components/evals/EvalButtons';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { LLMConnectionOverlay } from '@/components/layout/LLMConnectionOverlay';
import { HistoryItem, ActionButton, EvalItem, Message, DocumentType, LLMConfig } from '@/types';

interface WriteTabProps {
  history: HistoryItem[];
  selectedHistoryId: string | null;
  isHistoryOpen: boolean;
  editorContent: string;
  actions: ActionButton[];
  evals: EvalItem[];
  messages: Message[];
  isProcessing: boolean;
  isChatProcessing: boolean;
  llmConfig: LLMConfig;
  isConnecting: boolean;
  openEvalDialogId?: string | null;
  onToggleHistory: () => void;
  onSelectHistory: (id: string) => void;
  onNewDocument: () => void;
  onDeleteDocument: (id: string) => void;
  onRenameDocument: (id: string, newTitle: string) => void;
  onUpdateDocumentType: (id: string, type: DocumentType) => void;
  onUpdateContent: (content: string) => void;
  onActionClick: (action: ActionButton) => void;
  onEvalClick: (evalItem: EvalItem) => void;
  onDialogOpenChange?: (id: string | null) => void;
  onSendMessage: (message: string) => void;
  onConnectLLM: (config: LLMConfig) => void;
}

export function WriteTab({
  history,
  selectedHistoryId,
  isHistoryOpen,
  editorContent,
  actions,
  evals,
  messages,
  isProcessing,
  isChatProcessing,
  llmConfig,
  isConnecting,
  openEvalDialogId,
  onToggleHistory,
  onSelectHistory,
  onNewDocument,
  onDeleteDocument,
  onRenameDocument,
  onUpdateDocumentType,
  onUpdateContent,
  onActionClick,
  onEvalClick,
  onDialogOpenChange,
  onSendMessage,
  onConnectLLM,
}: WriteTabProps) {
  const selectedDocument = selectedHistoryId
    ? history.find(item => item.id === selectedHistoryId) || null
    : null;

  return (
    <main className="flex max-h-[calc(100vh-3.5rem)] min-h-[calc(100vh-3.5rem)] flex-1 overflow-hidden">
      {/* History Sidebar */}
      <HistorySidebar
        history={history}
        selectedHistoryId={selectedHistoryId}
        isHistoryOpen={isHistoryOpen}
        onSelectHistory={onSelectHistory}
        onNewDocument={onNewDocument}
        onDeleteDocument={onDeleteDocument}
        onRenameDocument={onRenameDocument}
        onUpdateDocumentType={onUpdateDocumentType}
        onToggleHistory={onToggleHistory}
      />

      <div className="flex flex-1 overflow-hidden p-4">
        <PanelGroup direction="horizontal" className="flex flex-1 gap-2 overflow-hidden">
          {/* Left side - Rich Text Editor */}
          <Panel defaultSize={70} minSize={30}>
            <DocumentEditor
              selectedDocument={selectedDocument}
              editorContent={editorContent}
              isProcessing={isProcessing}
              onUpdateContent={onUpdateContent}
              onRenameDocument={onRenameDocument}
              onUpdateDocumentType={onUpdateDocumentType}
            />
          </Panel>

          <PanelResizeHandle className="w-2 rounded-sm transition-colors hover:bg-muted" />

          {/* Right side - Action buttons and Chat */}
          <Panel defaultSize={30} minSize={20}>
            <div className="relative flex h-full min-h-0 flex-col gap-4">
              {/* Action Buttons */}
              <ActionButtons
                actions={actions}
                isProcessing={isProcessing}
                isLLMConnected={!!llmConfig.type}
                onActionClick={onActionClick}
              />

              {/* Evals Box */}
              <EvalButtons
                evals={evals}
                isProcessing={isProcessing}
                isLLMConnected={!!llmConfig.type}
                onEvalClick={onEvalClick}
                openEvalDialogId={openEvalDialogId}
                onDialogOpenChange={onDialogOpenChange}
              />

              {/* Chat */}
              <ChatPanel
                messages={messages}
                isProcessing={isChatProcessing}
                isLLMConnected={!!llmConfig.type}
                onSendMessage={onSendMessage}
              />

              {/* LLM Connection Overlay */}
              <LLMConnectionOverlay
                isConnecting={isConnecting}
                llmConfig={llmConfig}
                onConnect={onConnectLLM}
              />
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </main>
  );
}
