'use client';

import { Navbar } from '@/components/layout/Navbar';
import { WriteTab } from '@/components/layout/WriteTab';
import { ConfigureTab } from '@/components/layout/ConfigureTab';
import { useCoWriterState } from '@/hooks/useCoWriterState';
import { useEffect } from 'react';
import { ALL_DOCUMENT_TYPES } from '@/utils/constants';

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
    openEvalDialogId,

    // Actions
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
    handleTabChange,
    handleDialogOpenChange,
  } = useCoWriterState();

  // Initialize document types when the app starts
  useEffect(() => {
    console.log('Initializing document types');
    const savedDocTypes = localStorage.getItem('selectedDocumentTypes');
    if (!savedDocTypes) {
      console.log('No saved document types, initializing with ALL_DOCUMENT_TYPES');
      localStorage.setItem('selectedDocumentTypes', JSON.stringify(ALL_DOCUMENT_TYPES));

      // Dispatch an event to notify components that document types have been initialized
      window.dispatchEvent(
        new CustomEvent('docTypesChanged', {
          detail: { types: ALL_DOCUMENT_TYPES },
        })
      );
    } else {
      console.log('Found saved document types:', savedDocTypes);
      try {
        const parsedTypes = JSON.parse(savedDocTypes);
        if (!Array.isArray(parsedTypes) || parsedTypes.length === 0) {
          console.log(
            'Invalid or empty saved document types, initializing with ALL_DOCUMENT_TYPES'
          );
          localStorage.setItem('selectedDocumentTypes', JSON.stringify(ALL_DOCUMENT_TYPES));

          // Dispatch an event to notify components that document types have been initialized
          window.dispatchEvent(
            new CustomEvent('docTypesChanged', {
              detail: { types: ALL_DOCUMENT_TYPES },
            })
          );
        } else {
          // If valid array with items, dispatch an event with the saved types
          window.dispatchEvent(
            new CustomEvent('docTypesChanged', {
              detail: { types: parsedTypes },
            })
          );
        }
        // If valid array with items, do nothing to preserve user's selection
      } catch (error) {
        console.error('Error parsing saved document types:', error);
        localStorage.setItem('selectedDocumentTypes', JSON.stringify(ALL_DOCUMENT_TYPES));

        // Dispatch an event to notify components that document types have been initialized
        window.dispatchEvent(
          new CustomEvent('docTypesChanged', {
            detail: { types: ALL_DOCUMENT_TYPES },
          })
        );
      }
    }
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Navbar */}
      <Navbar activeTab={activeTab} onTabChange={handleTabChange} />

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
          openEvalDialogId={openEvalDialogId}
          onToggleHistory={() => setIsHistoryOpen(!isHistoryOpen)}
          onSelectHistory={setSelectedHistoryId}
          onNewDocument={handleNewDocument}
          onDeleteDocument={handleDeleteDocument}
          onRenameDocument={handleRenameDocument}
          onUpdateDocumentType={handleUpdateDocumentType}
          onUpdateContent={setEditorContent}
          onActionClick={handleActionClick}
          onEvalClick={handleEvalClick}
          onDialogOpenChange={handleDialogOpenChange}
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
