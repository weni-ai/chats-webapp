import http from '@/services/api/http';

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

export default {
  async improve(
    { text, type }: ImproveRequest,
    { signal }: { signal?: AbortSignal } = {},
  ): Promise<ImproveResponse> {
    const response = await http.post(
      '/ai_features/ai_text_improvement/',
      { text, type },
      { signal },
    );
    return response.data;
  },
};
