<template>
  <section class="home-chat-discussion">
    <unnnic-chats-header
      :title="discussion.subject"
      :subtitle="`${$t('discussions.title')} ${$t('about')} ${discussion.contact}`"
      :avatarName="discussion.subject"
      :close="() => {}"
    />
    <chats-dropzone @open-file-uploader="$emit('openFileUploader', $event)">
      <!-- <chat-messages
        :room="room"
        @scrollTop="searchForMoreMessages"
      /> -->

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
import { mapState } from 'vuex';

import ChatsDropzone from '@/layouts/ChatsLayout/components/ChatsDropzone';

export default {
  name: 'HomeChatDiscussion',
  components: {
    ChatsDropzone,
  },
  computed: {
    ...mapState({
      discussion: (state) => state.chats.discussions.activeDiscussion,
    }),
  },
};
</script>

<style></style>
