<template>
  <VoiceModeError
    v-if="voiceError"
    :error="voiceError"
    @retry="emit('voiceRetry')"
    @dismiss="emit('voiceDismiss')"
  />

  <VoiceModePanel
    v-else-if="isVoiceModePageActive"
    :state="voiceModeState"
    @exit="emit('voiceExit')"
  />

  <section
    v-else-if="isRecording"
    class="assistant-input-recording"
    data-testid="assistant-input-recording"
  >
    <AudioRecordingBar
      :durationMs="recordingDurationMs"
      @cancel="emit('cancelRecording')"
    />
    <UnnnicButton
      type="primary"
      size="small"
      iconCenter="send"
      data-testid="assistant-audio-recording-send"
      :aria-label="$t('contact_info.desk_copilot.assistant.send_audio')"
      @click="emit('stopRecording')"
    />
  </section>

  <section
    v-else
    class="assistant-input"
    data-testid="assistant-input"
    @click="focusTextarea"
  >
    <textarea
      ref="textareaRef"
      v-model="draft"
      class="assistant-input__textarea"
      rows="1"
      :placeholder="$t('contact_info.desk_copilot.assistant.input_placeholder')"
      data-testid="assistant-input-textarea"
      @keydown.enter.exact.prevent="handleSend"
      @input="autoGrow"
      @click.stop
    />

    <hr class="assistant-input__divider" />

    <section
      class="assistant-input__actions"
      @click.stop
    >
      <UnnnicPopover
        :open="isMediaMenuOpen"
        data-testid="assistant-input-media-popover"
        @update:open="isMediaMenuOpen = $event"
      >
        <UnnnicPopoverTrigger>
          <UnnnicButton
            type="tertiary"
            size="small"
            iconCenter="attach_file_add"
            data-testid="assistant-input-attach"
            :aria-label="
              $t('contact_info.desk_copilot.assistant.open_media_menu')
            "
            @click.stop="toggleMediaMenu"
          />
        </UnnnicPopoverTrigger>

        <UnnnicPopoverContent
          side="top"
          align="start"
          size="small"
          data-testid="assistant-input-media-menu"
        >
          <UnnnicPopoverOption
            :label="$t('contact_info.desk_copilot.assistant.upload_file')"
            icon="attach_file"
            data-testid="assistant-input-upload-option"
            @click="handleUploadOption"
          />
          <UnnnicPopoverOption
            v-if="isAudioRecordingSupported"
            :label="$t('contact_info.desk_copilot.assistant.record_audio')"
            icon="mic"
            data-testid="assistant-input-audio-option"
            @click="handleAudioOption"
          />
        </UnnnicPopoverContent>
      </UnnnicPopover>

      <input
        ref="fileInputRef"
        class="assistant-input__file-input"
        type="file"
        :accept="fileAccept"
        data-testid="assistant-input-file"
        @change="handleFileChange"
      />

      <VoiceModeButton
        v-if="canEnterVoiceMode && !hasDraft"
        @click="emit('voiceEnter')"
      />
      <UnnnicButton
        v-else
        type="primary"
        size="small"
        iconCenter="arrow_upward"
        data-testid="assistant-input-send"
        :disabled="!hasDraft"
        :aria-label="$t('contact_info.desk_copilot.assistant.send_action')"
        @click.stop="handleSend"
      />
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';
import { UnnnicCallAlert } from '@weni/unnnic-system';
import i18n from '@/plugins/i18n';
import type { FileConfig } from '@weni/webchat-service';
import AudioRecordingBar from './AudioRecordingBar.vue';
import VoiceModeButton from './VoiceModeButton.vue';
import VoiceModePanel from './VoiceModePanel.vue';
import VoiceModeError from './VoiceModeError.vue';

defineOptions({
  name: 'AssistantInput',
});

