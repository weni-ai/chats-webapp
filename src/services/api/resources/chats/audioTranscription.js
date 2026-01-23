import http from '@/services/api/http';
import i18n from '@/plugins/i18n';
import { asyncTimeout } from '@/utils/time';

export default {
  async generateAudioTranscription(messageUuid) {
    const response = await http.post(
      `/ai_features/transcription/${messageUuid}/`,
    );
    return response.data;
  },

  async getAudioTranscriptionFeedbackTags() {
    // const response = await http.get(
    //   `/ai_features/transcription/feedback/tags/`,
    //   {
    //     headers: {
    //       'Accept-Language': i18n.global.locale,
    //     },
    //   },
    // );
    // TODO: Remove mock
    await asyncTimeout(2000);

    return { TAG1: 'TAG1', TAG2: 'TAG2' };
    // return response.data;
  },

  async sendAudioTranscriptionFeedback(messageUuid, { liked, tags, text }) {
    const response = await http.post(
      `/msg/${messageUuid}/transcription/feedback/`,
      { liked, tags, text },
    );
    return response.data;
  },
};
