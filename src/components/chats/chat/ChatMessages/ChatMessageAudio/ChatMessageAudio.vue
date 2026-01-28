<template>
  <div>
    <UnnnicAudioRecorder
      ref="audio-recorder"
      class="audio-player"
      :src="messageMedia.url || messageMedia.preview"
      :canDiscard="false"
      :bars="[]"
      :reqStatus="messageStatus"
      :showTranscriptionAction="canShowTranscriptionAudioAction"
      :enableGenerateTranscription="canGenerateTranscriptionAudio"
      :showTranscriptionText="showTranscriptionText"
      :isLoadingTranscription="isLoadingTranscription"
      :transcriptionText="transcriptionText"
      :fluidBar="canShowTranscriptionAudioAction"
      :locale="i18n.global.locale"
      @update:show-transcription-text="showTranscriptionText = $event"
      @failed-click="emit('failed-click')"
    >
      <template #transcriptionInfo>
        <section
          v-if="
            canShowTranscriptionAudioAction &&
            (!canGenerateTranscriptionAudio || hasTranscriptionError)
          "
          class="audio-player__transcription-info"
        >
          <template v-if="!canGenerateTranscriptionAudio">
            <UnnnicIcon
              icon="material-symbols:info-outline"
              scheme="blue-500"
              size="sm"
            />
            <p
              v-if="isClosedChat"
              class="audio-player__transcription-info__text"
            >
              {{ $t('chats.transcription.unavailable_closed_chat') }}
            </p>
            <p
              v-else
              class="audio-player__transcription-info__text"
            >
              {{
                $t('chats.transcription.unavailable_exceeding_duration', {
                  duration: MAX_AUDIO_DURATION_SECONDS / 60,
                })
              }}
            </p>
          </template>
          <template v-if="hasTranscriptionError && !isLoadingTranscription">
            <UnnnicIcon
              icon="material-symbols:cancel-outline"
              scheme="red-500"
              size="sm"
            />
            <p class="audio-player__transcription-info__text">
              {{ $t('chats.transcription.error') }}
            </p>
          </template>
        </section>
        <section
          v-if="
            !isLoadingTranscription &&
            !hasTranscriptionError &&
            !isClosedChat &&
            showTranscriptionText &&
            transcriptionText
          "
          class="audio-player__transcription-feedback"
        >
          <p class="audio-player__transcription-feedback__text">
            {{ $t('chats.transcription.feedback.question') }}
          </p>
          <UnnnicToolTip
            enabled
            :text="$t('chats.transcription.feedback.positive')"
            side="top"
          >
            <UnnnicIcon
              icon="thumb_up"
              :filled="transcriptionFeedback === true"
              size="ant"
              clickable
              scheme="neutral-dark"
              data-testid="feedback-like"
              @click="handleLike(true)"
            />
          </UnnnicToolTip>
          <UnnnicToolTip
            enabled
            :text="$t('chats.transcription.feedback.negative')"
            side="top"
          >
            <UnnnicIcon
              icon="thumb_down"
              :filled="transcriptionFeedback === false"
              size="ant"
              clickable
              scheme="neutral-dark"
              data-testid="feedback-dislike"
              @click="handleLike(false)"
            />
          </UnnnicToolTip>
        </section>
      </template>
    </UnnnicAudioRecorder>
    <TranscriptionFeedbackModal
      v-if="showFeedbackModal"
      :messageUuid="message.uuid"
      @close="handleCloseFeedbackModal"
    />
  </div>
</template>

<script setup>
import { ref, useTemplateRef, computed, watch } from 'vue';

import { UnnnicCallAlert } from '@weni/unnnic-system';

import { useRoomMessages } from '@/store/modules/chats/roomMessages';

import TranscriptionFeedbackModal from './FeedbackModal.vue';

import audioTranscriptionService from '@/services/api/resources/chats/audioTranscription';
import updateMedia from '@/services/api/websocket/listeners/media/transcribe/update';

import i18n from '@/plugins/i18n';

const MAX_AUDIO_DURATION_SECONDS = 180; // 3 minutes

const props = defineProps({
  message: {
    type: Object,
    required: true,
  },
  messageStatus: {
    type: String,
    required: true,
  },
  isClosedChat: {
    type: Boolean,
    default: false,
  },
});
const emit = defineEmits(['failed-click']);

