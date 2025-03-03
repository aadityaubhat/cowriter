import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { ActionButton } from '@/types';

interface ActionButtonsProps {
  actions: ActionButton[];
  isProcessing: boolean;
  isLLMConnected: boolean;
  onActionClick: (action: ActionButton) => void;
}

export function ActionButtons({
  actions,
  isProcessing,
  isLLMConnected,
  onActionClick,
}: ActionButtonsProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <Card
      className={`overflow-hidden shadow-lg ${!isLLMConnected ? 'pointer-events-none opacity-50' : ''}`}
    >
      <Button
        variant="ghost"
        className="flex w-full items-center justify-between p-4"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <span className="text-lg font-semibold">Actions</span>
        {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
      </Button>
      <div
        className={`transition-all duration-200 ease-in-out ${isCollapsed ? 'h-0' : 'max-h-[300px] overflow-y-auto'}`}
      >
        <div className="space-y-2 p-2">
          {actions.map(action => (
            <Button
              key={action.id}
              variant="default"
              className="h-10 w-full bg-blue-500 text-base font-medium hover:bg-blue-600"
              onClick={() => onActionClick(action)}
              disabled={isProcessing || !isLLMConnected}
            >
              <span className="mr-2 text-xl">{action.emoji}</span>
              {action.name}
            </Button>
          ))}
        </div>
      </div>
    </Card>
  );
}
