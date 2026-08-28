<template>
  <section
    class="assistant-input"
    data-testid="assistant-input"
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
    />

    <hr class="assistant-input__divider" />

    <section class="assistant-input__actions">
      <UnnnicButton
        type="tertiary"
        size="small"
        iconCenter="attach_file_add"
        disabled
        data-testid="assistant-input-attach"
      />
      <UnnnicButton
        type="secondary"
        size="small"
        iconCenter="graphic_eq"
        disabled
        data-testid="assistant-input-mic"
      />
    </section>
  </section>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue';

defineOptions({
  name: 'AssistantInput',
});

const emit = defineEmits<{
  send: [text: string];
}>();

const draft = ref('');
const textareaRef = ref<HTMLTextAreaElement | null>(null);

function autoGrow() {
  const el = textareaRef.value;
  if (!el) return;

  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
}

async function handleSend() {
  const text = draft.value.trim();
  if (!text) return;

  emit('send', text);
  draft.value = '';
  await nextTick();
  autoGrow();
}

onMounted(() => {
  autoGrow();
});
</script>

<style lang="scss" scoped>
.assistant-input {
  display: flex;
  flex-direction: column;
  gap: $unnnic-space-2;
  width: 100%;
  padding: $unnnic-space-3 $unnnic-space-4;
  border: 1px solid $unnnic-color-border-base;
  border-radius: $unnnic-radius-2;
  background-color: $unnnic-color-bg-base;
  flex-shrink: 0;

  &__textarea {
    width: 100%;
    min-height: $unnnic-space-5;
    max-height: $unnnic-space-16;
    resize: none;
    border: none;
    outline: none;
    background: transparent;
    font: $unnnic-font-body;
    color: $unnnic-color-fg-base;

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
}
</style>
