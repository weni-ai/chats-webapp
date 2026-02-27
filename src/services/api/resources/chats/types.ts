import type { AxiosResponse } from 'axios';

export type { AxiosResponse };

export interface PaginatedResponse<T> {
  results: T[];
  next: string | null;
  previous: string | null;
  count: number;
}

export interface Room {
  uuid: string;
  user: { email: string; [key: string]: any };
  contact: { uuid: string; name: string; [key: string]: any };
  queue?: { uuid: string; [key: string]: any };
  is_active: boolean;
  ended_at?: string | null;
  custom_fields?: Record<string, any>;
  [key: string]: any;
}

export interface Message {
  uuid: string;
  text: string;
  created_on: string;
  room?: string;
  discussion?: string;
  user?: Record<string, any>;
  contact?: Record<string, any>;
  media: Media[];
  replied_message?: Message | null;
  is_read?: boolean;
  is_delivered?: boolean;
  [key: string]: any;
}

export interface Media {
  id?: number;
  media_file: string;
  content_type: string;
  message?: string;
  [key: string]: any;
}

export interface Tag {
  uuid: string;
  name?: string;
  [key: string]: any;
}

export interface InternalNote {
  uuid: string;
  text: string;
  created_on?: string;
  room?: string;
  [key: string]: any;
}

export interface QueuePermission {
  uuid: string;
  role: string | number;
  [key: string]: any;
}
