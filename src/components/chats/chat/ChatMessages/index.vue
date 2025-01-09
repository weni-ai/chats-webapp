<!-- eslint-disable vuejs-accessibility/alt-text -->
<!-- eslint-disable vuejs-accessibility/media-has-caption -->
<template>
  <div class="chat-messages__container">
    <ChatMessagesLoading v-show="isSkeletonLoadingActive" />
    <section
      v-show="!isSkeletonLoadingActive"
      v-if="chatUuid && messagesSorted"
      ref="chatMessages"
      class="chat-messages"
      @scroll="handleScroll"
    >
      <section
        v-for="messagesByDate in messagesSorted"
        :key="messagesByDate.date"
        class="chat-messages__container-date"
      >
        <ChatMessagesStartFeedbacks
          :dateFeedback="messagesByDate.date"
          :showWaitingFeedback="showWaitingFeedback"
          :isClosedChat="isClosedChat"
        />

        <section
          v-for="messagesByMinute in messagesByDate.minutes"
          :key="messagesByDate.date + messagesByMinute.minute"
          class="chat-messages__container-minute"
        >
          <template v-for="message in messagesByMinute.messages">
            <ChatFeedback
              v-if="isChatSeparatorFeedback(message.uuid) && showChatSeparator"
              :key="'feedback' + message.uuid"
              :feedback="
                startMessagesBy.agent === message.uuid
                  ? $t('chat_with.agent', { name: message?.user?.first_name })
                  : $t('chat_with.bot')
              "
              :scheme="isClosedChat ? 'gray' : 'blue'"
              :title="messageFormatTitle(new Date(message.created_on))"
            />

            <ChatMessagesFeedbackMessage
              v-if="isFeedbackMessage(message)"
              :key="message.uuid"
              :message="message"
              :scheme="isClosedChat ? 'gray' : 'blue'"
              :title="messageFormatTitle(new Date(message.created_on))"
            />

            <template v-else>
              <UnnnicChatsMessage
                v-if="message.text || isGeolocation(message.media?.[0])"
                :key="message.uuid"
                :ref="`message-${message.uuid}`"
                :type="messageType(message)"
                :class="[
                  'chat-messages__message',
                  messageType(message),
                  { 'different-user': isMessageByTwoDifferentUsers(message) },
                ]"
                :time="new Date(message.created_on)"
                :status="messageStatus({ message })"
                :title="messageFormatTitle(new Date(message.created_on))"
                :signature="messageSignature(message)"
              >
                {{
                  isGeolocation(message.media?.[0])
                    ? message.media?.[0]?.url
                    : message.text
                }}
              </UnnnicChatsMessage>
              <template v-for="media in message.media">
                <UnnnicChatsMessage
                  v-if="isMedia(media) && !isGeolocation(media)"
                  :key="media.message"
                  :ref="`message-${message.uuid}`"
                  :type="messageType(message)"
                  :class="[
                    'chat-messages__message',
                    messageType(message),
                    { 'different-user': isMessageByTwoDifferentUsers(message) },
                  ]"
                  :mediaType="
                    isImage(media)
                      ? 'image'
                      : isVideo(media)
                        ? 'video'
                        : 'audio'
                  "
                  :time="new Date(message.created_on)"
                  :status="messageStatus({ message })"
                  :title="messageFormatTitle(new Date(message.created_on))"
                  :signature="messageSignature(message)"
                  @click="resendMedia({ message, media })"
                >
                  <img
                    v-if="isImage(media)"
                    class="media image"
                    :src="media.url || media.preview"
                    @click="openFullScreen(media.url)"
                    @keypress.enter="openFullScreen(media.url)"
                  />
                  <VideoPlayer
                    v-else-if="isVideo(media)"
                    class="media"
                    :src="media.url || media.preview"
                  />
                  <UnnnicAudioRecorder
                    v-else-if="isAudio(media)"
                    ref="audio-recorder"
                    class="media audio"
                    :src="media.url || media.preview"
                    :canDiscard="false"
                    :reqStatus="messageStatus({ message, media })"
                    @failed-click="resendMedia({ message, media })"
                  />
                </UnnnicChatsMessage>
                <UnnnicChatsMessage
                  v-else-if="!isGeolocation(media)"
                  :key="media.created_on"
                  :ref="`message-${message.uuid}`"
                  :type="messageType(message)"
                  :class="[
                    'chat-messages__message',
                    messageType(message),
                    { 'different-user': isMessageByTwoDifferentUsers(message) },
                  ]"
                  :time="new Date(message.created_on)"
                  :documentName="
                    media.url?.split('/').at(-1) || media.file?.name
                  "
                  :status="messageStatus({ message })"
                  :title="messageFormatTitle(new Date(message.created_on))"
                  :signature="messageSignature(message)"
                  @click="documentClickHandler({ message, media })"
                />
              </template>
            </template>
          </template>
        </section>
      </section>
      <section
        v-if="tags.length > 0"
        v-show="!isSkeletonLoadingActive"
        class="chat-messages__tags"
      >
        <TagGroup :tags="tags" />
      </section>

      <!-- Media fullscreen -->
      <FullscreenPreview
        v-if="isFullscreen && currentMedia"
        :downloadMediaUrl="currentMedia?.url"
        :downloadMediaName="currentMedia?.message"
        @close="isFullscreen = false"
        @next="nextMedia"
        @previous="previousMedia"
      >
        <video
          v-if="currentMedia.content_type.includes('mp4')"
          controls
          @keypress.enter="() => {}"
          @click.stop="() => {}"
        >
          <source :src="currentMedia.url" />
        </video>
        <img
          v-else
          :src="currentMedia.url"
          :alt="currentMedia"
          @keypress.enter="() => {}"
          @click.stop="() => {}"
        />
      </FullscreenPreview>
    </section>
  </div>
