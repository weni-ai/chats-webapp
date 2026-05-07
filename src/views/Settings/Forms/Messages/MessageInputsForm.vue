<template>
  <section class="sector-messages-form">
    <UnnnicInput
      :modelValue="displayShortcut"
      size="md"
      :placeholder="$t('quick_messages.shortcut_field_placeholder')"
      :label="$t('shortcut')"
      data-testid="quick-message-shortcut-input"
      @update:model-value="handleShortcutInput"
      @focus="shortcutFocused = true"
      @blur="shortcutFocused = false"
    />
    <UnnnicTextArea
      :modelValue="modelValue.text"
      :label="$t('message')"
      :placeholder="$t('quick_messages.message_field_placeholder')"
      :maxLength="1000"
      size="md"
      data-testid="quick-message-text-input"
      @update:model-value="handleTextInput($event)"
    />
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

defineOptions({
  name: 'MessageInputsForm',
});

const props = defineProps<{
  modelValue: {
    shortcut: string;
    text: string;
  };
}>();

const emit = defineEmits<{
  'update:model-value': [value: { shortcut: string; text: string }];
}>();

const shortcutFocused = ref(false);

const displayShortcut = computed(() => {
  if (!props.modelValue.shortcut && !shortcutFocused.value) return '';
  if (!props.modelValue.shortcut && shortcutFocused.value) return '/';

  const shortcut = props.modelValue.shortcut || '';
  return shortcut.startsWith('/') ? shortcut : '/' + shortcut;
});

const handleShortcutInput = (val: string) => {
  const cleanValue = val.replace(/^\/+/, '');
  emit('update:model-value', {
    ...props.modelValue,
    shortcut: cleanValue,
  });
};

const handleTextInput = (val: string) => {
  emit('update:model-value', {
    ...props.modelValue,
    text: val,
  });
};
</script>

<style lang="scss" scoped>
.sector-messages-form {
  display: flex;
  flex-direction: column;
  gap: $unnnic-space-4;
}
</style>
