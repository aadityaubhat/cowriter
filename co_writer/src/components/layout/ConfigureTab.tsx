import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { LLMConnectionModal } from './LLMConnectionModal';
import { SortableActionItem } from '@/components/actions/SortableActionItem';
import { SortableEvalItem } from '@/components/evals/SortableEvalItem';
import { ActionButton, EvalItem, LLMConfig } from '@/types';
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
            <LLMConnectionModal
              isConnecting={isConnecting}
              llmConfig={llmConfig}
              onConnect={onConnectLLM}
            />
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
                  onChange={e => onUpdateAboutMe(e.target.value)}
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
                    onChange={e => onUpdatePreferredStyle(e.target.value)}
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
                    onChange={e => onUpdateTone(e.target.value)}
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

            {/* Evals Configuration */}
            <Card className="mt-8 p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Evals</h2>
                <Button variant="outline" onClick={handleAddEval}>
                  Add Eval
                </Button>
              </div>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleEvalDragEnd}
              >
                <SortableContext items={evals} strategy={verticalListSortingStrategy}>
                  {evals.map(evalItem => (
                    <SortableEvalItem
                      key={evalItem.id}
                      eval={evalItem}
                      onUpdate={handleUpdateEval}
                      onDelete={handleDeleteEval}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </Card>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <Button
            variant="outline"
            size="lg"
            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={onResetConfig}
          >
            Reset All Settings to Default
          </Button>
        </div>
      </div>
    </main>
  );
}
