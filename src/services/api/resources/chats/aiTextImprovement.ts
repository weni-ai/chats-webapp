import http from '@/services/api/http';
import { getProject } from '@/utils/config';

export type AiTextImprovementType =
  | 'GRAMMAR_AND_SPELLING'
  | 'MORE_EMPATHY'
  | 'CLARITY';

interface ImproveRequest {
  text: string;
  type: AiTextImprovementType;
}

interface ImproveResponse {
  text: string;
}

// TODO: Remove mock and uncomment real implementation when backend is ready
const USE_MOCK = true;

const MOCK_RESPONSES: Record<AiTextImprovementType, (text: string) => string> =
  {
    GRAMMAR_AND_SPELLING: (text) =>
      `[Grammar fixed] ${text.charAt(0).toUpperCase()}${text.slice(1)}.`,
    MORE_EMPATHY: (text) =>
      `[More empathetic] I completely understand your concern. ${text}`,
    CLARITY: (text) => `[Clearer] To summarize: ${text}`,
  };

function mockImprove(
  {
    text,
    type,
  }: { text: string; type: AiTextImprovementType; projectUuid: string },
  { signal }: { signal?: AbortSignal } = {},
): Promise<ImproveResponse> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => resolve({ text: MOCK_RESPONSES[type](text) }),
      5000,
    );

    signal?.addEventListener('abort', () => {
      clearTimeout(timeout);
      reject(new DOMException('The operation was aborted.', 'AbortError'));
    });
  });
}

export default {
  async improve(
    { text, type }: ImproveRequest,
    { signal }: { signal?: AbortSignal } = {},
  ): Promise<ImproveResponse> {
    const projectUuid = getProject();

    if (USE_MOCK) {
      return mockImprove({ text, type, projectUuid }, { signal });
    }

    const response = await http.post(
      '/ai_features/ai_text_improvement/',
      { text, type, project_uuid: projectUuid },
      { signal },
    );
    return response.data;
  },
};
