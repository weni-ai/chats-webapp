<template>
  <section class="chat-summary">
    <section class="chat-summary__header">
      <section class="chat-summary__by-ai-label">
        <img :src="StarsIcon" />
        <p>{{ $t('chats.summary.by_ai') }}</p>
      </section>
      <UnnnicIcon
        v-if="!isGeneratingSummary && !isTyping && !hideClose"
        icon="close"
        size="ant"
        clickable
        scheme="neutral-dark"
        @click="$emit('close')"
      />
    </section>
    <section class="chat-summary__content">
      <section
        v-if="isGeneratingSummary"
        class="chat-summary__generate-text"
      >
        <span>{{ $t('chats.summary.reading_and_summarizing') }}</span>
        <span
          v-for="dot of 3"
          :key="dot"
          class="generating__dot"
        />
      </section>
      <p
        v-else
        :class="{
          'chat-summary__text': true,
          'is-typing': isTyping && !hideClose,
        }"
      >
        {{ animatedText }}
      </p>
    </section>
    <section class="chat-summary__footer">
      <UnnnicIcon
        icon="thumb_up"
        :filled="feedback.liked === true"
        size="ant"
        clickable
        scheme="neutral-dark"
        @click="handleThumbUp"
      />
      <UnnnicIcon
        icon="thumb_down"
        :filled="feedback.liked === false"
        size="ant"
        clickable
        scheme="neutral-dark"
        @click="handleThumbDown"
      />
    </section>
  </section>
</template>

<script>
import { mapWritableState } from 'pinia';
import StarsIcon from './stars.svg';
import { useRooms } from '@/store/modules/chats/rooms';

export default {
  name: 'ChatSummary',
  props: {
    room: {
      type: Object,
      required: true,
    },
    isGeneratingSummary: {
      type: Boolean,
      default: false,
    },
    summaryText: {
      type: String,
      default: '',
    },
    hideClose: {
      type: Boolean,
      default: false,
    },
    feedback: {
      type: Object,
      default: () => ({
        liked: null,
      }),
    },
  },
  emits: ['close', 'feedback'],
  data() {
    return {
      StarsIcon,
      animatedText: '',
      isTyping: false,
    };
  },
  computed: {
    ...mapWritableState(useRooms, ['activeRoomSummary']),
  },
  watch: {
    summaryText: {
      immediate: true,
      async handler(value) {
        if (value) await this.typeWriter(this.summaryText, 10);
      },
    },
  },
  unmounted() {
    this.activeRoomSummary = '';
    this.animatedText = '';
  },
  methods: {
    handleThumbUp() {
      this.$emit('feedback', { liked: true });
      console.log('thumb up');
    },
    handleThumbDown() {
      this.$emit('feedback', { liked: false });
      console.log('thumb down');
    },
    async typeWriter(text, speed) {
      this.isTyping = true;
      this.animatedText = '';

      for await (const char of text) {
        await new Promise((resolve) => {
          setTimeout(() => {
            this.animatedText += char;
            resolve();
          }, speed);
        });
      }

      this.isTyping = false;
    },
  },
};
</script>

<style lang="scss" scoped>
.chat-summary {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: rgb(233, 216, 253);
  box-shadow: $unnnic-shadow-level-far;
  padding: $unnnic-spacing-sm;
  gap: $unnnic-spacing-nano;

  &__generate-text {
    color: $unnnic-color-neutral-clean;

    @keyframes wave {
      0%,
      60%,
      100% {
        transform: initial;
      }

      30% {
        transform: translateY(-3px);
      }
    }

    .generating__dot {
      display: inline-block;
      width: 2px;
      height: 2px;
      border-radius: 50%;
      margin-right: 2px;
      background-color: $unnnic-color-neutral-clean;
      animation: wave 1.5s linear infinite;

      &:nth-child(2) {
        animation-delay: 0.9s;
      }

      &:nth-child(3) {
        animation-delay: 1.2s;
      }
    }
  }

  &__text.is-typing {
    padding-right: 2 * $unnnic-spacing-md;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__content {
    display: flex;
    gap: $unnnic-spacing-md;
    justify-content: space-between;
    text-align: justify;
    color: $unnnic-color-neutral-dark;
    font-family: $unnnic-font-family-secondary;
    font-size: $unnnic-font-size-body-gt;
    line-height: $unnnic-font-size-body-gt + $unnnic-line-height-md;
  }

  &__footer {
    display: flex;
    justify-content: end;
    align-items: center;
    gap: $unnnic-spacing-sm;
  }

  &__by-ai-label {
    display: flex;
    gap: $unnnic-spacing-nano;

    color: $unnnic-color-neutral-dark;
    font-family: $unnnic-font-family-secondary;
    font-size: $unnnic-font-size-body-md;
    line-height: $unnnic-font-size-body-md + $unnnic-line-height-md;
    font-weight: $unnnic-font-weight-black;
  }
}
</style>
