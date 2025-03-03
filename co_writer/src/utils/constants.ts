import { ActionButton, EvalItem, LLMConfig, DocumentType } from '@/types';

export const DEFAULT_ACTIONS: ActionButton[] = [
  { id: '1', name: 'Expand', action: 'Expand the text while maintaining the context', emoji: '✨' },
  { id: '2', name: 'Shorten', action: 'Make the text more concise', emoji: '✂️' },
  { id: '3', name: 'Critique', action: 'Provide feedback on the writing', emoji: '🎯' },
];

export const DEFAULT_EVALS: EvalItem[] = [
  {
    id: '1',
    name: 'Interesting',
    description: 'Evaluate how interesting and engaging the text is',
    emoji: '🧠',
  },
  {
    id: '2',
    name: 'Spammy',
    description: 'Check if the text contains spam-like content or excessive marketing language',
    emoji: '🚫',
  },
  {
    id: '3',
    name: 'Clarity',
    description: 'Assess how clear and easy to understand the text is',
    emoji: '💡',
  },
];

export const DEFAULT_CONFIG = {
  actions: DEFAULT_ACTIONS,
  evals: DEFAULT_EVALS,
  aboutMe: '',
  preferredStyle: 'Professional',
  tone: 'Formal',
};

export const WELCOME_MESSAGE = "Hello! I'm Co Writer. How can I help you today?";

export const ALL_DOCUMENT_TYPES: DocumentType[] = [
  'Blog',
  'Essay',
  'LinkedIn',
  'X',
  'Threads',
  'Reddit',
  'Custom',
];
