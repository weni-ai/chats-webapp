import { defineStore } from 'pinia';

export const useFeedback = defineStore('feedback', {
  state: () => ({
    isRenderFeedbackModal: false,
  }),

  actions: {
    setIsRenderFeedbackModal(value) {
      this.isRenderFeedbackModal = value;
    },
  },
});
