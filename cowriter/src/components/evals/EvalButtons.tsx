import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronDown, ChevronUp, Eye } from 'lucide-react';
import { EvalItem } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import ReactMarkdown from 'react-markdown';

interface EvalButtonsProps {
  evals: EvalItem[];
  isProcessing: boolean;
  isLLMConnected: boolean;
  onEvalClick: (evalItem: EvalItem) => void;
  openEvalDialogId?: string | null;
  onDialogOpenChange?: (id: string | null) => void;
}

export function EvalButtons({
  evals,
  isProcessing,
  isLLMConnected,
  onEvalClick,
  openEvalDialogId,
  onDialogOpenChange,
}: EvalButtonsProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [localOpenDialogId, setLocalOpenDialogId] = useState<string | null>(null);

  const isDialogOpen = (evalId: string) => {
    if (onDialogOpenChange) {
      return openEvalDialogId === evalId;
    } else {
      return localOpenDialogId === evalId;
    }
  };

  const handleDialogOpenChange = (evalId: string, open: boolean) => {
    if (onDialogOpenChange) {
      onDialogOpenChange(open ? evalId : null);
    } else {
      setLocalOpenDialogId(open ? evalId : null);
    }
  };

  return (
    <Card
      className={`overflow-hidden shadow-lg ${!isLLMConnected ? 'pointer-events-none opacity-50' : ''}`}
    >
      <Button
        variant="ghost"
        className="flex w-full items-center justify-between p-4"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <span className="text-lg font-semibold">Evals</span>
        {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
      </Button>
      <div
        className={`transition-all duration-200 ease-in-out ${isCollapsed ? 'h-0' : 'max-h-[300px] overflow-y-auto'}`}
      >
        <div className="space-y-2 p-2">
          {evals.map(evalItem => (
            <div key={evalItem.id} className="mb-2">
              <div className="flex items-center gap-2">
                {/* Eval button */}
                <Button
                  variant="default"
                  className="h-10 flex-1 bg-blue-500 text-base font-medium hover:bg-blue-600"
                  onClick={() => onEvalClick(evalItem)}
                  disabled={isProcessing || !isLLMConnected}
                >
                  <span className="mr-2 text-xl">{evalItem.emoji}</span>
                  {evalItem.name}
                </Button>

                {/* Score display */}
                <div
                  className={`flex h-10 w-14 items-center justify-center rounded-md text-sm font-medium ${
                    evalItem.score !== undefined
                      ? evalItem.score >= 7
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                        : evalItem.score >= 4
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
                  }`}
                >
                  <span className="font-medium">
                    {evalItem.score !== undefined ? evalItem.score : 'N/A'}
                  </span>
                </div>

                {/* View details button and dialog */}
                {evalItem.result && (
                  <Dialog
                    open={isDialogOpen(evalItem.id)}
                    onOpenChange={open => handleDialogOpenChange(evalItem.id, open)}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 text-muted-foreground hover:text-foreground"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <span>{evalItem.emoji}</span>
                          <span>{evalItem.name}</span>
                        </DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground">
                          {evalItem.description}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="mt-4">
                        <div className="mb-2 flex items-center gap-2">
                          <span className="font-medium">Score:</span>
                          <span
                            className={`rounded-md px-2 py-1 text-sm font-medium ${
                              evalItem.score !== undefined
                                ? evalItem.score >= 7
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                                  : evalItem.score >= 4
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
                            }`}
                          >
                            {evalItem.score !== undefined ? evalItem.score : 'N/A'}
                          </span>
                          {evalItem.score !== undefined && (
                            <span className="text-sm text-muted-foreground">
                              (
                              {evalItem.score >= 7
                                ? 'Good'
                                : evalItem.score >= 4
                                  ? 'Average'
                                  : 'Poor'}
                              )
                            </span>
                          )}
                        </div>
                        <div className="border-t pt-4">
                          <div className="markdown-content">
                            <ReactMarkdown>{evalItem.result || ''}</ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
