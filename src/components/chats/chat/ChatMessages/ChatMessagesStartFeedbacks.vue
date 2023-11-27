<template>
  <div class="chat-messages__messages__start-feedbacks">
    <chat-feedback
      :feedback="dateFeedback"
      class="chat-messages__messages__start-feedbacks__date"
      scheme="purple"
      divisor
    />
    <chat-feedback
      v-if="showWaitingFeedback"
      :feedback="$t('waiting_answer.waiting_cliente_answer')"
    />
  </div>
</template>

<script>
import ChatFeedback from '../ChatFeedback';

export default {
  name: 'ChatMessagesStartFeedbacks',

  components: {
    ChatFeedback,
  },

  props: {
    dateFeedback: {
      type: String,
      required: true,
    },
    showWaitingFeedback: {
      type: Boolean,
      default: false,
    },
  },
};
</script>
