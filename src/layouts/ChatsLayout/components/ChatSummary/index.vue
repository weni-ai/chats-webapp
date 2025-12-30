<template>
  <section
    class="chat-summary"
    :class="{ 'chat-summary--open': !activeRoom.ended_at }"
    data-testid="chat-summary"
  >
    <section
      class="chat-summary__header"
      data-testid="chat-summary-header"
    >
      <section
        class="chat-summary__by-ai-label"
        data-testid="chat-summary-by-ai-label"
      >
        <UnnnicIcon
          icon="bi:stars"
          size="sm"
        />
        <p>{{ $t('chats.summary.by_ai') }}</p>
      </section>
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
          data-testid="chat-summary-generating-dot"
          class="generating__dot"
        />
      </section>
      <p
        v-else
        :class="{
          'chat-summary__text': true,
          'is-typing': isTyping && !hideClose,
        }"
        data-testid="chat-summary-text"
      >
        {{ animatedText }}
      </p>
    </section>
    <section
      v-if="
        me?.email === activeRoom?.user?.email &&
        activeRoomSummary.status === 'DONE'
      "
      class="chat-summary__footer"
      data-testid="chat-summary-footer"
    >
      <UnnnicToolTip
        enabled
        :text="$t('chats.summary.feedback.positive')"
        side="left"
      >
        <UnnnicIcon
          icon="thumb_up"
          :filled="feedback.liked === true"
          size="ant"
          clickable
          scheme="neutral-dark"
          @click="handleThumbUp"
        />
      </UnnnicToolTip>
      <UnnnicToolTip
        enabled
        :text="$t('chats.summary.feedback.negative')"
        side="left"
      >
        <UnnnicIcon
          icon="thumb_down"
          :filled="feedback.liked === false"
          size="ant"
          clickable
          scheme="neutral-dark"
          @click="handleThumbDown"
        />
      </UnnnicToolTip>
    </section>
  </section>
  <FeedbackModal
    v-if="showFeedbackModal"
    :hasFeedback="hasFeedback"
    :roomUuid="activeRoom.uuid"
    @close="handleCloseFeedbackModal"
  />
</template>

<script>
import { mapState, mapWritableState } from 'pinia';
import StarsIcon from './stars.svg';
import { useRooms } from '@/store/modules/chats/rooms';
import FeedbackModal from './FeedbackModal.vue';
import Room from '@/services/api/resources/chats/room';
import { useProfile } from '@/store/modules/profile';

export default {
  name: 'ChatSummary',
  components: {
    FeedbackModal,
  },
  props: {
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
    skipAnimation: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['close', 'feedback'],
  data() {
    return {
      StarsIcon,
      animatedText: '',
      isTyping: false,
      showFeedbackModal: false,
      liked: null,
      hasFeedback: false,
    };
  },
  computed: {
    ...mapWritableState(useRooms, ['activeRoomSummary', 'activeRoom']),
    ...mapState(useProfile, ['me']),
  },
  watch: {
    summaryText: {
      immediate: true,
      async handler(value) {
        if (value && !this.skipAnimation) {
          await this.typeWriter(this.summaryText, 10);
        } else if (value) {
          this.animatedText = this.summaryText;
        }
      },
    },
  },
  unmounted() {
    this.animatedText = '';
  },
  methods: {
    handleCloseFeedbackModal({ closeSummary } = {}) {
      this.showFeedbackModal = false;
      this.hasFeedback = false;
      if (closeSummary) this.$emit('close');
    },
    handleThumbUp() {
      this.activeRoomSummary.feedback.liked = true;
      Room.sendSummaryFeedback({ roomUuid: this.activeRoom.uuid, liked: true });
    },
    handleThumbDown() {
      this.activeRoomSummary.feedback.liked = false;
      this.hasFeedback = true;
      this.showFeedbackModal = true;
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
    handleCloseSummary() {
      if (
        this.feedback.liked === null &&
        this.activeRoomSummary.status === 'DONE'
      ) {
        this.showFeedbackModal = true;
      } else this.$emit('close');
    },
  },
};
</script>

<style lang="scss" scoped>
.chat-summary {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: $unnnic-color-purple-100;
  box-shadow: $unnnic-shadow-level-far;
  padding: $unnnic-spacing-sm;
  gap: $unnnic-spacing-nano;

  &--open {
    margin-left: -$unnnic-spacing-sm;
  }

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
