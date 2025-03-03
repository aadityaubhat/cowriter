import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { LLMConnectionModal } from './LLMConnectionModal';
import { SortableActionItem } from '@/components/actions/SortableActionItem';
import { SortableEvalItem } from '@/components/evals/SortableEvalItem';
import { ActionButton, EvalItem, LLMConfig, DocumentType } from '@/types';
import { ALL_DOCUMENT_TYPES } from '@/utils/constants';
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
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { DragEndEvent as DndDragEndEvent } from '@dnd-kit/core';
import {
  Settings,
  User,
  Pen,
  Zap,
  BarChart,
  RefreshCw,
  ServerOff,
  Server,
  FileType,
  Check,
  Info,
} from 'lucide-react';
import { getDocumentTypeIcon } from '@/utils/documentIcons';
import { useState, useEffect } from 'react';

// Document type descriptions
const DOCUMENT_TYPE_DESCRIPTIONS: Record<DocumentType, string> = {
  Blog: 'Blog posts with clear sections and engaging flow',
  Essay: 'Formal, structured pieces with thesis and arguments',
  LinkedIn: 'Professional content for the LinkedIn platform',
  X: 'Short-form content for X (Twitter)',
  Threads: "Content for Instagram's Threads platform",
  Reddit: 'Content for Reddit with clear points for discussion',
  Custom: 'Custom document type with no specific format',
};

interface ConfigureTabProps {
  actions: ActionButton[];
  evals: EvalItem[];
  aboutMe: string;
  preferredStyle: string;
  tone: string;
  llmConfig: LLMConfig;
  isConnecting: boolean;
  onUpdateActions: (actions: ActionButton[]) => void;
  onUpdateEvals: (evals: EvalItem[]) => void;
  onUpdateAboutMe: (aboutMe: string) => void;
  onUpdatePreferredStyle: (style: string) => void;
  onUpdateTone: (tone: string) => void;
  onConnectLLM: (config: LLMConfig) => void;
  onResetConfig: () => void;
}

