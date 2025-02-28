import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { GripVertical, X as XIcon, Smile } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { ActionButton } from '@/types';

interface SortableActionItemProps {
  action: ActionButton;
  onUpdate: (id: string, updates: Partial<ActionButton>) => void;
  onDelete: (id: string) => void;
}

export function SortableActionItem({ action, onUpdate, onDelete }: SortableActionItemProps) {
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
        <XIcon className="h-4 w-4" />
      </Button>
    </div>
  );
}
