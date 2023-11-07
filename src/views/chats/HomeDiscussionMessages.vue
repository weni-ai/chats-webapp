<template>
  <section class="home-discussion-messages">
    <unnnic-chats-header
      :title="discussion.subject"
      :subtitle="`${$t('discussions.title')} ${$t('about')} ${discussion.contact}`"
      avatarIcon="forum"
      size="small"
    />
    <chats-dropzone @open-file-uploader="openFileUploader">
      <chat-messages
        v-if="discussion?.uuid"
        :chatUuid="discussion.uuid"
        :messages="discussionMessages"
        :messagesSorted="discussionMessagesSorted"
        :messagesSendingUuids="discussionMessagesSendingUuids"
        :messagesFailedUuids="discussionMessagesFailedUuids"
        :resendMessages="discussionResendMessages"
        :resendMessage="discussionResendMessage"
        :resendMedia="discussionResendMedia"
        signatures
        @scrollTop="searchForMoreMessages"
      />

      <message-manager
        ref="message-editor"
        v-model="textBoxMessage"
        isDiscussion
        @open-file-uploader="openFileUploader"
      />
    </chats-dropzone>
  </section>
</template>

<script>
import { mapActions, mapState } from 'vuex';

import ChatsDropzone from '@/layouts/ChatsLayout/components/ChatsDropzone';
import ChatMessages from '@/components/chats/chat/ChatMessages/index.vue';
import MessageManager from '@/components/chats/MessageManager';

export default {
  name: 'HomeDiscussionMessages',
  components: {
    ChatsDropzone,
    ChatMessages,
    MessageManager,
  },

  data: () => {
    return {
      page: 0,
      limit: 20,
      textBoxMessage: '',
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
      discussionResendMessages: 'chats/discussionMessages/resendMessages',
      discussionResendMessage: 'chats/discussionMessages/discussionResendMessage',
      discussionResendMedia: 'chats/discussionMessages/resendMedia',
    }),

    openFileUploader(files) {
      this.$emit('open-file-uploader', files);
    },

    async getDiscussionMessages() {
      await this.$store
        .dispatch('chats/discussionMessages/getDiscussionMessages', {
          offset: this.page * this.limit,
          limit: this.limit,
        })
        .then(() => {
          this.$emit('handle-room-skeleton', false);
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
      handler(discussionUuid) {
        if (discussionUuid) {
          this.getDiscussionMessages();
        }
      },
    },
  },
};
</script>

<style lang="scss" scoped>
.home-discussion-messages {
  padding-bottom: $unnnic-spacing-sm;

  height: 100%;
  max-height: 100vh;

  display: flex;
  flex-direction: column;

  :deep(.unnnic-chats-header) {
    .unnnic-chats-header__avatar-icon {
      background-color: $unnnic-color-aux-purple-500;

      [class*='unnnic-icon'] {
        color: $unnnic-color-weni-50;
      }
    }
  }
}
</style>
