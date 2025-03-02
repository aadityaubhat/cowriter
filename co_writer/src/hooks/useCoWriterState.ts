import { useState, useEffect } from 'react';
import {
  HistoryItem,
  ActionButton,
  EvalItem,
  Message,
  LLMConfig,
  DocumentType,
  Tab,
} from '@/types';
import { DEFAULT_ACTIONS, DEFAULT_EVALS, DEFAULT_CONFIG, WELCOME_MESSAGE } from '@/utils/constants';
import {
  loadHistory,
  saveHistory,
  loadConfig,
  saveConfig,
  createNewDocument,
  extractScoreFromResult,
} from '@/utils/helpers';
import { connectLLM, submitAction, submitEval, sendChatMessage } from '@/utils/api';

export function useCoWriterState() {
  // Tab state
  const [activeTab, setActiveTab] = useState<Tab>('write');

  // History state
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [editorContent, setEditorContent] = useState('');

  // Action and eval state
  const [actions, setActions] = useState<ActionButton[]>(DEFAULT_ACTIONS);
  const [evals, setEvals] = useState<EvalItem[]>(DEFAULT_EVALS);

  // User preferences
  const [aboutMe, setAboutMe] = useState('');
  const [preferredStyle, setPreferredStyle] = useState('Professional');
  const [tone, setTone] = useState('Formal');

  // LLM connection state
  const [llmConfig, setLLMConfig] = useState<LLMConfig>({ type: null });
  const [isConnecting, setIsConnecting] = useState(false);

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [isChatProcessing, setIsChatProcessing] = useState(false);

  // Chat state
  const [messages, setMessages] = useState<Message[]>([
    {
      text: WELCOME_MESSAGE,
      isUser: false,
      timestamp: new Date(),
    },
  ]);

  // Load history from localStorage on mount and ensure current document
  useEffect(() => {
    try {
      const savedHistory = loadHistory();

      if (savedHistory.length > 0) {
        setHistory(savedHistory);

        // Select the most recently modified document
        const mostRecent = savedHistory.reduce((prev, current) =>
          current.lastModified > prev.lastModified ? current : prev
        );

        // Ensure the document has a valid ID
        if (mostRecent && mostRecent.id) {
          setSelectedHistoryId(mostRecent.id);
          setEditorContent(mostRecent.content || '');
        } else {
          // If the most recent document is invalid, create a new one
          const newDocument = createNewDocument();
          setHistory([newDocument]);
          setSelectedHistoryId(newDocument.id);
          setEditorContent('');
        }
      } else {
        // If no history, create a new document
        const newDocument = createNewDocument();
        setHistory([newDocument]);
        setSelectedHistoryId(newDocument.id);
        setEditorContent('');
      }
    } catch (error) {
      console.error('Error loading document history:', error);
      // Fallback to a new document if there's an error
      const newDocument = createNewDocument();
      setHistory([newDocument]);
      setSelectedHistoryId(newDocument.id);
      setEditorContent('');
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    if (history.length > 0) {
      saveHistory(history);
    }
  }, [history]);

  // Load configuration from localStorage
  useEffect(() => {
    const savedConfig = loadConfig();
    if (savedConfig) {
      setActions(savedConfig.actions);
      if (savedConfig.evals) setEvals(savedConfig.evals);
      setAboutMe(savedConfig.aboutMe);
      setPreferredStyle(savedConfig.preferredStyle);
      setTone(savedConfig.tone);
    }
  }, []);

  // Save configuration to localStorage whenever it changes
  useEffect(() => {
    // Strip out score and result properties from evals before saving
    const evalsToSave = evals.map(({ id, name, description, emoji }) => ({
      id,
      name,
      description,
      emoji,
    }));

    const config = {
      actions,
      evals: evalsToSave,
      aboutMe,
      preferredStyle,
      tone,
    };
    saveConfig(config);
  }, [actions, evals, aboutMe, preferredStyle, tone]);

  // Save current document to history
  useEffect(() => {
    if (selectedHistoryId && editorContent !== undefined) {
      // Debounce the update to avoid excessive localStorage writes
      const updateTimer = setTimeout(() => {
        setHistory(prev => {
          // Find the current document in history
          const currentIndex = prev.findIndex(item => item.id === selectedHistoryId);

          // If document exists, update it
          if (currentIndex >= 0) {
            const updatedHistory = [...prev];
            updatedHistory[currentIndex] = {
              ...updatedHistory[currentIndex],
              content: editorContent,
              lastModified: Date.now(),
            };
            return updatedHistory;
          }
          return prev;
        });
      }, 500); // 500ms debounce

      // Cleanup timer on unmount or when dependencies change
      return () => clearTimeout(updateTimer);
    }
  }, [editorContent, selectedHistoryId]);

  // Load selected document
  useEffect(() => {
    if (selectedHistoryId) {
      const selectedItem = history.find(item => item.id === selectedHistoryId);
      if (selectedItem) {
        setEditorContent(selectedItem.content);
      }
    }
  }, [selectedHistoryId, history]);

  // Reset eval scores when editor content changes
  useEffect(() => {
    if (editorContent) {
      setEvals(prevEvals => prevEvals.map(e => ({ ...e, score: undefined, result: undefined })));
    }
  }, [editorContent]);

  // Handler functions
  const handleNewDocument = () => {
    const newDocument = createNewDocument();
    setHistory([newDocument, ...history]);
    setSelectedHistoryId(newDocument.id);
    setEditorContent('');
  };

  const handleDeleteDocument = (id: string) => {
    if (history.length === 1) {
      // If this is the last document, create a new empty one
      const newDocument = createNewDocument();
      setHistory([newDocument]);
      setSelectedHistoryId(newDocument.id);
      setEditorContent('');
    } else {
      // Remove the document and select another one
      setHistory(prev => {
        const newHistory = prev.filter(item => item.id !== id);
        // If we're deleting the currently selected document, select the most recent one
        if (id === selectedHistoryId) {
          const mostRecent = newHistory.reduce((prev, current) =>
            current.lastModified > prev.lastModified ? current : prev
          );
          setSelectedHistoryId(mostRecent.id);
          setEditorContent(mostRecent.content);
        }
        return newHistory;
      });
    }
  };

  const handleRenameDocument = (id: string, newTitle: string) => {
    setHistory(prev =>
      prev.map(item =>
        item.id === id ? { ...item, title: newTitle || 'Untitled Document' } : item
      )
    );
  };

  const handleUpdateDocumentType = (id: string, type: DocumentType) => {
    setHistory(prev =>
      prev.map(item => (item.id === id ? { ...item, document_type: type } : item))
    );
  };

  const handleLLMConnect = async (config: LLMConfig) => {
    setIsConnecting(true);
    try {
      const result = await connectLLM(config);

      if (result.success) {
        setLLMConfig(config);
      } else {
        throw new Error(result.message || 'Failed to connect to LLM');
      }
    } catch (error) {
      console.error('Failed to connect:', error);
      alert(error instanceof Error ? error.message : 'Failed to connect to LLM');
      setLLMConfig({ type: null });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleActionClick = async (action: ActionButton) => {
    if (!llmConfig.type) {
      alert('Please connect to an LLM first');
      return;
    }

    if (!editorContent.trim()) {
      alert('Please enter some text in the editor first');
      return;
    }

    setIsProcessing(true);
    try {
      const selectedItem = history.find(item => item.id === selectedHistoryId);
      const documentType = selectedItem?.document_type || 'Custom';

      const data = await submitAction(
        action,
        editorContent,
        aboutMe,
        preferredStyle,
        tone,
        documentType
      );

      setEditorContent(data.text);
    } catch (error) {
      console.error('Action processing failed:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to process action. Please try again.';
      alert(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEvalClick = async (evalItem: EvalItem) => {
    if (!llmConfig.type) {
      alert('Please connect to an LLM first');
      return;
    }

    if (!editorContent.trim()) {
      alert('Please enter some text in the editor first');
      return;
    }

    setIsProcessing(true);
    try {
      const data = await submitEval(evalItem, editorContent);

      // Extract score from the result
      const score = data.score || extractScoreFromResult(data.result);

      // Update the eval item with the score and result
      setEvals(prevEvals =>
        prevEvals.map(e => (e.id === evalItem.id ? { ...e, score, result: data.result } : e))
      );
    } catch (error) {
      console.error('Eval processing failed:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to process evaluation. Please try again.';
      alert(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendMessage = async (inputMessage: string) => {
    if (!inputMessage.trim() || !llmConfig.type || isChatProcessing) return;

    const userMessage = {
      text: inputMessage,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsChatProcessing(true);

    try {
      const data = await sendChatMessage(inputMessage, editorContent);

      setMessages(prev => [
        ...prev,
        {
          text: data.text,
          isUser: false,
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [
        ...prev,
        {
          text: "I'm sorry, I encountered an error. Please try again.",
          isUser: false,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsChatProcessing(false);
    }
  };

  const handleResetConfig = () => {
    if (confirm('Are you sure you want to reset all settings to default values?')) {
      setActions(DEFAULT_ACTIONS);
      setEvals(DEFAULT_EVALS);
      setAboutMe(DEFAULT_CONFIG.aboutMe);
      setPreferredStyle(DEFAULT_CONFIG.preferredStyle);
      setTone(DEFAULT_CONFIG.tone);
    }
  };

  return {
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
  };
}
