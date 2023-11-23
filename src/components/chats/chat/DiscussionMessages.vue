<template>
  <chat-messages
    :chatUuid="discussion?.uuid || ''"
    :messages="discussionMessages"
    :messagesSorted="discussionMessagesSorted"
    :messagesSendingUuids="discussionMessagesSendingUuids"
    :messagesFailedUuids="discussionMessagesFailedUuids"
    :resendMessages="discussionResendMessages"
    :resendMedia="discussionResendMedia"
    :showChatSeparator="false"
    :isLoading="isLoading"
    signatures
    @scrollTop="searchForMoreMessages"
  />
</template>

<script>
import { mapActions, mapState } from 'vuex';

import ChatMessages from '@/components/chats/chat/ChatMessages/index.vue';

export default {
  name: 'DiscussionMessages',
  components: {
    ChatMessages,
  },

  data: () => {
    return {
      page: 0,
      limit: 20,
      isLoading: true,
    };
  },

  computed: {
    ...mapState({
      discussion: (state) => state.chats.discussions.activeDiscussion,
      discussionMessages: (state) => state.chats.discussionMessages.discussionMessages,
      discussionMessagesNext: (state) => state.chats.discussionMessages.discussionMessagesNext,
      discussionMessagesSorted: (state) => state.chats.discussionMessages.discussionMessagesSorted,
      discussionMessagesSendingUuids: (state) =>
        state.chats.discussionMessages.discussionMessagesSendingUuids,
      discussionMessagesFailedUuids: (state) =>
        state.chats.discussionMessages.discussionMessagesFailedUuids,
    }),
  },

  methods: {
    ...mapActions({
      discussionResendMessages: 'chats/discussionMessages/resendDiscussionMessages',
      discussionResendMedia: 'chats/discussionMessages/resendDiscussionMedia',
    }),

    async getDiscussionMessages() {
      this.isLoading = true;
      await this.$store
        .dispatch('chats/discussionMessages/getDiscussionMessages', {
          offset: this.page * this.limit,
          limit: this.limit,
        })
        .then(() => {
          this.isLoading = false;
        })
        .catch((error) => {
          console.error(error);
        });
    },

    searchForMoreMessages() {
      if (this.discussionMessagesNext) {
        this.page += 1;
        this.getDiscussionMessages();
      }
    },
  },

  watch: {
    'discussion.uuid': {
      immediate: true,
      async handler(discussionUuid) {
        if (discussionUuid) {
          await this.$store.dispatch('chats/discussionMessages/resetDiscussionMessages');
          this.page = 0;
          this.getDiscussionMessages();
        }
      },
    },
  },
};
</script>
