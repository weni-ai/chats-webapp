<template>
  <section class="sector-messages-form">
    <UnnnicInput
      v-model="quickMessage.title"
      size="md"
      :label="$t('title')"
      :placeholder="$t('quick_messages.title_field_placeholder')"
      data-testid="quick-message-title-input"
    />
    <UnnnicInput
      v-model="quickMessage.shortcut"
      size="md"
      :placeholder="$t('quick_messages.shortcut_field_placeholder')"
      :label="$t('shortcut')"
      data-testid="quick-message-shortcut-input"
    />
    <UnnnicTextArea
      v-model="quickMessage.text"
      :label="$t('message')"
      :placeholder="$t('quick_messages.message_field_placeholder')"
      :maxLength="1000"
      size="md"
      data-testid="quick-message-text-input"
    />
  </section>
</template>

<script>
export default {
  name: 'MessagesForm',
  props: {
    modelValue: {
      type: Object,
      required: true,
    },
  },
  emits: ['update:model-value'],
  computed: {
    quickMessage: {
      get() {
        return this.modelValue;
      },
      set(value) {
        this.$emit('update:model-value', value);
      },
    },
  },
};
</script>

<style lang="scss" scoped>
.sector-messages-form {
  display: grid;
  gap: $unnnic-spacing-sm;

  :deep(.unnnic-form__label) {
    margin-top: 0;
  }
}
</style>
