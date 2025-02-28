'use client';

import { Navbar } from '@/components/layout/Navbar';
import { WriteTab } from '@/components/layout/WriteTab';
import { ConfigureTab } from '@/components/layout/ConfigureTab';
import { useCoWriterState } from '@/hooks/useCoWriterState';

export default function Home() {
  const {
    // State
    activeTab,
    isHistoryOpen,
    history,
    selectedHistoryId,
    editorContent,
    actions,
    evals,
    aboutMe,
    preferredStyle,
    tone,
    llmConfig,
    isConnecting,
    isProcessing,
    isChatProcessing,
    messages,

    // Actions
    setActiveTab,
    setIsHistoryOpen,
    setSelectedHistoryId,
    setEditorContent,
    setActions,
    setEvals,
    setAboutMe,
    setPreferredStyle,
    setTone,
    handleNewDocument,
    handleDeleteDocument,
    handleRenameDocument,
    handleUpdateDocumentType,
    handleLLMConnect,
    handleActionClick,
    handleEvalClick,
    handleSendMessage,
    handleResetConfig,
  } = useCoWriterState();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Navbar */}
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content */}
      {activeTab === 'write' && (
        <WriteTab
          history={history}
          selectedHistoryId={selectedHistoryId}
          isHistoryOpen={isHistoryOpen}
          editorContent={editorContent}
          actions={actions}
          evals={evals}
          messages={messages}
          isProcessing={isProcessing}
          isChatProcessing={isChatProcessing}
          llmConfig={llmConfig}
          isConnecting={isConnecting}
          onToggleHistory={() => setIsHistoryOpen(!isHistoryOpen)}
          onSelectHistory={setSelectedHistoryId}
          onNewDocument={handleNewDocument}
          onDeleteDocument={handleDeleteDocument}
          onRenameDocument={handleRenameDocument}
          onUpdateDocumentType={handleUpdateDocumentType}
          onUpdateContent={setEditorContent}
          onActionClick={handleActionClick}
          onEvalClick={handleEvalClick}
          onSendMessage={handleSendMessage}
          onConnectLLM={handleLLMConnect}
        />
      )}
      {activeTab === 'configure' && (
        <ConfigureTab
          actions={actions}
          evals={evals}
          aboutMe={aboutMe}
          preferredStyle={preferredStyle}
          tone={tone}
          llmConfig={llmConfig}
          isConnecting={isConnecting}
          onUpdateActions={setActions}
          onUpdateEvals={setEvals}
          onUpdateAboutMe={setAboutMe}
          onUpdatePreferredStyle={setPreferredStyle}
          onUpdateTone={setTone}
          onConnectLLM={handleLLMConnect}
          onResetConfig={handleResetConfig}
        />
      )}
    </div>
  );
}
