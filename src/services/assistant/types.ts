export type AssistantDirection = 'human' | 'ai';

export type AssistantMessageType =
  | 'text'
  | 'audio'
  | 'image'
  | 'video'
  | 'file';

export type AssistantMessage = {
  id: string;
  direction: AssistantDirection;
  type: AssistantMessageType;
  text: string;
  media?: string;
  filename?: string;
  mimeType?: string;
  size?: number;
  duration?: number;
  suggestion?: string;
  quickReplies: string[];
  status: string;
  timestamp: number;
};

export type AssistantQuickReply = string;
