import { ref, computed } from 'vue';
import { defineStore } from 'pinia';

import AiTextImprovement from '@/services/api/resources/chats/aiTextImprovement';
import type { AiTextImprovementType } from '@/services/api/resources/chats/aiTextImprovement';

import callUnnnicAlert from '@/utils/callUnnnicAlert';
import i18n from '@/plugins/i18n';

export type AiTextImprovementFeedback = 'USED' | 'DISCARDED' | 'EDITED';

const LOCAL_STORAGE_KEY = 'ai_text_improvement_new_tag_seen';

export const useAiTextImprovement = defineStore('aiTextImprovement', () => {
  const { t } = i18n.global;

  const isLoading = ref(false);
  const isPopoverOpen = ref(false);
  const selectedType = ref<AiTextImprovementType | null>(null);
  const improvedText = ref('');
  const originalText = ref('');
  const abortController = ref<AbortController | null>(null);

  const showNewTag = ref(localStorage.getItem(LOCAL_STORAGE_KEY) !== 'true');

  const feedbackStatus = ref<AiTextImprovementFeedback | null>(null);

  const hasImprovedText = computed(() => !!improvedText.value);

  function hideNewTag() {
    showNewTag.value = false;
    localStorage.setItem(LOCAL_STORAGE_KEY, 'true');
  }

  function getAiTextImprovementPayload(currentText: string) {
    if (!selectedType.value || !feedbackStatus.value) return null;

    if (feedbackStatus.value === 'USED') {
      const wasEdited = currentText !== improvedText.value;
      return {
        status: wasEdited ? 'EDITED' : 'USED',
        type: selectedType.value,
      };
    }

    return {
      status: feedbackStatus.value,
      type: selectedType.value,
    };
  }

  async function requestImprovement(text: string, type: AiTextImprovementType) {
    isPopoverOpen.value = false;
    isLoading.value = true;
    selectedType.value = type;
    originalText.value = text;
    feedbackStatus.value = null;

    abortController.value = new AbortController();

    try {
      const response = await AiTextImprovement.improve(
        { text, type },
        { signal: abortController.value.signal },
      );

      improvedText.value = response.text;
      feedbackStatus.value = 'USED';

      return response.text;
    } catch (error: unknown) {
      if ((error as Error).name === 'CanceledError') {
        return null;
      }

      callUnnnicAlert({
        props: {
          text: t('ai_text_improvement.error'),
          type: 'error',
        },
      });

      return null;
    } finally {
      isLoading.value = false;
      abortController.value = null;
    }
  }

  function cancelImprovement() {
    if (abortController.value) {
      abortController.value.abort();
      abortController.value = null;
    }

    isLoading.value = false;
    feedbackStatus.value = null;
  }

  function reset() {
    isLoading.value = false;
    isPopoverOpen.value = false;
    selectedType.value = null;
    improvedText.value = '';
    originalText.value = '';
    feedbackStatus.value = null;

    if (abortController.value) {
      abortController.value.abort();
      abortController.value = null;
    }
  }

  return {
    isLoading,
    isPopoverOpen,
    selectedType,
    improvedText,
    originalText,
    showNewTag,
    feedbackStatus,

    hasImprovedText,

    hideNewTag,
    getAiTextImprovementPayload,
    requestImprovement,
    cancelImprovement,
    reset,
  };
});
