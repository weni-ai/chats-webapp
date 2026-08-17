<template>
  <section
    class="desk-copilot-summary"
    data-testid="desk-copilot-summary"
  >
    <UnnnicIcon
      class="desk-copilot-summary__icon"
      icon="bi:stars"
      size="sm"
      scheme="fg-emphasized"
    />

    <section class="desk-copilot-summary__body">
      <h3 class="desk-copilot-summary__title">
        {{ $t('contact_info.desk_copilot.summary_title') }}
      </h3>

      <section
        class="desk-copilot-summary__bubble"
        data-testid="desk-copilot-summary-bubble"
      >
        <section
          v-if="isLoadingActiveRoomSummary"
          class="desk-copilot-summary__generate-text"
          data-testid="desk-copilot-summary-loading"
        >
          <span>{{ $t('chats.summary.reading_and_summarizing') }}</span>
          <span
            v-for="dot of 3"
            :key="dot"
            data-testid="desk-copilot-summary-generating-dot"
            class="desk-copilot-summary__dot"
          />
        </section>
        <p
          v-else
          class="desk-copilot-summary__text"
          :class="{ 'is-typing': isTyping }"
          data-testid="desk-copilot-summary-text"
        >
          {{ animatedText }}
        </p>
      </section>

      <section
        v-if="showActions"
        class="desk-copilot-summary__actions"
        data-testid="desk-copilot-summary-actions"
      >
        <CopyValueButton
          :value="summaryText"
          copyTooltipKey="contact_info.desk_copilot.copy_summary"
        />
        <template v-if="canSendFeedback">
          <UnnnicToolTip
            enabled
            :text="$t('chats.summary.feedback.positive')"
            side="left"
          >
            <UnnnicIcon
              icon="thumb_up"
              :filled="feedbackLiked === true"
              size="ant"
              clickable
              scheme="fg-base"
              data-testid="desk-copilot-summary-thumb-up"
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
              :filled="feedbackLiked === false"
              size="ant"
              clickable
              scheme="fg-base"
              data-testid="desk-copilot-summary-thumb-down"
              @click="handleThumbDown"
            />
          </UnnnicToolTip>
        </template>
      </section>
    </section>

    <FeedbackModal
      v-if="showFeedbackModal && activeRoom?.uuid"
      :hasFeedback="hasFeedback"
      :roomUuid="activeRoom.uuid"
      @close="handleCloseFeedbackModal"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useRooms } from '@/store/modules/chats/rooms';
import { useProfile } from '@/store/modules/profile';
import CopyValueButton from '@/components/chats/ContactInfo/CopyValueButton.vue';
import FeedbackModal from '@/layouts/ChatsLayout/components/ChatSummary/FeedbackModal.vue';
import Room from '@/services/api/resources/chats/room';

defineOptions({
  name: 'DeskCopilotSummaryMessage',
});

const roomsStore = useRooms();
const { activeRoom, isLoadingActiveRoomSummary, roomsSummary } =
  storeToRefs(roomsStore);
const { me } = storeToRefs(useProfile());

const emptySummary = {
  feedback: { liked: null as boolean | null },
  summary: '',
  status: '',
};

const activeRoomSummary = computed(() => {
  const roomUuid = activeRoom.value?.uuid;
  if (!roomUuid) return emptySummary;

  return roomsSummary.value[roomUuid] || emptySummary;
});

const animatedText = ref('');
const isTyping = ref(false);
const showFeedbackModal = ref(false);
const hasFeedback = ref(false);
const skipAnimation = ref(!!activeRoomSummary.value.summary);

let animationAbortController: AbortController | null = null;
let currentAnimationId = 0;

const summaryText = computed(() => activeRoomSummary.value.summary || '');

const feedbackLiked = computed(
  () => activeRoomSummary.value.feedback?.liked ?? null,
);

