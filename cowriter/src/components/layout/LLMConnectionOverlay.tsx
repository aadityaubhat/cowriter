import { Card } from '@/components/ui/card';
import { LLMConnectionModal } from './LLMConnectionModal';
import { LLMConfig } from '@/types';

interface LLMConnectionOverlayProps {
  isConnecting: boolean;
  llmConfig: LLMConfig;
  onConnect: (config: LLMConfig) => void;
}

export function LLMConnectionOverlay({
  isConnecting,
  llmConfig,
  onConnect,
}: LLMConnectionOverlayProps) {
  if (llmConfig.type) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/50 backdrop-blur-[1px]">
      <Card className="p-6 text-center shadow-lg">
        <h3 className="mb-2 text-lg font-semibold">No LLM Connected</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Connect to an LLM to use actions and chat
        </p>
        <LLMConnectionModal
          isConnecting={isConnecting}
          llmConfig={llmConfig}
          onConnect={onConnect}
        />
      </Card>
    </div>
  );
}
