<template>
  <div class="chat-messages__messages__start-feedbacks">
    <ChatFeedback
      class="chat-messages__messages__start-feedbacks__date"
      :feedback="dateFeedback"
      :scheme="isClosedChat ? 'gray' : 'purple'"
      divisor
    />
    <ChatFeedback
      v-if="showWaitingFeedback"
      :feedback="$t('waiting_answer.waiting_cliente_answer')"
      :scheme="isClosedChat ? 'gray' : 'blue'"
    />
  </div>
</template>

<script>
import ChatFeedback from '../ChatFeedback.vue';

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
    isClosedChat: {
      type: Boolean,
      default: false,
    },
  },
};
</script>
