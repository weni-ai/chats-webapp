<template>
  <!-- TODO: Verify fluidBar -->
  <UnnnicAudioRecorder
    ref="audio-recorder"
    class="audio-player"
    :src="messageMedia.url || messageMedia.preview"
    :canDiscard="false"
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
          <p class="audio-player__transcription-info__text">
            {{
              $t('chats.transcription.unavailable', {
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
          transcriptionText &&
          showTranscriptionText
        "
      >
        TODO: Rating transcription
      </section>
    </template>
  </UnnnicAudioRecorder>
</template>

<script setup>
import { ref, useTemplateRef, computed, watch } from 'vue';

import { useRoomMessages } from '@/store/modules/chats/roomMessages';

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
  // TODO: Remove! only for testing
  const success = !!Math.floor(Math.random() * 2); // 0 or 1
  setTimeout(async () => {
    try {
      if (success) {
        updateMedia({
          message_uuid: props.message.uuid,
          status: 'DONE',
          text: 'Lorem ipsum purus in mollis nunc sed id semper. Suspendisse faucibus interdum posuere lorem ipsum. Dictum non consectetur a erat. Risus nullam eget felis eget nunc lobortis mattis aliquam faucibus. Sed adipiscing diam donec adipiscing tristique risus nec feugiat. Faucibus et molestie ac feugiat sed lectus vestibulum mattis. In nibh mauris cursus mattis molestie a iaculis at erat. Velit aliquet sagittis id consectetur purus ut faucibus. Lorem dolor sed viverra ipsum. Facilisis gravida neque convallis a cras. Adipiscing vitae proin sagittis nisl rhoncus. Odio eu feugiat pretium nibh ipsum. Sit amet nulla facilisi morbi. Viverra mauris in aliquam sem. Vitae justo eget magna fermentum. Ultrices dui sapien eget mi proin sed libero. Convallis a cras semper auctor neque vitae tempus quam. Netus et malesuada fames ac turpis egestas. Morbi enim nunc faucibus a pellentesque sit amet porttitor. Suspendisse potenti nullam ac tortor vitae. Blandit volutpat maecenas volutpat blandit.',
        });
      } else
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
  }, 3000);
};

watch(showTranscriptionText, () => {
  if (showTranscriptionText.value) {
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