const audioRecorderRef = useTemplateRef('audio-recorder');

const messageMedia = computed(() => {
  return props.message.media[0];
});

const isLoadingTranscription = ref(false);
const showTranscriptionText = ref(false);

const generateTranscription = async () => {
  isLoadingTranscription.value = true;

  try {
    if (transcriptionText.value) {
      isLoadingTranscription.value = false;
      return;
    }
    await audioTranscriptionService.generateAudioTranscription(
      props.message.uuid,
    );
  } catch (error) {
    console.error('Error generating transcription', error);
    isLoadingTranscription.value = false;
    showTranscriptionText.value = false;
    const roomMessagesStore = useRoomMessages();

    roomMessagesStore.updateMessage({
      reorderMessageMinute: true,
      message: {
        ...props.message,
        media: [
          {
            ...props.message.media[0],
            transcription: { status: 'FAILED', text: '' },
          },
        ],
      },
    });
  }
};

watch(showTranscriptionText, () => {
  if (showTranscriptionText.value) {
    // TODO: replace to generateTranscription after testing
    generateTranscription();
  } else {
    isLoadingTranscription.value = false;
  }
});

const canShowTranscriptionAudioAction = computed(() => {
  const isContactMessage = !!props.message.contact;
  return isContactMessage;
});

const canGenerateTranscriptionAudio = computed(() => {
  if (props.isClosedChat) {
    return transcriptionText.value.length > 0;
  }
  if (audioRecorderRef.value) {
    return audioRecorderRef.value.duration < MAX_AUDIO_DURATION_SECONDS;
  }
  return false;
});

const hasTranscriptionError = computed(() => {
  return (
    messageMedia.value.transcription &&
    messageMedia.value.transcription.status === 'FAILED'
  );
});

const transcriptionText = computed(() => {
  return messageMedia.value.transcription?.text || '';
});

watch(transcriptionText, () => {
  if (transcriptionText.value) {
    isLoadingTranscription.value = false;
  }
});

const transcriptionFeedback = computed({
  get() {
    const liked = messageMedia.value.transcription?.feedback?.liked;
    if (liked === null || liked === undefined) return null;

    return messageMedia.value.transcription?.feedback?.liked;
  },
  set(value) {
    messageMedia.value.transcription.feedback = { liked: value };
  },
});

const showFeedbackModal = ref(false);

const handleLike = async (liked) => {
  transcriptionFeedback.value = liked;

  try {
    if (liked) {
      // TODO: enable
      // await audioTranscriptionService.sendAudioTranscriptionFeedback(
      //   props.message.uuid,
      //   { liked },
      // );
      UnnnicCallAlert({
        props: {
          text: i18n.global.t('chats.transcription.feedback.sended'),
          type: 'success',
        },
        seconds: 5,
      });
    } else {
      showFeedbackModal.value = true;
    }
  } catch (error) {
    console.error('Error sending transcription feedback', error);
    transcriptionFeedback.value = null;
    UnnnicCallAlert({
      props: {
        text: i18n.global.t('chats.transcription.feedback.error'),
        type: 'error',
      },
      seconds: 5,
    });
  }
};

const handleCloseFeedbackModal = ({ reset } = {}) => {
  if (reset) {
    transcriptionFeedback.value = null;
  }
  showFeedbackModal.value = false;
};
</script>

<style lang="scss" scoped>
:deep(.unnnic-tooltip-trigger) {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}
.audio-player {
  padding: $unnnic-spacing-xs;
  margin: $unnnic-spacing-nano 0;
  &__transcription {
    &-feedback {
      display: flex;
      align-items: center;
      gap: $unnnic-space-3;
      padding: $unnnic-space-1 0;
      &__text {
        font: $unnnic-font-caption-2;
        color: $unnnic-color-fg-emphasized;
      }
    }
    &-info {
      display: flex;
      align-items: center;
      gap: $unnnic-space-2;
      padding: $unnnic-space-1 $unnnic-space-2;
      &__text {
        font: $unnnic-font-caption-2;
        color: $unnnic-color-fg-emphasized;
      }
    }
  }
}
</style>
