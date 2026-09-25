<template>
  <section
    class="desk-copilot-summary"
    data-testid="desk-copilot-summary"
  >
    <UnnnicIcon
      class="desk-copilot-summary__icon"
      icon="bi:stars"
      size="sm"
      scheme="fg-accent"
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
        <template v-if="canSendFeedback && !readOnly">
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

    <AiFeedbackModal
      v-model="showFeedbackModal"
      :tags="feedbackTags"
      :isLoadingTags="isLoadingTags"
      :isSubmitting="isSubmittingFeedback"
      @submit="handleSubmitFeedback"
      @cancel="handleCancelFeedback"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useRooms } from '@/store/modules/chats/rooms';
import { useProfile } from '@/store/modules/profile';
import { UnnnicCallAlert } from '@weni/unnnic-system';
import CopyValueButton from '@/components/chats/ContactInfo/CopyValueButton.vue';
import AiFeedbackModal, {
  type AiFeedbackTag,
} from '@/components/chats/ContactInfo/Redesign/DeskCopilot/AiFeedbackModal.vue';
import i18n from '@/plugins/i18n';
import Room from '@/services/api/resources/chats/room';

defineOptions({
  name: 'DeskCopilotSummaryMessage',
});

const props = withDefaults(
  defineProps<{
    readOnly?: boolean;
  }>(),
  {
    readOnly: false,
  },
);

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
const previousLiked = ref<boolean | null>(null);
const feedbackTags = ref<AiFeedbackTag[]>([]);
const isLoadingTags = ref(false);
const isSubmittingFeedback = ref(false);
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

function setFeedbackLiked(liked: boolean | null) {
  if (!activeRoomSummary.value.feedback) {
    activeRoomSummary.value.feedback = { liked };
  } else {
    activeRoomSummary.value.feedback.liked = liked;
  }
}

function handleThumbUp() {
  const roomUuid = activeRoom.value?.uuid;
  if (!roomUuid) return;

  setFeedbackLiked(true);
  Room.sendSummaryFeedback({
    roomUuid,
    liked: true,
    text: '',
    tags: [],
  });
}

async function handleThumbDown() {
  if (!activeRoom.value?.uuid) return;

  previousLiked.value = feedbackLiked.value;
  setFeedbackLiked(false);
  showFeedbackModal.value = true;
  isLoadingTags.value = true;

  try {
    const { results } = await Room.getSummaryFeedbackTags();
    feedbackTags.value = Object.entries(results || {}).map(([key, value]) => ({
      key,
      name: String(value),
    }));
  } catch (error) {
    console.error(error);
    feedbackTags.value = [];
  } finally {
    isLoadingTags.value = false;
  }
}

function handleCancelFeedback() {
  setFeedbackLiked(previousLiked.value);
  showFeedbackModal.value = false;
}

async function handleSubmitFeedback({
  tags,
  text,
}: {
  tags: string[];
  text: string;
}) {
  const roomUuid = activeRoom.value?.uuid;
  if (!roomUuid) return;

  isSubmittingFeedback.value = true;
  try {
    await Room.sendSummaryFeedback({
      roomUuid,
      liked: false,
      text,
      tags,
    });
    UnnnicCallAlert({
      props: {
        text: i18n.global.t('chats.summary.feedback.sended'),
        type: 'success',
      },
      seconds: 5,
    });
    showFeedbackModal.value = false;
  } catch (error) {
    console.error(error);
    UnnnicCallAlert({
      props: {
        text: i18n.global.t('contact_info.desk_copilot.feedback.error'),
        type: 'error',
      },
      seconds: 5,
    });
  } finally {
    isSubmittingFeedback.value = false;
  }
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
