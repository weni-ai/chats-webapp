export type AssistantDirection = 'human' | 'ai';

export type AssistantMessage = {
  id: string;
  direction: AssistantDirection;
  text: string;
  suggestion?: string;
  quickReplies: string[];
  status: string;
  timestamp: number;
};

export type AssistantQuickReply = string;