export function ConfigureTab({
  actions,
  evals,
  aboutMe,
  preferredStyle,
  tone,
  llmConfig,
  isConnecting,
  onUpdateActions,
  onUpdateEvals,
  onUpdateAboutMe,
  onUpdatePreferredStyle,
  onUpdateTone,
  onConnectLLM,
  onResetConfig,
}: ConfigureTabProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // State for selected document types - initialize with empty array to avoid overriding saved selection
  const [selectedDocTypes, setSelectedDocTypes] = useState<DocumentType[]>([]);

  // Load selected document types from localStorage on component mount and when tab is active
  useEffect(() => {
    const loadDocTypesFromStorage = () => {
      console.log('Loading document types from storage');
      const savedDocTypes = localStorage.getItem('selectedDocumentTypes');
      console.log('Saved document types:', savedDocTypes);
      if (savedDocTypes) {
        try {
          const parsedTypes = JSON.parse(savedDocTypes) as DocumentType[];
          console.log('Parsed document types:', parsedTypes);
          if (parsedTypes.length > 0) {
            setSelectedDocTypes(parsedTypes);
            console.log('Set selected document types to:', parsedTypes);
          } else {
            // If empty array, set default to all document types
            setSelectedDocTypes(ALL_DOCUMENT_TYPES);
            localStorage.setItem('selectedDocumentTypes', JSON.stringify(ALL_DOCUMENT_TYPES));
            console.log('Empty array, set to ALL_DOCUMENT_TYPES:', ALL_DOCUMENT_TYPES);
          }
        } catch (error) {
          console.error('Error parsing saved document types:', error);
          // If error, set default to all document types
          setSelectedDocTypes(ALL_DOCUMENT_TYPES);
          localStorage.setItem('selectedDocumentTypes', JSON.stringify(ALL_DOCUMENT_TYPES));
          console.log('Error parsing, set to ALL_DOCUMENT_TYPES');
        }
      } else {
        // If no saved types, set default to all document types
        setSelectedDocTypes(ALL_DOCUMENT_TYPES);
        localStorage.setItem('selectedDocumentTypes', JSON.stringify(ALL_DOCUMENT_TYPES));
        console.log('No saved types, set to ALL_DOCUMENT_TYPES');
      }
    };

    // Load document types when component mounts
    loadDocTypesFromStorage();

    // Add event listener for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'selectedDocumentTypes') {
        loadDocTypesFromStorage();
      }
    };

    // Add event listener for custom docTypesChanged event
    const handleDocTypesChanged = (e: CustomEvent) => {
      console.log('Received docTypesChanged event:', e.detail.types);
      setSelectedDocTypes(e.detail.types);
    };

    // Add event listener for configureTabActive event
    const handleConfigureTabActive = () => {
      console.log('Received configureTabActive event');
      loadDocTypesFromStorage();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('docTypesChanged', handleDocTypesChanged as EventListener);
    window.addEventListener('configureTabActive', handleConfigureTabActive);

    // Clean up event listeners
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('docTypesChanged', handleDocTypesChanged as EventListener);
      window.removeEventListener('configureTabActive', handleConfigureTabActive);
    };
  }, []);

  // Save selected document types to localStorage whenever they change
  useEffect(() => {
    // Only save to localStorage if selectedDocTypes is not empty
    // This prevents overriding the saved selection when the component mounts
    if (selectedDocTypes.length > 0) {
      console.log('Saving selected document types to localStorage:', selectedDocTypes);
      localStorage.setItem('selectedDocumentTypes', JSON.stringify(selectedDocTypes));
    }
  }, [selectedDocTypes]);

  // Toggle document type selection
  const toggleDocType = (type: DocumentType) => {
    console.log('Toggle document type:', type);
    console.log('Current selected types:', selectedDocTypes);

    // Create a new array based on the current state
    let newTypes: DocumentType[];

    if (selectedDocTypes.includes(type)) {
      // Don't allow deselecting all types - at least one must be selected
      if (selectedDocTypes.length <= 1) {
        console.log('Cannot deselect last type');
        return;
      }
      newTypes = selectedDocTypes.filter(t => t !== type);
      console.log('Removed type, new types:', newTypes);
    } else {
      newTypes = [...selectedDocTypes, type];
      console.log('Added type, new types:', newTypes);
    }

    // Update state first
    setSelectedDocTypes(newTypes);

    // Then save to localStorage
    localStorage.setItem('selectedDocumentTypes', JSON.stringify(newTypes));
    console.log('Saved to localStorage:', JSON.stringify(newTypes));

    // Dispatch a custom event to notify other components
    window.dispatchEvent(
      new CustomEvent('docTypesChanged', {
        detail: { types: newTypes },
      })
    );
    console.log('Dispatched docTypesChanged event');
  };

  // Action button handlers
  const handleAddAction = () => {
    const newId = String(actions.length + 1);
    onUpdateActions([
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
    onUpdateActions(actions.map(a => (a.id === id ? { ...a, ...updates } : a)));
  };

  const handleDeleteAction = (id: string) => {
    onUpdateActions(actions.filter(a => a.id !== id));
  };

  const handleDragEnd = (event: DndDragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = actions.findIndex(item => item.id === String(active.id));
      const newIndex = actions.findIndex(item => item.id === String(over?.id));
      onUpdateActions(arrayMove(actions, oldIndex, newIndex));
    }
  };

  // Eval handlers
  const handleAddEval = () => {
    const newId = String(evals.length + 1);
    onUpdateEvals([
      ...evals,
      {
        id: newId,
        name: 'New Eval',
        description: 'Describe what this eval should check for...',
        emoji: '📊',
      },
    ]);
  };

  const handleUpdateEval = (id: string, updates: Partial<EvalItem>) => {
    onUpdateEvals(evals.map(e => (e.id === id ? { ...e, ...updates } : e)));
  };

  const handleDeleteEval = (id: string) => {
    onUpdateEvals(evals.filter(e => e.id !== id));
  };

  const handleEvalDragEnd = (event: DndDragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = evals.findIndex(item => item.id === String(active.id));
      const newIndex = evals.findIndex(item => item.id === String(over?.id));
      onUpdateEvals(arrayMove(evals, oldIndex, newIndex));
    }
  };

  return (
    <main className="flex-1 bg-background/50 p-6">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="mb-6 flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Configuration</h1>
        </div>

        {/* 1. LLM Connection Section at the top */}
        <Card className="overflow-hidden border-2 transition-all hover:shadow-md">
          <CardHeader className="bg-muted/50 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {llmConfig.type ? (
                  <Server className="h-5 w-5 text-green-500" />
                ) : (
                  <ServerOff className="h-5 w-5 text-red-500" />
                )}
                <CardTitle>Connection to LLM</CardTitle>
                <span
                  className={`rounded-full px-2 py-0.5 text-sm font-medium ${
                    llmConfig.type
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}
                >
                  {llmConfig.type ? 'Connected' : 'Not connected'}
                </span>
              </div>
              <LLMConnectionModal
                isConnecting={isConnecting}
                llmConfig={llmConfig}
                onConnect={onConnectLLM}
              />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {llmConfig.type && (
              <div className="text-sm text-muted-foreground">
                Connected to: {llmConfig.type === 'openai' ? 'OpenAI' : 'Llama.cpp'}
                {llmConfig.type === 'llama' && ` (${llmConfig.host}:${llmConfig.port})`}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 2. About Me and Writing Style side by side */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* About Me Section */}
          <Card className="overflow-hidden border-2 transition-all hover:shadow-md">
            <CardHeader className="bg-muted/50">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-primary" />
                <CardTitle>About Me</CardTitle>
              </div>
              <CardDescription>
                Share your background to help tailor the writing to your voice
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <Textarea
                placeholder="Share your background, expertise, and interests. This helps me understand your perspective and tailor the writing to match your voice and experience."
                className="min-h-[200px] resize-none border-2 focus-visible:ring-1"
                value={aboutMe}
                onChange={e => onUpdateAboutMe(e.target.value)}
              />
            </CardContent>
          </Card>

          {/* Writing Style Section */}
          <Card className="overflow-hidden border-2 transition-all hover:shadow-md">
            <CardHeader className="bg-muted/50">
              <div className="flex items-center gap-3">
                <Pen className="h-5 w-5 text-primary" />
                <CardTitle>Writing Style</CardTitle>
              </div>
              <CardDescription>Choose your preferred writing style and tone</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              <div>
                <label className="mb-2 block text-sm font-medium">Preferred Style</label>
                <select
                  className="h-10 w-full rounded-md border-2 border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={preferredStyle}
                  onChange={e => onUpdatePreferredStyle(e.target.value)}
                >
                  <option>Professional</option>
                  <option>Casual</option>
                  <option>Academic</option>
                  <option>Creative</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Tone</label>
                <select
                  className="h-10 w-full rounded-md border-2 border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={tone}
                  onChange={e => onUpdateTone(e.target.value)}
                >
                  <option>Formal</option>
                  <option>Informal</option>
                  <option>Friendly</option>
                  <option>Technical</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 3. Supported Document Types */}
        <Card className="overflow-hidden border-2 transition-all hover:shadow-md">
          <CardHeader className="bg-muted/50">
            <div className="flex items-center gap-3">
              <FileType className="h-5 w-5 text-primary" />
              <CardTitle>Supported Document Types</CardTitle>
            </div>
            <div className="flex flex-col space-y-2">
              <CardDescription>
                Select document types that will be available in the Write tab
              </CardDescription>
              <span className="inline-flex items-center self-start rounded bg-muted/50 px-2 py-1 text-xs text-muted-foreground">
                <Info className="mr-1 h-3 w-3" />
                At least one type must be selected
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {ALL_DOCUMENT_TYPES.map(type => (
                <DocumentTypeCard
                  key={type}
                  type={type}
                  description={DOCUMENT_TYPE_DESCRIPTIONS[type]}
                  isSelected={selectedDocTypes.includes(type)}
                  onClick={() => toggleDocType(type)}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 4. Action Buttons and Evals side by side */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Action Buttons */}
          <Card className="overflow-hidden border-2 transition-all hover:shadow-md">
            <CardHeader className="bg-muted/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Zap className="h-5 w-5 text-primary" />
                  <CardTitle>Action Buttons</CardTitle>
                </div>
                <Button variant="outline" size="sm" onClick={handleAddAction} className="gap-1">
                  <span className="text-lg">+</span> Add Action
                </Button>
              </div>
              <CardDescription>Configure actions that can be applied to your text</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={actions} strategy={verticalListSortingStrategy}>
                  <div className="space-y-3">
                    {actions.map(action => (
                      <SortableActionItem
                        key={action.id}
                        action={action}
                        onUpdate={handleUpdateAction}
                        onDelete={handleDeleteAction}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </CardContent>
          </Card>

          {/* Evals Configuration */}
          <Card className="overflow-hidden border-2 transition-all hover:shadow-md">
            <CardHeader className="bg-muted/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BarChart className="h-5 w-5 text-primary" />
                  <CardTitle>Evals</CardTitle>
                </div>
                <Button variant="outline" size="sm" onClick={handleAddEval} className="gap-1">
                  <span className="text-lg">+</span> Add Eval
                </Button>
              </div>
              <CardDescription>Configure evaluation criteria for your text</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleEvalDragEnd}
              >
                <SortableContext items={evals} strategy={verticalListSortingStrategy}>
                  <div className="space-y-3">
                    {evals.map(evalItem => (
                      <SortableEvalItem
                        key={evalItem.id}
                        eval={evalItem}
                        onUpdate={handleUpdateEval}
                        onDelete={handleDeleteEval}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 flex justify-center">
          <Button
            variant="outline"
            size="lg"
            className="gap-2 text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
            onClick={onResetConfig}
          >
            <RefreshCw className="h-4 w-4" />
            Reset All Settings to Default
          </Button>
        </div>
      </div>
    </main>
  );
}

interface DocumentTypeCardProps {
  type: DocumentType;
  description: string;
  isSelected: boolean;
  onClick: () => void;
}

function DocumentTypeCard({ type, description, isSelected, onClick }: DocumentTypeCardProps) {
  return (
    <div
      className={`relative rounded-lg border-2 p-4 ${
        isSelected ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/50'
      } cursor-pointer transition-all hover:shadow-md`}
      onClick={onClick}
    >
      <div className="mb-2 flex items-center gap-2">
        {getDocumentTypeIcon(type, false)}
        <h3 className="font-medium">{type}</h3>
        {isSelected && (
          <div className="absolute right-2 top-2 rounded-full bg-primary p-0.5 text-primary-foreground">
            <Check className="h-3 w-3" />
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
