import { LLMConfig, ActionButton, EvalItem } from '@/types';

const API_BASE_URL = 'http://localhost:8000/api';

export async function connectLLM(
  config: LLMConfig
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/connect_llm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: config.type,
        ...(config.type === 'openai'
          ? { api_key: config.apiKey }
          : { host: config.host, port: config.port }),
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to connect to LLM:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to connect to LLM',
    };
  }
}

export async function submitAction(
  action: ActionButton,
  text: string,
  aboutMe: string,
  preferredStyle: string,
  tone: string,
  documentType: string
): Promise<{ text: string }> {
  try {
    // Create a more specific action description based on document type
    let actionDescription = '';
    if (documentType === 'X') {
      actionDescription = `${action.action} optimized for Twitter/X (under 280 characters, engaging, shareable)`;
    } else if (documentType === 'LinkedIn') {
      actionDescription = `${action.action} formatted for a professional LinkedIn post`;
    } else if (documentType === 'Blog') {
      actionDescription = `${action.action} formatted as a blog post with proper structure`;
    } else if (documentType === 'Essay') {
      actionDescription = `${action.action} formatted as a formal essay`;
    } else if (documentType === 'Threads') {
      actionDescription = `${action.action} formatted as a Twitter/X thread with numbered points`;
    } else if (documentType === 'Reddit') {
      actionDescription = `${action.action} formatted for a Reddit post`;
    } else {
      actionDescription = `${action.action} for a ${documentType} format`;
    }

    const response = await fetch(`${API_BASE_URL}/submit_action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: action.name.toLowerCase(),
        action_description: actionDescription,
        text,
        about_me: aboutMe,
        preferred_style: preferredStyle,
        tone,
        document_type: documentType,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to process action');
    }

    return await response.json();
  } catch (error) {
    console.error('Action processing failed:', error);
    throw error;
  }
}

export async function submitEval(
  evalItem: EvalItem,
  text: string
): Promise<{ score: number; result: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/submit_eval`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eval_name: evalItem.name.toLowerCase(),
        eval_description: evalItem.description,
        text,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to process evaluation');
    }

    return await response.json();
  } catch (error) {
    console.error('Eval processing failed:', error);
    throw error;
  }
}

export async function sendChatMessage(
  message: string,
  editorContent?: string
): Promise<{ text: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        context: editorContent ? `Current editor content: ${editorContent}` : undefined,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    return await response.json();
  } catch (error) {
    console.error('Chat error:', error);
    throw error;
  }
}
