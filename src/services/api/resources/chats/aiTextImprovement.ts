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

export default {
  async improve(
    { text, type }: ImproveRequest,
    { signal }: { signal?: AbortSignal } = {},
  ): Promise<ImproveResponse> {
    const projectUuid = getProject();

    const response = await http.post(
      '/ai_features/ai_text_improvement/',
      { text, type, project_uuid: projectUuid },
      { signal },
    );
    return response.data;
  },
};
