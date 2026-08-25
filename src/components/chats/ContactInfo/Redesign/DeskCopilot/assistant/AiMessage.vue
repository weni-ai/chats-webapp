<template>
  <section
    class="ai-message"
    data-testid="assistant-ai-message"
  >
    <UnnnicIcon
      class="ai-message__icon"
      icon="bi:stars"
      size="sm"
      scheme="fg-emphasized"
    />

    <section class="ai-message__body">
      <p
        v-if="leadingText"
        class="ai-message__leading"
        data-testid="assistant-ai-leading"
      >
        {{ leadingText }}
      </p>

      <section
        v-if="suggestionText"
        class="ai-message__suggestion"
        data-testid="assistant-ai-suggestion"
      >
        <p class="ai-message__suggestion-text">{{ suggestionText }}</p>
      </section>

      <section
        v-if="suggestionText"
        class="ai-message__actions"
        data-testid="assistant-ai-actions"
      >
        <section class="ai-message__actions-left">
          <UnnnicButton
            type="tertiary"
            size="small"
            data-testid="assistant-ai-copy"
            @click="handleCopy"
          >
            {{ $t('contact_info.desk_copilot.assistant.copy_action') }}
          </UnnnicButton>
          <UnnnicButton
            type="secondary"
            size="small"
            data-testid="assistant-ai-send"
            @click="emit('send', suggestionText)"
          >
            {{ $t('contact_info.desk_copilot.assistant.send_action') }}
          </UnnnicButton>
        </section>

        <section class="ai-message__actions-right">
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
              data-testid="assistant-ai-thumb-up"
              @click="feedbackLiked = true"
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
              data-testid="assistant-ai-thumb-down"
              @click="feedbackLiked = false"
            />
          </UnnnicToolTip>
        </section>
      </section>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { UnnnicCallAlert } from '@weni/unnnic-system';
import i18n from '@/plugins/i18n';

defineOptions({
  name: 'AssistantAiMessage',
});

const props = defineProps<{
  text: string;
  suggestion?: string;
}>();

const emit = defineEmits<{
  send: [text: string];
}>();

const feedbackLiked = ref<boolean | null>(null);

const leadingText = computed(() => {
  if (props.suggestion?.trim()) {
    return props.text.trim();
  }

  return '';
});

const suggestionText = computed(() => {
  if (props.suggestion?.trim()) {
    return props.suggestion.trim();
  }

  return props.text.trim();
});

async function handleCopy() {
  if (!suggestionText.value || !navigator.clipboard) {
    return;
  }

  try {
    await navigator.clipboard.writeText(suggestionText.value);
    UnnnicCallAlert({
      props: {
        text: i18n.global.t('contact_info.value_copied'),
        type: 'success',
      },
    });
  } catch (error) {
    console.error('Failed to copy suggestion:', error);
    UnnnicCallAlert({
      props: {
        text: i18n.global.t('contact_info.error_copying_value'),
        type: 'error',
      },
    });
  }
}
</script>

<style lang="scss" scoped>
.ai-message {
  display: flex;
  align-items: flex-start;
  gap: $unnnic-space-2;
  width: 100%;
  max-width: 75%;
  min-width: 0;
  animation: assistant-bubble-in-left 0.3s ease-out both;
  transform-origin: top left;

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

  &__leading {
    font: $unnnic-font-emphasis;
    color: $unnnic-color-fg-emphasized;
    overflow-wrap: anywhere;
  }

  &__suggestion {
    width: 100%;
    padding: $unnnic-space-3 $unnnic-space-4;
    border: 1px solid $unnnic-color-border-base;
    border-radius: $unnnic-radius-2;
  }

  &__suggestion-text {
    font: $unnnic-font-body;
    color: $unnnic-color-fg-base;
    overflow-wrap: anywhere;
  }

  &__actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: $unnnic-space-2;
    width: 100%;
  }

  &__actions-left,
  &__actions-right {
    display: flex;
    align-items: center;
    gap: $unnnic-space-2;
    min-width: 0;
  }
}

@keyframes assistant-bubble-in-left {
  0% {
    opacity: 0;
    transform: translateX(-2px) scale(0.8);
  }

  60% {
    transform: translateX(2px) scale(1.02);
  }

  100% {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}
</style>
