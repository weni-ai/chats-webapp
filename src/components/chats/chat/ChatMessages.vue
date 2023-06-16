<!-- eslint-disable vuejs-accessibility/media-has-caption -->
<template>
  <section
    class="chat-messages"
    @scroll="
      (event) => {
        handleScroll(event.srcElement);
      }
    "
  >
    <section v-for="message in messages" :key="message.uuid" class="chat-messages__room">
      <!-- missing info in API return data -->
      <div v-if="false" class="chat-messages__room__divisor">
        <div class="chat-messages__room__divisor__line" />
        <span class="chat-messages__room__divisor__label">
          {{
            message.sender.name === 'Bot'
              ? $t('chat_with.bot')
              : $t('chat_with.agent', { name: message.sender.name })
          }}
        </span>
        <div class="chat-messages__room__divisor__line" />
      </div>
      <!-- <div style="display: flex; align-items: center; text-align: center">
        <div class="chat-messages__room__divisor__line" style="background: #d0d3d9" />
        <span class="unread-message">Mensagens não lidas</span>
        <div class="chat-messages__room__divisor__line" style="background: #d0d3d9" />
      </div> -->
      <div v-if="isTransferInfoMessage(message)" class="chat-messages__room__transfer-info">
        <unnnic-icon
          v-if="!room.is_waiting"
          icon="logout-1-1"
          size="sm"
          scheme="neutral-cleanest"
        />
        {{ !room.is_waiting ? createTransferLabel(message) : $t('waiting_answer.send_template') }}
        <unnnic-icon
          v-if="room.is_waiting"
          icon="send-email-3-1"
          size="sm"
          scheme="neutral-cleanest"
        />
      </div>

      <section v-else-if="!message.sender" class="chat-messages__messages">
        <chat-message
          :message="{ ...message, sender: { name: 'Bot' } }"
          :disabled="isHistory"
          :use-photo="usePhoto"
          @fullscreen="openFullScreen"
        />
      </section>

      <section v-else class="chat-messages__messages">
        <chat-message
          :message="message"
          :disabled="isHistory"
          @show-contact-info="showContactInfo"
          :use-photo="usePhoto"
          @fullscreen="openFullScreen"
        />
      </section>
    </section>
    <div style="position: sticky; bottom: 0px; background-color: white">
      <section v-if="!room.is_active" class="chat-messages__room__divisor">
        <div class="chat-messages__room__divisor__line" />
        <span class="chat-messages__room__divisor__label">{{ $t('chat_closed_by.agent') }}</span>
        <div class="chat-messages__room__divisor__line" />
      </section>
      <section>
        <div v-if="room.is_waiting" class="chat-messages__room__transfer-info">
          {{ $t('waiting_answer.waiting_cliente_answer') }}
        </div>
      </section>

      <section v-if="room.tags.length > 0" class="chat-messages__tags">
        <p class="chat-messages__tags__label">{{ $t('chats.tags') }}</p>
        <tag-group :tags="room.tags" />
      </section>
    </div>

    <unnnic-modal
      :showModal="!!messageToResend"
      modalIcon="alert-circle-1"
      text="Mensagem não enviada"
      description="Sua mensagem não foi enviada. Deseja reenviar?"
      @close="messageToResend = null"
    >
      <template #options>
        <unnnic-button type="terciary" @click="messageToResend = null" text="Cancelar envio" />
        <unnnic-button
          type="secondary"
          @click="(messageToResend.sent = true), (messageToResend = null)"
          text="Reenviar"
        />
      </template>
    </unnnic-modal>
    <fullscreen-preview
      v-if="isFullscreen"
      :downloadMediaUrl="currentMedia.url"
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
import TagGroup from '@/components/TagGroup';
import ChatMessage from './ChatMessage';
import FullscreenPreview from '../MediaMessage/Previews/Fullscreen.vue';

export default {
  name: 'ChatMessages',

  components: {
    ChatMessage,
    TagGroup,
    FullscreenPreview,
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

  computed: {
    rooms() {
      const { rooms, messages } = this.chat;
      return rooms?.length > 0 ? rooms : [{ messages }];
    },
    isHistory() {
      return !this.room.is_active;
    },
    medias() {
      return this.messages
        .map((el) => el.content)
        .flat()
        .filter((el) => el)
        .map((el) => el.media)
        .flat()
        .filter((el) => {
          const media = /(png|jp(e)?g|webp|mp4)/;
          return media.test(el.content_type);
        });
    },
  },

  methods: {
    isTransferInfoMessage(message) {
      try {
        const content = JSON.parse(message.text);

        return ['queue', 'user'].includes(content.type);
      } catch (error) {
        return false;
      }
    },

    handleScroll(target) {
      if (target.scrollTop === 0) {
        this.$emit('scrollTop');
      }
    },
    createTransferLabel(message) {
      const text = JSON.parse(message.text);
      const { name } = text;
      const transferType = {
        queue: this.$t('contact_transferred_to.line', { name }),
        user: this.$t('contact_transferred_to.agent', { name }),
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
  },
};
</script>

<style lang="scss" scoped>
.chat-messages {
  &__room {
    & + & {
      margin-top: $unnnic-spacing-inline-md;
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

    &__transfer-info {
      text-align: center;
      font-size: $unnnic-font-size-body-md;
      line-height: 1.25rem;
      color: $unnnic-color-neutral-cleanest;
    }
  }

  &__messages {
    margin-bottom: $unnnic-spacing-inline-md;
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