const canSendFeedback = computed(
  () =>
    me.value?.email === activeRoom.value?.user?.email &&
    activeRoomSummary.value.status === 'DONE',
);

const showActions = computed(
  () => !isLoadingActiveRoomSummary.value && !!summaryText.value,
);

async function typeWriter(text: string, speed: number) {
  if (animationAbortController) {
    animationAbortController.abort();
  }

  animationAbortController = new AbortController();
  const animationId = ++currentAnimationId;

  isTyping.value = true;
  animatedText.value = '';

  try {
    for (const char of text) {
      if (animationAbortController.signal.aborted) {
        return;
      }

      if (currentAnimationId !== animationId) {
        return;
      }

      await new Promise<void>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          animatedText.value += char;
          resolve();
        }, speed);

        animationAbortController?.signal.addEventListener(
          'abort',
          () => {
            clearTimeout(timeoutId);
            reject(new Error('Animation cancelled'));
          },
          { once: true },
        );
      });
    }
  } catch (error) {
    if ((error as Error).message !== 'Animation cancelled') {
      console.error(error);
    }
  } finally {
    isTyping.value = false;
  }
}

watch(
  summaryText,
  async (newValue, oldValue) => {
    if (isTyping.value && newValue === oldValue) {
      return;
    }

    if (newValue && !skipAnimation.value) {
      await typeWriter(newValue, 10);
      skipAnimation.value = true;
      return;
    }

    animatedText.value = newValue || '';
  },
  { immediate: true },
);

function handleThumbUp() {
  const roomUuid = activeRoom.value?.uuid;
  if (!roomUuid) return;

  if (!activeRoomSummary.value.feedback) {
    activeRoomSummary.value.feedback = { liked: true };
  } else {
    activeRoomSummary.value.feedback.liked = true;
  }
  Room.sendSummaryFeedback({
    roomUuid,
    liked: true,
    text: '',
    tags: [],
  });
}

function handleThumbDown() {
  if (!activeRoomSummary.value.feedback) {
    activeRoomSummary.value.feedback = { liked: false };
  } else {
    activeRoomSummary.value.feedback.liked = false;
  }
  hasFeedback.value = true;
  showFeedbackModal.value = true;
}

function handleCloseFeedbackModal() {
  showFeedbackModal.value = false;
  hasFeedback.value = false;
}

onUnmounted(() => {
  if (animationAbortController) {
    animationAbortController.abort();
  }
  animatedText.value = '';
});
</script>

<style lang="scss" scoped>
.desk-copilot-summary {
  display: flex;
  align-items: flex-start;
  gap: $unnnic-space-2;
  width: 100%;

  &__icon {
    flex-shrink: 0;
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-2;
    flex: 1;
    min-width: 0;
  }

  &__title {
    font: $unnnic-font-emphasis;
    color: $unnnic-color-fg-emphasized;
  }

  &__bubble {
    display: flex;
    align-items: center;
    width: 100%;
    padding: $unnnic-space-3 $unnnic-space-4;
    border: 1px solid $unnnic-color-border-base;
    border-radius: $unnnic-radius-2;
  }

  &__text {
    font: $unnnic-font-body;
    color: $unnnic-color-fg-base;
    overflow-wrap: anywhere;

    &.is-typing {
      padding-right: $unnnic-space-6;
    }
  }

  &__generate-text {
    color: $unnnic-color-fg-base;
    font: $unnnic-font-body;

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

    .desk-copilot-summary__dot {
      display: inline-block;
      width: 2px;
      height: 2px;
      border-radius: 50%;
      margin-right: 2px;
      background-color: $unnnic-color-fg-base;
      animation: wave 1.5s linear infinite;

      &:nth-child(2) {
        animation-delay: 0.9s;
      }

      &:nth-child(3) {
        animation-delay: 1.2s;
      }
    }
  }

  &__actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: $unnnic-space-2;
    width: 100%;
  }
}
</style>
