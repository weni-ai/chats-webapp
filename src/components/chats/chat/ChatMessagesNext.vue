<!-- eslint-disable vuejs-accessibility/alt-text -->
<!-- eslint-disable vuejs-accessibility/media-has-caption -->
<template>
  <section class="chat-messages" ref="chatMessages" @scroll="handleScroll">
    <section
      v-for="messagesByDate in roomMessagesSorted"
      :key="messagesByDate.date"
      class="chat-messages__container-date"
    >
      <div class="chat-messages__messages__start-feedbacks">
        <chat-feedback
          :feedback="messagesByDate.date"
          class="chat-messages__messages__start-feedbacks__date"
          scheme="purple"
          divisor
        />
        <chat-feedback
          v-if="room?.is_waiting"
          :feedback="$t('waiting_answer.waiting_cliente_answer')"
        />
        <chat-feedback
          v-if="isFirstMessageByBot(messagesByDate.minutes)"
          :feedback="$t('chat_with.bot')"
        />
      </div>

      <section
        v-for="messagesByMinute in messagesByDate.minutes"
        class="chat-messages__container-minute"
        :key="messagesByDate.date + messagesByMinute.minute"
      >
        <template v-for="message in messagesByMinute.messages">
          <chat-feedback
            v-if="isTransferInfoMessage(message)"
            :feedback="
              !room?.is_waiting ? createTransferLabel(message) : $t('waiting_answer.send_template')
            "
            :key="message.uuid"
          />

          <template v-else>
            <unnnic-chats-message
              v-if="message.text"
              :type="message.user || isMessageByBot(message) ? 'sent' : 'received'"
              :class="[
                'chat-messages__message',
                message.user || isMessageByBot(message) ? 'sent' : 'received',
              ]"
              :time="new Date(message.created_on)"
              :status="messageStatus({ message })"
              :key="message.uuid"
            >
              {{ message.text }}
            </unnnic-chats-message>
            <template v-for="media in message.media">
              <unnnic-chats-message
                v-if="isMedia(media)"
                :key="media.created_on"
                :type="message.user ? 'sent' : 'received'"
                :class="['chat-messages__message', message.user ? 'sent' : 'received']"
                :mediaType="isImage(media) ? 'image' : isVideo(media) ? 'video' : 'audio'"
                :time="new Date(message.created_on)"
                :status="messageStatus({ message })"
                @click="resendMedia({ message, media })"
              >
                <img
                  v-if="isImage(media)"
                  class="media image"
                  :src="media.url || media.preview"
                  @click="openFullScreen(media.url)"
                  @keypress.enter="openFullScreen(media.url)"
                />
                <video-player
                  v-else-if="isVideo(media)"
                  class="media"
                  :src="media.url || media.preview"
                />
                <unnnic-audio-recorder
                  v-else-if="isAudio(media)"
                  ref="audio-recorder"
                  class="media audio"
                  :src="media.url || media.preview"
                  :canDiscard="false"
                  :reqStatus="messageStatus({ message, media })"
                  @failed-click="resendMedia({ message, media })"
                />
              </unnnic-chats-message>
              <unnnic-chats-message
                v-else
                :key="media.created_on"
                :type="message.user ? 'sent' : 'received'"
                :class="['chat-messages__message', message.user ? 'sent' : 'received']"
                :time="new Date(message.created_on)"
                :documentName="media.url?.split('/').at(-1) || media.file.name"
                :status="messageStatus({ message })"
                @click="documentClickHandler({ message, media })"
              />
            </template>
          </template>
        </template>
      </section>
    </section>

    <!-- Closed chat tags  -->
    <section v-if="room.tags.length > 0" class="chat-messages__tags">
      <chat-feedback :feedback="roomEndedChatFeedback" scheme="purple" />
      <tag-group :tags="room.tags" />
    </section>

    <!-- Media fullscreen -->
    <fullscreen-preview
      v-if="isFullscreen"
      :downloadMediaUrl="currentMedia.url"
      :downloadMediaName="currentMedia.message"
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
    </fullscreen-preview>
  </section>
</template>

<script>
import { mapActions, mapState } from 'vuex';
import moment from 'moment';

import TagGroup from '@/components/TagGroup';
import Media from '@/services/api/resources/chats/media';
import ChatFeedback from './ChatFeedback';
import FullscreenPreview from '../MediaMessage/Previews/Fullscreen.vue';
import VideoPlayer from '../MediaMessage/Previews/Video.vue';

