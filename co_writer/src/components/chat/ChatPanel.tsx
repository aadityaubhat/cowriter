import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';
import { Message } from '@/types';

interface ChatPanelProps {
  messages: Message[];
  isProcessing: boolean;
  isLLMConnected: boolean;
  onSendMessage: (message: string) => void;
}

export function ChatPanel({
  messages,
  isProcessing,
  isLLMConnected,
  onSendMessage,
}: ChatPanelProps) {
  const [inputMessage, setInputMessage] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of chat when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !isLLMConnected || isProcessing) return;
    onSendMessage(inputMessage);
    setInputMessage('');
  };

  return (
    <Card
      className={`min-h-0 flex-1 overflow-hidden shadow-lg ${!isLLMConnected ? 'pointer-events-none opacity-50' : ''}`}
    >
      <div className="flex h-full flex-col">
        <h3 className="p-4 pb-2 text-lg font-semibold">Chat</h3>
        <div ref={chatContainerRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4">
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-lg p-3 ${message.isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
              >
                <p className="whitespace-pre-wrap text-sm">{message.text}</p>
                <p className="mt-1 text-xs opacity-70">{message.timestamp.toLocaleTimeString()}</p>
              </div>
            </div>
          ))}
          {isProcessing && (
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
              disabled={isProcessing || !isLLMConnected}
            />
            <Button
              size="icon"
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isProcessing || !isLLMConnected}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