const props = withDefaults(
  defineProps<{
    isRecording?: boolean;
    recordingDurationMs?: number;
    isAudioRecordingSupported?: boolean;
    canEnterVoiceMode?: boolean;
    isVoiceModePageActive?: boolean;
    voiceModeState?: string | null;
    voiceError?: {
      code?: string;
      message?: string;
      suggestion?: string;
      recoverable?: boolean;
    } | null;
    fileConfig?: FileConfig;
  }>(),
  {
    isRecording: false,
    recordingDurationMs: 0,
    isAudioRecordingSupported: false,
    canEnterVoiceMode: false,
    isVoiceModePageActive: false,
    voiceModeState: null,
    voiceError: null,
    fileConfig: () => ({
      allowedTypes: [],
      maxFileSize: 32 * 1024 * 1024,
      acceptAttribute: '',
    }),
  },
);

const emit = defineEmits<{
  send: [text: string];
  attach: [file: File];
  startRecording: [];
  stopRecording: [];
  cancelRecording: [];
  voiceEnter: [];
  voiceExit: [];
  voiceRetry: [];
  voiceDismiss: [];
}>();

const draft = ref('');
const isMediaMenuOpen = ref(false);
const textareaRef = ref<HTMLTextAreaElement | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);

const fileAccept = computed(
  () => props.fileConfig?.acceptAttribute || undefined,
);
const hasDraft = computed(() => !!draft.value.trim());

function autoGrow() {
  const el = textareaRef.value;
  if (!el) return;

  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
}

function focusTextarea() {
  textareaRef.value?.focus();
}

function toggleMediaMenu() {
  isMediaMenuOpen.value = !isMediaMenuOpen.value;
}

async function handleSend() {
  const text = draft.value.trim();
  if (!text) return;

  emit('send', text);
  draft.value = '';
  await nextTick();
  autoGrow();
}

function handleUploadOption() {
  isMediaMenuOpen.value = false;
  fileInputRef.value?.click();
}

function handleAudioOption() {
  isMediaMenuOpen.value = false;
  emit('startRecording');
}

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';

  if (!file) {
    return;
  }

  const maxSize = props.fileConfig?.maxFileSize || 32 * 1024 * 1024;
  const allowedTypes = props.fileConfig?.allowedTypes || [];

  if (file.size > maxSize) {
    UnnnicCallAlert({
      props: {
        text: i18n.global.t(
          'contact_info.desk_copilot.assistant.file_too_large',
        ),
        type: 'error',
      },
    });
    return;
  }

  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    UnnnicCallAlert({
      props: {
        text: i18n.global.t(
          'contact_info.desk_copilot.assistant.file_type_not_allowed',
        ),
        type: 'error',
      },
    });
    return;
  }

  emit('attach', file);
}

onMounted(() => {
  autoGrow();
});
</script>

<style lang="scss" scoped>
.assistant-input {
  display: flex;
  flex-direction: column;
  gap: $unnnic-space-3;
  width: 100%;
  padding: $unnnic-space-3 $unnnic-space-4;
  border: 1px solid $unnnic-color-border-base;
  border-radius: $unnnic-radius-2;
  background-color: $unnnic-color-bg-base;
  flex-shrink: 0;
  cursor: text;

  &__textarea {
    width: 100%;
    min-height: calc(0.875 * 16px * 1.4);
    max-height: $unnnic-space-16;
    resize: none;
    border: none;
    outline: none;
    background: transparent;
    font: $unnnic-font-body;
    color: $unnnic-color-fg-base;
    cursor: text;

    &::placeholder {
      color: $unnnic-color-fg-muted;
    }
  }

  &__divider {
    width: 100%;
    margin: 0;
    border: none;
    border-top: 1px solid $unnnic-color-border-base;
  }

  &__actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
  }

  &__file-input {
    display: none;
  }
}

.assistant-input-recording {
  display: flex;
  align-items: center;
  gap: $unnnic-space-2;
  width: 100%;
  flex-shrink: 0;
}
</style>
