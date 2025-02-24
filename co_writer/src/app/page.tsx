'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Editor } from '@/components/editor';
import { useState, useEffect, useRef } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Send,
  GripVertical,
  X,
  Smile,
  FolderPlus,
  History,
  FileText,
  Edit2,
  Plus,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/theme-toggle';
import { Textarea } from '@/components/ui/textarea';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import type { DragEndEvent as DndDragEndEvent } from '@dnd-kit/core';

interface HistoryItem {
  id: string;
  title: string;
  content: string;
  timestamp: number;
  lastModified: number;
}

type Tab = 'write' | 'configure';

interface Message {
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface ActionButton {
  id: string;
  name: string;
  action: string;
  emoji: string;
}

interface LLMConfig {
  type: 'openai' | 'llama' | null;
  apiKey?: string;
  host?: string;
  port?: string;
}

const defaultActions: ActionButton[] = [
  { id: '1', name: 'Expand', action: 'Expand the text while maintaining the context', emoji: '✨' },
  { id: '2', name: 'Shorten', action: 'Make the text more concise', emoji: '✂️' },
  { id: '3', name: 'Critique', action: 'Provide feedback on the writing', emoji: '🎯' },
];

interface SortableActionItemProps {
  action: ActionButton;
  onUpdate: (id: string, updates: Partial<ActionButton>) => void;
  onDelete: (id: string) => void;
}

function SortableActionItem({ action, onUpdate, onDelete }: SortableActionItemProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: action.id,
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        buttonRef.current &&
        !pickerRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onUpdate(action.id, { emoji: emojiData.emoji });
    setShowEmojiPicker(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="mb-2 flex items-center gap-2 rounded-lg border bg-card p-4"
    >
      <div {...attributes} {...listeners}>
        <GripVertical className="h-5 w-5 cursor-grab text-muted-foreground" />
      </div>
      <div className="flex-1">
        <div className="mb-2 flex gap-2">
          <div className="relative">
            <Button
              ref={buttonRef}
              variant="outline"
              size="sm"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="w-20 text-lg"
            >
              {action.emoji || <Smile className="h-4 w-4" />}
            </Button>
            {showEmojiPicker && (
              <div ref={pickerRef} className="absolute left-0 top-full z-50 mt-1">
                <EmojiPicker onEmojiClick={handleEmojiClick} />
              </div>
            )}
          </div>
          <Input
            value={action.name}
            className="flex-1"
            placeholder="Button name"
            onChange={e => onUpdate(action.id, { name: e.target.value })}
          />
        </div>
        <Textarea
          value={action.action}
          className="min-h-[60px]"
          placeholder="Describe the action..."
          onChange={e => onUpdate(action.id, { action: e.target.value })}
        />
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground hover:text-destructive"
        onClick={() => onDelete(action.id)}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('write');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [actions, setActions] = useState<ActionButton[]>(defaultActions);
  const [llmConfig, setLLMConfig] = useState<LLMConfig>({ type: null });
  const [isConnecting, setIsConnecting] = useState(false);
  const [aboutMe, setAboutMe] = useState('');
  const [preferredStyle, setPreferredStyle] = useState('Professional');
  const [tone, setTone] = useState('Formal');
  const [editorContent, setEditorContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      text: "Hello! I'm Co Writer. How can I help you today?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isChatProcessing, setIsChatProcessing] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // History state
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Load history from localStorage on mount and ensure current document
  useEffect(() => {
    const savedHistory = localStorage.getItem('cowriter_history');
    let parsedHistory: HistoryItem[] = [];

    if (savedHistory) {
      parsedHistory = JSON.parse(savedHistory);
      setHistory(parsedHistory);
    }

    // If no history or no selected document, create a new one
    if (parsedHistory.length === 0) {
      const newId = Date.now().toString();
      const newItem: HistoryItem = {
        id: newId,
        title: 'Untitled Document',
        content: '',
        timestamp: Date.now(),
        lastModified: Date.now(),
      };
      setHistory([newItem]);
      setSelectedHistoryId(newId);
    } else {
      // Select the most recently modified document
      const mostRecent = parsedHistory.reduce((prev, current) =>
        current.lastModified > prev.lastModified ? current : prev
      );
      setSelectedHistoryId(mostRecent.id);
      setEditorContent(mostRecent.content);
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cowriter_history', JSON.stringify(history));
  }, [history]);

  // Delete document
  const handleDeleteDocument = (id: string) => {
    if (history.length === 1) {
      // If this is the last document, create a new empty one
      const newId = Date.now().toString();
      const newItem: HistoryItem = {
        id: newId,
        title: 'Untitled Document',
        content: '',
        timestamp: Date.now(),
        lastModified: Date.now(),
      };
      setHistory([newItem]);
      setSelectedHistoryId(newId);
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

  // Create new document
  const handleNewDocument = () => {
    const newId = Date.now().toString();
    const newItem: HistoryItem = {
      id: newId,
      title: 'Untitled Document',
      content: '',
      timestamp: Date.now(),
      lastModified: Date.now(),
    };
    setHistory([newItem, ...history]);
    setSelectedHistoryId(newId);
    setEditorContent('');
  };

  // Save current document to history
  useEffect(() => {
    if (selectedHistoryId && editorContent) {
      setHistory(prev =>
        prev.map(item =>
          item.id === selectedHistoryId
            ? { ...item, content: editorContent, lastModified: Date.now() }
            : item
        )
      );
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
  }, [selectedHistoryId]);

  // Rename document
  const handleRenameDocument = (id: string, newTitle: string) => {
    setHistory(prev =>
      prev.map(item =>
        item.id === id ? { ...item, title: newTitle || 'Untitled Document' } : item
      )
    );
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Scroll to bottom of chat when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Action button handlers
  const handleAddAction = () => {
    const newId = String(actions.length + 1);
    setActions([
      ...actions,
      {
        id: newId,
        name: 'New Action',
        action: 'Describe what this action should do...',
        emoji: '🔹',
      },
    ]);
  };

  const handleUpdateAction = (id: string, updates: Partial<ActionButton>) => {
    setActions(actions.map(a => (a.id === id ? { ...a, ...updates } : a)));
  };

  const handleDeleteAction = (id: string) => {
    setActions(actions.filter(a => a.id !== id));
  };

  const handleDragEnd = (event: DndDragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setActions(items => {
        const oldIndex = items.findIndex(item => item.id === String(active.id));
        const newIndex = items.findIndex(item => item.id === String(over?.id));

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !llmConfig.type || isChatProcessing) return;

    const userMessage = {
      text: inputMessage,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsChatProcessing(true);

    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          context: editorContent ? `Current editor content: ${editorContent}` : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();

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
      const response = await fetch('http://localhost:8000/api/submit_action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: action.name.toLowerCase(),
          action_description: action.action,
          text: editorContent,
          about_me: aboutMe,
          preferred_style: preferredStyle,
          tone: tone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to process action');
      }

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

  // Update the buttons in the Write tab to use configured actions
  const renderActionButtons = () => {
    return actions.map(action => (
      <Button
        key={action.id}
        variant="default"
        className="h-10 w-full bg-blue-500 text-base font-medium hover:bg-blue-600"
        onClick={() => handleActionClick(action)}
        disabled={isProcessing || !llmConfig.type}
      >
        <span className="mr-2 text-xl">{action.emoji}</span>
        {action.name}
      </Button>
    ));
  };

  const handleLLMConnect = async (config: LLMConfig) => {
    setIsConnecting(true);
    try {
      const response = await fetch('http://localhost:8000/api/connect_llm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: config.type,
          ...(config.type === 'openai'
            ? { api_key: config.apiKey }
            : { host: config.host, port: config.port }),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setLLMConfig(config);
      } else {
        throw new Error(data.message || 'Failed to connect to LLM');
      }
    } catch (error) {
      console.error('Failed to connect:', error);
      alert(error instanceof Error ? error.message : 'Failed to connect to LLM');
      setLLMConfig({ type: null });
    } finally {
      setIsConnecting(false);
    }
  };

  const LLMConnectionModal = () => {
    const [selectedLLM, setSelectedLLM] = useState<'openai' | 'llama'>('openai');
    const [apiKey, setApiKey] = useState('');
    const [host, setHost] = useState('http://localhost');
    const [port, setPort] = useState('8080');
    const [error, setError] = useState<string | null>(null);

    const handleConnect = () => {
      setError(null);
      if (selectedLLM === 'openai' && !apiKey.trim()) {
        setError('API key is required');
        return;
      }
      if (selectedLLM === 'llama' && (!host.trim() || !port.trim())) {
        setError('Host and port are required');
        return;
      }

      const config: LLMConfig = {
        type: selectedLLM,
        ...(selectedLLM === 'openai' ? { apiKey } : { host, port }),
      };
      handleLLMConnect(config);
    };

    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" disabled={isConnecting}>
            {isConnecting ? 'Connecting...' : llmConfig.type ? 'Update Connection' : 'Connect Now'}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Connect to LLM</DialogTitle>
            <DialogDescription>
              Choose your LLM provider and enter the required credentials.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">LLM Provider</label>
              <Select
                value={selectedLLM}
                onValueChange={(value: 'openai' | 'llama') => {
                  setSelectedLLM(value);
                  setError(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select LLM provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="llama">Llama.cpp</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedLLM === 'openai' ? (
              <div className="grid gap-2">
                <label className="text-sm font-medium">API Key</label>
                <Input
                  type="password"
                  placeholder="Enter your OpenAI API key"
                  value={apiKey}
                  onChange={e => {
                    setApiKey(e.target.value);
                    setError(null);
                  }}
                />
              </div>
            ) : (
              <>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Host</label>
                  <Input
                    placeholder="Enter host"
                    value={host}
                    onChange={e => {
                      setHost(e.target.value);
                      setError(null);
                    }}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Port</label>
                  <Input
                    placeholder="Enter port"
                    value={port}
                    onChange={e => {
                      setPort(e.target.value);
                      setError(null);
                    }}
                  />
                </div>
              </>
            )}
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button onClick={handleConnect} disabled={isConnecting}>
              {isConnecting ? 'Connecting...' : 'Connect'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // Handle title edit submission
  const handleTitleSubmit = (id: string) => {
    if (editingTitle.trim()) {
      handleRenameDocument(id, editingTitle);
    }
    setEditingTitleId(null);
    setEditingTitle('');
  };

  // Focus input when editing starts
  useEffect(() => {
    if (editingTitleId && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [editingTitleId]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Navbar */}
      <nav className="border-b bg-background">
        <div className="flex h-14 items-center px-4">
          <span className="mr-8 text-lg font-bold">CoWriter</span>

          <Button
            variant="ghost"
            className={`${activeTab === 'write' ? 'bg-muted' : ''}`}
            onClick={() => setActiveTab('write')}
          >
            Write
          </Button>
          <Button
            variant="ghost"
            className={`${activeTab === 'configure' ? 'bg-muted' : ''}`}
            onClick={() => setActiveTab('configure')}
          >
            Configure
          </Button>

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      {activeTab === 'write' && (
        <main className="flex max-h-[calc(100vh-3.5rem)] min-h-[calc(100vh-3.5rem)] flex-1 overflow-hidden">
          {/* History Sidebar */}
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
                        onClick={() => setIsHistoryOpen(false)}
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
                      onClick={() => setIsHistoryOpen(true)}
                    >
                      <ChevronUp className="h-4 w-4 -rotate-90" />
                    </Button>
                  </div>
                )}
              </div>

              {isHistoryOpen && (
                <>
                  <div className="flex-1 overflow-y-auto p-2">
                    <Button
                      variant="ghost"
                      className="mb-2 w-full justify-start text-sm hover:bg-muted/50"
                      onClick={handleNewDocument}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      New Document
                    </Button>
                    {history.map(item => (
                      <div key={item.id} className="group relative mb-1">
                        <Button
                          variant="ghost"
                          className={`w-full justify-start text-left text-sm ${selectedHistoryId === item.id ? 'bg-muted/80 font-medium' : 'hover:bg-muted/50'}`}
                          onClick={() => setSelectedHistoryId(item.id)}
                        >
                          <FileText className="mr-2 h-4 w-4 shrink-0" />
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
                                <Input
                                  ref={titleInputRef}
                                  value={editingTitle}
                                  onChange={e => setEditingTitle(e.target.value)}
                                  onBlur={() => handleTitleSubmit(item.id)}
                                  className="h-6 bg-background px-1 py-0 text-sm"
                                />
                              </form>
                            ) : (
                              <div className="truncate">{item.title}</div>
                            )}
                            <div className="text-xs text-muted-foreground/70">
                              {new Date(item.lastModified).toLocaleDateString()}
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
                                handleDeleteDocument(item.id);
                              }
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-border/40 p-2 text-center text-xs text-muted-foreground/70">
                    History is stored in your browser
                  </div>
                </>
              )}
              {!isHistoryOpen && (
                <div className="flex flex-col items-center gap-1 py-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mb-2 h-9 w-9 p-0 hover:bg-muted/50"
                    onClick={handleNewDocument}
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
                      onClick={() => setSelectedHistoryId(item.id)}
                      title={item.title}
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden p-4">
            <PanelGroup direction="horizontal" className="flex flex-1 gap-2 overflow-hidden">
              {/* Left side - Rich Text Editor */}
              <Panel defaultSize={70} minSize={30}>
                <div className="h-full">
                  <Editor
                    content={editorContent}
                    onUpdate={content => setEditorContent(content)}
                    isLoading={isProcessing}
                  />
                </div>
              </Panel>

              <PanelResizeHandle className="w-2 rounded-sm transition-colors hover:bg-muted" />

              {/* Right side - Action buttons and Chat */}
              <Panel defaultSize={30} minSize={20}>
                <div className="relative flex h-full min-h-0 flex-col gap-4">
                  {/* Collapsible Buttons */}
                  <Card
                    className={`overflow-hidden shadow-lg ${!llmConfig.type ? 'pointer-events-none opacity-50' : ''}`}
                  >
                    <Button
                      variant="ghost"
                      className="flex w-full items-center justify-between p-4"
                      onClick={() => setIsCollapsed(!isCollapsed)}
                    >
                      <span className="font-semibold">Actions</span>
                      {isCollapsed ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronUp className="h-4 w-4" />
                      )}
                    </Button>
                    <div
                      className={`transition-all duration-200 ease-in-out ${isCollapsed ? 'h-0' : 'max-h-[300px] overflow-y-auto'}`}
                    >
                      <div className="space-y-2 p-2">{renderActionButtons()}</div>
                    </div>
                  </Card>

                  {/* Chat */}
                  <Card
                    className={`min-h-0 flex-1 overflow-hidden shadow-lg ${!llmConfig.type ? 'pointer-events-none opacity-50' : ''}`}
                  >
                    <div className="flex h-full flex-col">
                      <h3 className="p-4 pb-2 text-lg font-semibold">Chat</h3>
                      <div
                        ref={chatContainerRef}
                        className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4"
                      >
                        {messages.map((message, index) => (
                          <div
                            key={index}
                            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[80%] rounded-lg p-3 ${message.isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                            >
                              <p className="whitespace-pre-wrap text-sm">{message.text}</p>
                              <p className="mt-1 text-xs opacity-70">
                                {message.timestamp.toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        ))}
                        {isChatProcessing && (
                          <div className="flex justify-start">
                            <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
                              <div
                                className="h-2 w-2 animate-bounce rounded-full bg-primary"
                                style={{ animationDelay: '0ms' }}
                              />
                              <div
                                className="h-2 w-2 animate-bounce rounded-full bg-primary"
                                style={{ animationDelay: '150ms' }}
                              />
                              <div
                                className="h-2 w-2 animate-bounce rounded-full bg-primary"
                                style={{ animationDelay: '300ms' }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="border-t p-4 pt-2">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Type a message..."
                            value={inputMessage}
                            onChange={e => setInputMessage(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                              }
                            }}
                            disabled={isChatProcessing || !llmConfig.type}
                          />
                          <Button
                            size="icon"
                            onClick={handleSendMessage}
                            disabled={!inputMessage.trim() || isChatProcessing || !llmConfig.type}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* LLM Connection Overlay */}
                  {!llmConfig.type && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/50 backdrop-blur-[1px]">
                      <Card className="p-6 text-center shadow-lg">
                        <h3 className="mb-2 text-lg font-semibold">No LLM Connected</h3>
                        <p className="mb-4 text-sm text-muted-foreground">
                          Connect to an LLM to use actions and chat
                        </p>
                        <LLMConnectionModal />
                      </Card>
                    </div>
                  )}
                </div>
              </Panel>
            </PanelGroup>
          </div>
        </main>
      )}
      {activeTab === 'configure' && (
        <main className="flex-1 p-4">
          <div className="mx-auto max-w-7xl">
            {/* LLM Connection Section */}
            <Card className="mb-8 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-semibold">Connection to LLM:</h2>
                  <span className={`text-lg ${llmConfig.type ? 'text-green-500' : 'text-red-500'}`}>
                    {llmConfig.type ? 'Connected' : 'Not connected'}
                  </span>
                </div>
                <LLMConnectionModal />
              </div>
              {llmConfig.type && (
                <div className="mt-2 text-sm text-muted-foreground">
                  Connected to: {llmConfig.type === 'openai' ? 'OpenAI' : 'Llama.cpp'}
                  {llmConfig.type === 'llama' && ` (${llmConfig.host}:${llmConfig.port})`}
                </div>
              )}
            </Card>

            <div className="flex gap-8">
              {/* Left Column */}
              <div className="flex-1 space-y-8">
                {/* About Me Section */}
                <Card className="p-6">
                  <h2 className="mb-4 text-2xl font-semibold">About Me</h2>
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Share your background, expertise, and interests. This helps me understand your perspective and tailor the writing to match your voice and experience."
                      className="min-h-[200px]"
                      value={aboutMe}
                      onChange={e => setAboutMe(e.target.value)}
                    />
                  </div>
                </Card>

                {/* Writing Style Section */}
                <Card className="p-6">
                  <h2 className="mb-4 text-2xl font-semibold">Writing Style</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium">Preferred Style</label>
                      <select
                        className="h-10 w-full rounded-md border border-input bg-background px-3"
                        value={preferredStyle}
                        onChange={e => setPreferredStyle(e.target.value)}
                      >
                        <option>Professional</option>
                        <option>Casual</option>
                        <option>Academic</option>
                        <option>Creative</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">Tone</label>
                      <select
                        className="h-10 w-full rounded-md border border-input bg-background px-3"
                        value={tone}
                        onChange={e => setTone(e.target.value)}
                      >
                        <option>Formal</option>
                        <option>Informal</option>
                        <option>Friendly</option>
                        <option>Technical</option>
                      </select>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Right Column - Action Buttons */}
              <div className="w-[500px]">
                <Card className="p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-2xl font-semibold">Action Buttons</h2>
                    <Button variant="outline" onClick={handleAddAction}>
                      Add Action
                    </Button>
                  </div>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext items={actions} strategy={verticalListSortingStrategy}>
                      {actions.map(action => (
                        <SortableActionItem
                          key={action.id}
                          action={action}
                          onUpdate={handleUpdateAction}
                          onDelete={handleDeleteAction}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                </Card>
              </div>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
