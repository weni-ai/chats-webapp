<!-- eslint-disable vuejs-accessibility/alt-text -->
<!-- eslint-disable vuejs-accessibility/media-has-caption -->
<template>
  <section
    class="chat-messages"
    ref="chatMessages"
    @scroll="
      (event) => {
        handleScroll(event.srcElement);
      }
    "
  >
    <section
      class="chat-messages__messages"
      v-for="groupMessage in groupMessagesByDate"
      :key="groupMessage.date"
    >
      <chat-feedback :feedback="groupMessage.date" scheme="purple" />

      <section
        v-for="message in groupMessage.messages"
        :key="message.uuid"
        class="chat-messages__room"
      >
        <!-- Feedbacks -->

        <chat-feedback
          v-if="isTransferInfoMessage(message)"
          :feedback="
            !room.is_waiting ? createTransferLabel(message) : $t('waiting_answer.send_template')
          "
        />

        <div class="chat-message__container" v-else>
          <unnnic-chats-message
            v-if="message.text"
            :type="message.user ? 'sent' : 'received'"
            :class="['chat-message', message.user ? 'sent' : 'received']"
            :time="new Date(message.created_on)"
            :status="messageStatus({ message })"
          >
            {{ message.text }}
          </unnnic-chats-message>
          <template v-for="media in message.media">
            <unnnic-chats-message
              v-if="isMedia(media)"
              :key="media.created_on"
              :type="message.user ? 'sent' : 'received'"
              :class="['chat-message', message.user ? 'sent' : 'received']"
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
              :class="['chat-message', message.user ? 'sent' : 'received']"
              :time="new Date(message.created_on)"
              :documentName="media.url?.split('/').at(-1) || media.file.name"
              :status="messageStatus({ message })"
              @click="documentClickHandler({ message, media })"
            />
          </template>
        </div>
      </section>
    </section>

    <div style="position: sticky; bottom: 0px; background-color: white">
      <!-- Contact in queue -->
      <section v-if="!room.is_active" class="chat-messages__room__divisor">
        <div class="chat-messages__room__divisor__line" />
        <span class="chat-messages__room__divisor__label">{{ $t('chat_closed_by.agent') }}</span>
        <div class="chat-messages__room__divisor__line" />
      </section>

      <!-- Waiting contact answer -->
      <section>
        <div v-if="room.is_waiting" class="chat-messages__room__transfer-info">
          {{ $t('waiting_answer.waiting_cliente_answer') }}
        </div>
      </section>

      <!-- Closed chat tags  -->
      <section v-if="room.tags.length > 0" class="chat-messages__tags">
        <p class="chat-messages__tags__label">{{ $t('chats.tags') }}</p>
        <tag-group :tags="room.tags" />
      </section>
    </div>

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
    messages: {
      type: Array,
      default: () => [],
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
    }),
    groupMessagesByDate() {
      const groupedMessages = {};

      const today = new Date().toISOString().split('T')[0];

      this.messages.forEach((message) => {
        const createdOn = message.created_on.split('T')[0];
        const arrayOfDate = createdOn.split('-');
        const year = arrayOfDate[0];
        const month = arrayOfDate[1];
        const day = arrayOfDate[2];

        const displayDate =
          createdOn === today
            ? this.$t('today')
            : this.$t('date_format_variable', { year, month, day });

        if (!groupedMessages[createdOn]) {
          groupedMessages[createdOn] = {
            date: displayDate,
            messages: [],
          };
        }

        groupedMessages[createdOn].messages.push(message);
      });

      return Object.values(groupedMessages);
    },
    rooms() {
      const { rooms, messages } = this.chat;
      return rooms?.length > 0 ? rooms : [{ messages }];
    },
    isHistory() {
      return !this.room.is_active;
    },
    medias() {
      return this.messages
        .map((el) => el.media)
        .flat()
        .filter((el) => {
          const media = /(png|jp(e)?g|webp|mp4)/;
          return media.test(el.content_type);
        });
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

    scrollMessagesToBottom() {
      const { chatMessages } = this.$refs;
      if (!chatMessages) return;
      chatMessages.scrollTop = chatMessages.scrollHeight;
    },
    handleScroll(target) {
      if (target.scrollTop === 0) {
        this.$emit('scrollTop');
      }
    },
  },

  watch: {
    messages() {
      this.$nextTick(() => {
        this.scrollMessagesToBottom();
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.chat-messages {
  &__room {
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

    .chat-message__container {
      display: grid;

      .chat-message {
        &.sent {
          justify-self: flex-end;
        }

        .image {
          cursor: pointer;
        }

        .audio {
          padding: $unnnic-spacing-xs;
          margin: $unnnic-spacing-nano 0;
        }
      }
    }
  }

  &__messages {
    display: grid;
    gap: $unnnic-spacing-md;
    margin-top: $unnnic-spacing-sm;

    & + & {
      margin-top: $unnnic-spacing-md;
    }
  }

  &__tags {
    margin-bottom: $unnnic-spacing-inline-md;
    &__label {
      font-size: $unnnic-font-size-body-gt;
      color: $unnnic-color-neutral-dark;
      margin-bottom: $unnnic-spacing-inline-sm;
    }
  }
  .unread-message {
    font-weight: 700;
    font-size: 12px;
    color: #9caccc;
    margin: 10px;
  }
}
</style>