</template>

<script>
import { mapState } from 'pinia';
import { useDashboard } from '@/store/modules/dashboard';

import moment from 'moment';

import { isMessageFromCurrentUser } from '@/utils/messages';
import Media from '@/services/api/resources/chats/media';

import ChatMessagesLoading from '@/views/loadings/chat/ChatMessages.vue';
import TagGroup from '@/components/TagGroup.vue';
import VideoPlayer from '@/components/chats/MediaMessage/Previews/Video.vue';
import FullscreenPreview from '@/components/chats/MediaMessage/Previews/Fullscreen.vue';

import ChatFeedback from '../ChatFeedback.vue';
import ChatMessagesStartFeedbacks from './ChatMessagesStartFeedbacks.vue';
import ChatMessagesFeedbackMessage from './ChatMessagesFeedbackMessage.vue';

export default {
  name: 'ChatMessages',

  components: {
    ChatMessagesLoading,
    ChatFeedback,
    ChatMessagesStartFeedbacks,
    ChatMessagesFeedbackMessage,
    TagGroup,
    FullscreenPreview,
    VideoPlayer,
  },

  props: {
    chatUuid: {
      type: String,
      required: true,
    },
    messages: {
      type: Array,
      required: true,
    },
    messagesNext: {
      type: String,
      required: true,
    },
    messagesPrevious: {
      type: String,
      default: '',
    },
    messagesSorted: {
      type: Array,
      required: true,
    },
    messagesSendingUuids: {
      type: Array,
      required: true,
    },
    messagesFailedUuids: {
      type: Array,
      required: true,
    },
    signatures: {
      type: Boolean,
      default: false,
    },

    resendMessages: {
      type: Function,
      required: true,
    },
    resendMedia: {
      type: Function,
      required: true,
    },

    tags: {
      type: Array,
      default: () => [],
      required: false,
    },

    showWaitingFeedback: {
      type: Boolean,
      default: false,
      required: false,
    },
    showChatSeparator: {
      type: Boolean,
      default: true,
      required: false,
    },

    isLoading: {
      type: Boolean,
      default: false,
    },
    isClosedChat: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['scrollTop'],

  data: () => ({
    messageToResend: null,
    isFullscreen: false,
    currentMedia: {},
    lastMessageUuidBeforePagination: null,
    prevChatUuid: null,
    startMessagesBy: {
      bot: '',
      agent: '',
    },
  }),

  computed: {
    ...mapState(useDashboard, ['viewedAgent']),
    medias() {
      return this.messages
        .map((el) => el.media)
        .flat()
        .filter((media) => this.isMedia(media));
    },

    isSkeletonLoadingActive() {
      const { isLoading, prevChatUuid, chatUuid } = this;
      return isLoading && prevChatUuid !== chatUuid;
    },
  },

  watch: {
    messages: {
      handler() {
        this.setStartFeedbacks();
        this.$nextTick(() => {
          this.manageScrollForNewMessages();
        });
      },
      deep: true,
    },
  },

  mounted() {
    window.addEventListener('online', () => {
      this.resendMessages();
    });

    // const observer = new IntersectionObserver((entries) => {
    //   entries.forEach((entry) => {
    //     console.log('intersecting', entry.isIntersecting);
    //   });
    // });
    // const { endChatElement } = this.$refs;

    // observer.observe(endChatElement.$el);
  },

  methods: {
    isMediaOfType(media, type) {
      return media && media.content_type?.includes(type);
    },
    isImage(media) {
      return this.isMediaOfType(media, 'image');
    },
    isVideo(media) {
      return this.isMediaOfType(media, 'video');
    },
    isAudio(media) {
      return this.isMediaOfType(media, 'audio');
    },
    isGeolocation(media) {
      if (media) {
        return this.isMediaOfType(media, 'geo');
      }
      return false;
    },
    isMedia(media) {
      const { isAudio, isImage, isVideo } = this;
      return isAudio(media) || isImage(media) || isVideo(media);
    },
    messageStatus({ message, media }) {
      if (message) {
        if (this.messagesSendingUuids.includes(message.uuid)) {
          return 'sending';
        }
        if (this.messagesFailedUuids.includes(message.uuid)) {
          return 'failed';
        }

        if (message.status) return message.status;

        if (media && this.isAudio(media)) {
          return 'default';
        }
      }
      return 'sent';
    },
    async documentClickHandler({ message, media }) {
      if (message && media) {
        const status = this.messageStatus({ message, media });

        if (status === 'failed') {
          this.resendMedia({ message, media });
        } else {
          try {
            const mediaToDownload = media.url || media.preview;
            const filename = media.url?.split('/').at(-1) || media.file?.name;

            Media.download({ media: mediaToDownload, name: filename });
          } catch (error) {
            console.error(
              'An error occurred when trying to download the media:',
              error,
            );
          }
        }
      }
    },

    // roomEndedChatFeedback(room) {
    //   return `${this.$t('chats.closed')} ${moment(room.ended_at).format('LT')}h ${moment(
    //     room.ended_at,
    //   ).format('L')}`;
    // },

    messageType(message) {
      return isMessageFromCurrentUser(message) ||
        this.isMessageByBot(message) ||
        (!message.discussion && !message.contact) ||
        message.user?.email === this.viewedAgent.email
        ? 'sent'
        : 'received';
    },

    isMessageByTwoDifferentUsers(message) {
      const messageIndex = this.messages.findIndex(
        (mappedMessage) => mappedMessage.uuid === message.uuid,
      );
      const indexedMessage = this.messages[messageIndex];
      const lastIndexedMessage = this.messages[messageIndex - 1];
      const existentMessage = indexedMessage?.uuid === message.uuid;

      if (existentMessage && lastIndexedMessage?.user && message.user) {
        return lastIndexedMessage.user.email !== message.user.email;
      }
      return false;
    },

    messageFormatTitle(date) {
      return `${moment(date).format('HH:mm')} | ${moment(date).format('L')}`;
    },

    messageSignature(message) {
      if (!this.signatures) {
        return '';
      }
      const { first_name, last_name, email } = message.user;
      return first_name ? `${first_name} ${last_name}` : email;
    },

    // isEdgeRoomMessage(messagesByDateMinutes) {
    //   return messagesByDateMinutes.some((minute) =>
    //     minute.messages.some((message) => message.room !== this.chatUuid),
    //   );
    // },

    setStartFeedbacks() {
      const newFirstMessageByAgentUuid = this.messages.find(
        (message) => message.user && !this.isFeedbackMessage(message),
      )?.uuid;
      const newFirstMessageByBotUuid = this.messages.find(
        (message) =>
          !message.contact && !message.user && !this.isFeedbackMessage(message),
      )?.uuid;

      if (newFirstMessageByAgentUuid) {
        this.startMessagesBy.agent = newFirstMessageByAgentUuid;
      }
      if (newFirstMessageByBotUuid) {
        this.startMessagesBy.bot = newFirstMessageByBotUuid;
      }
    },

    isChatSeparatorFeedback(messageUuid) {
      return [this.startMessagesBy.bot, this.startMessagesBy.agent].includes(
        messageUuid,
      );
    },

    isMessageByBot(message) {
      return !message.user && !message.contact;
    },

    isFeedbackMessage(message) {
      try {
        const textJson = JSON.parse(message.text);

        const isNewFeedback = !!textJson.method && !!textJson.content;
        const isOldFeedback = ['queue', 'user'].includes(textJson.type);

        return isNewFeedback || isOldFeedback;
      } catch (error) {
        return false;
      }
    },

    openFullScreen(url) {
      this.currentMedia = this.medias.find((el) => el.url === url);
      this.isFullscreen = true;
    },
    nextMedia() {
      const imageIndex = this.medias.findIndex(
        (el) => el.url === this.currentMedia.url,
      );
      if (imageIndex + 1 < this.medias.length) {
        this.currentMedia = this.medias[imageIndex + 1];
      }
    },
    previousMedia() {
      const imageIndex = this.medias.findIndex(
        (el) => el.url === this.currentMedia.url,
      );
      if (imageIndex - 1 >= 0) {
        this.currentMedia = this.medias[imageIndex - 1];
      }
    },

    handleScroll() {
      const { chatMessages } = this.$refs;
      if (!chatMessages) return;

      // if (this.isEdgeRoomMessage(this.messagesSorted[0].minutes)) {
      //   this.$router.replace({
      //     name: 'closed-rooms.selected',
      //     params: { roomId: this.chatUuid },
      //   });
      // }

      if (chatMessages.scrollTop === 0) {
        this.$emit('scrollTop');
      }
    },

    async manageScrollForNewMessages() {
      const { chatMessages } = this.$refs;
      if (!chatMessages) return;

      const { lastMessageUuidBeforePagination, prevChatUuid, messagesSorted } =
        this;

      if (prevChatUuid !== this.chatUuid) {
        this.handleScroll();
        setTimeout(() => {
          this.scrollToBottom();
        }, 200);
      }

      if (
        lastMessageUuidBeforePagination &&
        chatMessages.scrollTop === 0 &&
        (this.messagesNext || this.messagesPrevious)
      ) {
        const elementToScroll =
          this.$refs[`message-${lastMessageUuidBeforePagination}`]?.[0]?.$el;
        if (elementToScroll) {
          await elementToScroll.scrollIntoView({ block: 'start' });
          chatMessages.scrollTop += 1;
        }
      } else {
        this.scrollToBottom();
      }

      this.prevChatUuid = this.chatUuid;
      this.lastMessageUuidBeforePagination =
        messagesSorted?.[0]?.minutes?.[0]?.messages?.[0]?.uuid;
    },

    scrollToBottom() {
      const { chatMessages } = this.$refs;
      if (!chatMessages) return;

      chatMessages.scrollTop = chatMessages.scrollHeight;
    },
  },
};
</script>

<style lang="scss" scoped>
.chat-messages__container {
  overflow: hidden;

  height: 100%;
}

.chat-messages {
  overflow: hidden auto;

  padding-right: $unnnic-spacing-sm;

  height: 100%;

  &__container-date {
    &:last-of-type {
      margin-bottom: $unnnic-spacing-md;
    }
  }

  &__container-minute {
    display: grid;
  }

  &__message {
    margin-top: $unnnic-spacing-md;

    &.sent {
      justify-self: flex-end;

      & + & {
        margin-top: $unnnic-spacing-nano;
      }
    }

    &.received {
      & + & {
        margin-top: $unnnic-spacing-nano;
      }

      &.different-user {
        margin-top: $unnnic-spacing-md !important;
      }
    }

    .image {
      cursor: pointer;
    }

    .audio {
      padding: $unnnic-spacing-xs;
      margin: $unnnic-spacing-nano 0;
    }

    &__divisor {
      display: flex;
      align-items: center;
      gap: $unnnic-spacing-stack-xl;
      margin-bottom: $unnnic-inline-md;

      &__label {
        font-size: $unnnic-font-size-body-md;
        line-height: 1.25rem;
        color: $unnnic-color-neutral-cloudy;
      }

      &__line {
        flex: 1;
        height: 1px;
        background: $unnnic-color-neutral-soft;
      }
    }
  }

  &__tags {
    margin: $unnnic-spacing-inline-md 0;

    display: grid;
    gap: $unnnic-spacing-md;

    :deep(.unnnic-brand-tag__icon) {
      display: none;
    }

    :deep(.tag-group__tags) {
      justify-content: center;
    }
  }
}
</style>