export default {
  name: 'ChatMessages',

  components: {
    ChatFeedback,
    TagGroup,
    FullscreenPreview,
    VideoPlayer,
  },

  props: {
    room: {
      type: Object,
      required: true,
    },
    usePhoto: {
      type: Boolean,
      default: false,
    },
  },

  data: () => ({
    messageToResend: null,
    isFullscreen: false,
    currentMedia: {},
    prevUuidBeforePagination: null,
    prevRoomUuid: null,
  }),

  mounted() {
    window.addEventListener('online', () => {
      this.resendMessages();
    });
  },

  computed: {
    ...mapState({
      roomMessagesSendingUuids: (state) => state.roomMessages.roomMessagesSendingUuids,
      roomMessagesFailedUuids: (state) => state.roomMessages.roomMessagesFailedUuids,
      roomMessages: (state) => state.roomMessages.roomMessages,
      roomMessagesSorted: (state) => state.roomMessages.roomMessagesSorted,
    }),
    rooms() {
      const { rooms, messages } = this.chat;
      return rooms?.length > 0 ? rooms : [{ messages }];
    },
    isHistory() {
      return !this.room.is_active;
    },
    medias() {
      return this.roomMessages
        .map((el) => el.media)
        .flat()
        .filter((el) => {
          const media = /(png|jp(e)?g|webp|mp4)/;
          return media.test(el.content_type);
        });
    },
    roomEndedChatFeedback() {
      return `${this.$t('chats.closed')} ${moment(this.room.ended_at).format('LT')}h ${moment(
        this.room.ended_at,
      ).format('L')}`;
    },
  },

  methods: {
    ...mapActions({
      resendMessages: 'roomMessages/resendMessages',
      resendMessage: 'roomMessages/resendMessage',
      resendMedia: 'roomMessages/resendMedia',
    }),
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
    isMedia(media) {
      const { isAudio, isImage, isVideo } = this;
      return isAudio(media) || isImage(media) || isVideo(media);
    },
    messageStatus({ message, media }) {
      if (message) {
        if (this.roomMessagesSendingUuids.includes(message.uuid)) {
          return 'sending';
        }
        if (this.roomMessagesFailedUuids.includes(message.uuid)) {
          return 'failed';
        }
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
            const filename = media.url?.split('/').at(-1) || media.file.name;

            Media.download({ media: mediaToDownload, name: filename });
          } catch (error) {
            console.error('An error occurred when trying to download the media:', error);
          }
        }
      }
    },

    isFirstMessageByBot(messagesByDateMinutes) {
      return messagesByDateMinutes.some((minute) =>
        minute.messages.some(
          (message) => !message.contact && !message.user && !this.isTransferInfoMessage(message),
        ),
      );
    },

    isMessageByBot(message) {
      return !message.user && !message.contact;
    },

    isTransferInfoMessage(message) {
      try {
        const content = JSON.parse(message.text);

        return ['queue', 'user'].includes(content.type);
      } catch (error) {
        return false;
      }
    },
    createTransferLabel(message) {
      const text = JSON.parse(message.text);
      const { name } = text;
      const transferType = {
        queue: this.$t('contact_forwarded_to_queue', { queue: name }),
        user: this.$t('contact_transferred_to_agent', { agent: name }),
      };

      return transferType[text.type];
    },

    showContactInfo() {
      this.$emit('show-contact-info');
    },

    openFullScreen(url) {
      this.currentMedia = this.medias.find((el) => el.url === url);
      this.isFullscreen = true;
    },
    nextMedia() {
      const imageIndex = this.medias.findIndex((el) => el.url === this.currentMedia.url);
      if (imageIndex + 1 < this.medias.length) {
        this.currentMedia = this.medias[imageIndex + 1];
      }
    },
    previousMedia() {
      const imageIndex = this.medias.findIndex((el) => el.url === this.currentMedia.url);
      if (imageIndex - 1 >= 0) {
        this.currentMedia = this.medias[imageIndex - 1];
      }
    },

    handleScroll() {
      const { chatMessages } = this.$refs;
      if (!chatMessages) return;

      if (chatMessages.scrollTop === 0) {
        this.$emit('scrollTop');
      }
    },

    async manageScrollForNewMessages() {
      const { chatMessages } = this.$refs;
      if (!chatMessages) return;

      const { prevUuidBeforePagination, prevRoomUuid, messages } = this;

      if (prevRoomUuid !== this.room.uuid) {
        this.handleScroll();
        this.scrollToBottom();
      }

      if (prevUuidBeforePagination && chatMessages.scrollTop === 0) {
        const elementToScroll = this.$refs[`message-${prevUuidBeforePagination}`]?.[0];
        if (elementToScroll) {
          await elementToScroll.scrollIntoView({ block: 'start' });
          chatMessages.scrollTop += 1;
        }
      } else {
        this.scrollToBottom();
      }

      this.prevRoomUuid = this.room.uuid;
      this.prevUuidBeforePagination = messages?.[0]?.uuid;
    },

    scrollToBottom() {
      const { chatMessages } = this.$refs;
      if (!chatMessages) return;

      chatMessages.scrollTop = chatMessages.scrollHeight;
    },
  },

  watch: {
    roomMessages() {
      this.$nextTick(() => {
        this.manageScrollForNewMessages();
      });
    },
  },
};
</script>

<style lang="scss" scoped>
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

  &__messages {
    display: grid;
    gap: $unnnic-spacing-md;
    margin-top: $unnnic-spacing-sm;

    overflow: hidden auto;
    padding-right: $unnnic-spacing-inset-sm;

    & + & {
      margin-top: $unnnic-spacing-md;
    }
  }

  &__tags {
    margin-bottom: $unnnic-spacing-inline-md;

    display: grid;
    gap: $unnnic-spacing-md;

    :deep(.tag-group__tags) {
      justify-content: center;
    }
  }
}
</style>
