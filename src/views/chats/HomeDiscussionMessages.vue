<template>
  <section class="home-discussion-messages">
    <unnnic-chats-header
      :title="discussion.subject"
      :subtitle="`${$t('discussions.title')} ${$t('about')} ${discussion.contact}`"
      :avatarName="discussion.subject"
      :close="() => {}"
    />
    <chats-dropzone @open-file-uploader="$emit('openFileUploader', $event)">
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
        @scrollTop="searchForMoreMessages"
      />

      <!-- <message-manager
        v-if="isMessageManagerVisible && !room.is_waiting"
        ref="message-editor"
        v-model="textBoxMessage"
        :audio.sync="audioMessage"
        @show-quick-messages="handlerShowQuickMessages"
        @send-audio="sendAudio"
        @open-file-uploader="$emit('openFileUploader', $event)"
        :loadingValue="totalValue"
        :loading="isLoading"
      /> -->
    </chats-dropzone>
  </section>
</template>

<script>
import { mapActions, mapState } from 'vuex';

import ChatsDropzone from '@/layouts/ChatsLayout/components/ChatsDropzone';
import ChatMessages from '@/components/chats/chat/ChatMessages/index.vue';

export default {
  name: 'HomeDiscussionMessages',
  components: {
    ChatsDropzone,
    ChatMessages,
  },

  data: () => {
    return {
      page: 0,
      limit: 20,
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

<style></style>
