<template>
  <ChatMessages
    :chatUuid="discussion?.uuid || ''"
    :messages="discussionMessages"
    :messagesNext="discussionMessagesNext || ''"
    :messagesPrevious="discussionMessagesPrevious || ''"
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
import { mapActions, mapState } from 'pinia';

import { useDiscussions } from '@/store/modules/chats/discussions';
import { useDiscussionMessages } from '@/store/modules/chats/discussionMessages';

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
    ...mapState(useDiscussions, {
      discussion: (store) => store.activeDiscussion,
    }),
    ...mapState(useDiscussionMessages, [
      'discussionMessages',
      'discussionMessagesNext',
      'discussionMessagesPrevious',
      'discussionMessagesSorted',
      'discussionMessagesSendingUuids',
      'discussionMessagesFailedUuids',
    ]),
  },

  methods: {
    ...mapActions(useDiscussionMessages, {
      discussionResendMessages: 'resendDiscussionMessages',
      discussionResendMedia: 'resendDiscussionMedia',
      getDiscussionMessages: 'getDiscussionMessages',
      resetDiscussionMessages: 'resetDiscussionMessages',
    }),

    handlingGetDiscussionMessages() {
      this.isLoading = true;
      this.getDiscussionMessages({
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
        this.handlingGetDiscussionMessages();
      }
    },
  },

  watch: {
    'discussion.uuid': {
      immediate: true,
      async handler(discussionUuid) {
        if (discussionUuid) {
          await this.resetDiscussionMessages();
          this.page = 0;
          this.handlingGetDiscussionMessages();
        }
      },
    },
  },
};
</script>
