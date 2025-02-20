"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Editor } from "@/components/editor";
import { useState, useEffect, useRef } from "react";
import {
  ChevronDown,
  ChevronUp,
  Send,
  Wand2,
  Minimize2,
  MessageSquare,
  GripVertical,
  X,
  Smile,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { Textarea } from "@/components/ui/textarea";
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

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: action.id });

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
      className="flex items-center gap-2 bg-card p-4 rounded-lg border mb-2"
    >
      <div {...attributes} {...listeners}>
        <GripVertical className="h-5 w-5 cursor-grab text-muted-foreground" />
      </div>
      <div className="flex-1">
        <div className="flex gap-2 mb-2">
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
              <div ref={pickerRef} className="absolute top-full left-0 mt-1 z-50">
                <EmojiPicker onEmojiClick={handleEmojiClick} />
              </div>
            )}
          </div>
          <Input
            value={action.name}
            className="flex-1"
            placeholder="Button name"
            onChange={(e) => onUpdate(action.id, { name: e.target.value })}
          />
        </div>
        <Textarea
          value={action.action}
          className="min-h-[60px]"
          placeholder="Describe the action..."
          onChange={(e) => onUpdate(action.id, { action: e.target.value })}
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
  const [messages, setMessages] = useState<Message[]>([
    {
      text: "Hello! I'm Co Writer. How can I help you today?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
    setActions(actions.map(action =>
      action.id === id ? { ...action, ...updates } : action
    ));
  };

  const handleDeleteAction = (id: string) => {
    setActions(actions.filter(action => action.id !== id));
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setActions((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    setMessages((prev) => [
      ...prev,
      { text: inputMessage, isUser: true, timestamp: new Date() },
    ]);
    setInputMessage("");
  };

  // Update the buttons in the Write tab to use configured actions
  const renderActionButtons = () => {
    return actions.map((action) => (
      <Button
        key={action.id}
        variant="default"
        className="w-full h-10 text-base font-medium bg-blue-500 hover:bg-blue-600"
      >
        <span className="text-xl mr-2">{action.emoji}</span>
        {action.name}
      </Button>
    ));
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navbar */}
      <nav className="border-b bg-background">
        <div className="px-4 flex h-14 items-center">
          <span className="font-bold text-lg mr-8">CoWriter</span>

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

          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      {activeTab === 'write' && (
        <main className="flex-1 flex min-h-[calc(100vh-3.5rem)]">
          <div className="flex-1 p-4 flex">
            <div className="flex gap-6 flex-1">
              {/* Left side - Rich Text Editor */}
              <Card className="flex-1 flex flex-col overflow-hidden">
                <Editor />
              </Card>

              {/* Right side - Action buttons and Chat */}
              <div className="w-80 flex flex-col gap-4">
                {/* Collapsible Buttons */}
                <Card className="shadow-lg overflow-hidden">
                  <Button
                    variant="ghost"
                    className="w-full flex items-center justify-between p-4"
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
                    className={`transition-all duration-200 ease-in-out ${isCollapsed ? "h-0" : "h-auto"}`}
                  >
                    <div className="p-2 space-y-2">
                      {renderActionButtons()}
                    </div>
                  </div>
                </Card>

                {/* Chat */}
                <Card className="shadow-lg flex-1">
                  <div className="p-4 flex flex-col h-full">
                    <h3 className="text-lg font-semibold mb-4 text-foreground">Chat</h3>
                    <div className={`flex flex-col flex-1 ${isCollapsed ? 'h-[calc(100vh-16rem)]' : 'h-[400px]'} transition-all duration-200`}>
                      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                        {messages.map((message, index) => (
                          <div
                            key={index}
                            className={`flex ${message.isUser ? "justify-end" : "justify-start"
                              }`}
                          >
                            <div
                              className={`max-w-[80%] rounded-lg p-3 ${message.isUser
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                                }`}
                            >
                              <p className="text-sm">{message.text}</p>
                              <p className="text-xs opacity-70 mt-1">
                                {message.timestamp.toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Type a message..."
                          value={inputMessage}
                          onChange={(e) => setInputMessage(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleSendMessage();
                            }
                          }}
                        />
                        <Button
                          size="icon"
                          onClick={handleSendMessage}
                          disabled={!inputMessage.trim()}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </main>
      )}
      {activeTab === 'configure' && (
        <main className="flex-1 p-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex gap-8">
              {/* Left Column */}
              <div className="flex-1 space-y-8">
                {/* About Me Section */}
                <Card className="p-6">
                  <h2 className="text-2xl font-semibold mb-4">About Me</h2>
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Share your background, expertise, and interests. This helps me understand your perspective and tailor the writing to match your voice and experience."
                      className="min-h-[200px]"
                    />
                  </div>
                </Card>

                {/* Writing Style Section */}
                <Card className="p-6">
                  <h2 className="text-2xl font-semibold mb-4">Writing Style</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Preferred Style</label>
                      <select className="w-full rounded-md border border-input bg-background px-3 h-10">
                        <option>Professional</option>
                        <option>Casual</option>
                        <option>Academic</option>
                        <option>Creative</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Tone</label>
                      <select className="w-full rounded-md border border-input bg-background px-3 h-10">
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
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-semibold">Action Buttons</h2>
                    <Button
                      variant="outline"
                      onClick={handleAddAction}
                    >
                      Add Action
                    </Button>
                  </div>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={actions}
                      strategy={verticalListSortingStrategy}
                    >
                      {actions.map((action) => (
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
