import type { FlowTemplate } from '@/components/chats/FlowsTrigger/types';

export const hasTemplateVariables = (templates: FlowTemplate[]): boolean =>
  templates.some((t) => (t?.variables?.length ?? 0) > 0);
