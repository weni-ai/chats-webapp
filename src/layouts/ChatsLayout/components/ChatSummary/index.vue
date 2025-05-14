<template>
  <section class="chat-summary">
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
      <UnnnicIcon
        v-if="!isGeneratingSummary && !isTyping && !hideClose"
        icon="close"
        size="ant"
        clickable
        scheme="neutral-dark"
        @click="$emit('close')"
      />
    </section>
    <section class="chat-summary__by-ai-label__bottom">
      <img :src="StarsIcon" />
      <p>{{ $t('chats.summary.by_ai') }}</p>
    </section>
  </section>
</template>

<script>
import StarsIcon from './stars.svg';
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
  },
  emits: ['close'],
  data() {
    return {
      StarsIcon,
      animatedText: '',
      isTyping: false,
    };
  },
  watch: {
    summaryText() {
      this.typeWriter(this.summaryText, 10);
    },
  },
  methods: {
    async typeWriter(text, speed) {
      this.isTyping = true;
      this.animatedText = '';

      for (let i = 0; i < text.length; i++) {
        this.animatedText += text.charAt(i);
        await new Promise((resolve) => setTimeout(resolve, speed));
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

  &__by-ai-label {
    &__bottom {
      display: flex;
      align-self: end;
      gap: $unnnic-spacing-nano;

      color: $unnnic-color-neutral-dark;
      font-family: $unnnic-font-family-secondary;
      font-size: $unnnic-font-size-body-md;
      line-height: $unnnic-font-size-body-md + $unnnic-line-height-md;
      font-weight: $unnnic-font-weight-black;
    }
  }
}
</style>
