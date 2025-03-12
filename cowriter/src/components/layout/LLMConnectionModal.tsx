import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LLMConfig } from '@/types';
import { Server, Key, AlertCircle } from 'lucide-react';

interface LLMConnectionModalProps {
  isConnecting: boolean;
  llmConfig: LLMConfig;
  onConnect: (config: LLMConfig) => void;
}

export function LLMConnectionModal({
  isConnecting,
  llmConfig,
  onConnect,
}: LLMConnectionModalProps) {
  const [selectedLLM, setSelectedLLM] = useState<'openai' | 'llama'>(
    (llmConfig.type as 'openai' | 'llama') || 'openai'
  );
  const [apiKey, setApiKey] = useState(llmConfig.apiKey || '');
  const [host, setHost] = useState(llmConfig.host || 'http://host.docker.internal');
  const [port, setPort] = useState(llmConfig.port || '8080');
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
    onConnect(config);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          disabled={isConnecting}
          className="gap-2 border-2 transition-all hover:shadow-sm"
        >
          <Server className="h-4 w-4" />
          {isConnecting ? 'Connecting...' : llmConfig.type ? 'Update Connection' : 'Connect Now'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Server className="h-5 w-5 text-primary" />
            Connect to LLM
          </DialogTitle>
          <DialogDescription>
            Choose your LLM provider and enter the required credentials.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-5 py-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">LLM Provider</label>
            <Select
              value={selectedLLM}
              onValueChange={(value: 'openai' | 'llama') => {
                setSelectedLLM(value);
                setError(null);
              }}
            >
              <SelectTrigger className="border-2 focus:ring-1">
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
              <label className="flex items-center gap-2 text-sm font-medium">
                <Key className="h-4 w-4 text-muted-foreground" />
                API Key
              </label>
              <Input
                type="password"
                placeholder="Enter your OpenAI API key"
                value={apiKey}
                className="border-2 focus-visible:ring-1"
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
                  className="border-2 focus-visible:ring-1"
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
                  className="border-2 focus-visible:ring-1"
                  onChange={e => {
                    setPort(e.target.value);
                    setError(null);
                  }}
                />
              </div>
            </>
          )}
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-500">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
          <DialogFooter className="mt-2">
            <Button onClick={handleConnect} disabled={isConnecting} className="w-full gap-2">
              <Server className="h-4 w-4" />
              {isConnecting ? 'Connecting...' : 'Connect'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
