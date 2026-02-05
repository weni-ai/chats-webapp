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
      @update:model-value="
        $emit('update:model-value', { ...modelValue, text: $event })
      "
    />
  </section>
</template>

<script>
import { cloneDeep, isEqual } from 'lodash';
export default {
  name: 'MessagesForm',
  props: {
    modelValue: {
      type: Object,
      required: true,
    },
  },
  emits: ['update:model-value', 'changeIsValid'],
  data() {
    return {
      shortcutFocused: false,
      initialState: null,
    };
  },
  computed: {
    isInitialFormState() {
      const { initialState } = this;

      if (!initialState) return true;

      return isEqual(cloneDeep(this.modelValue), initialState);
    },
    validForm() {
      const valid = !!(this.modelValue.shortcut && this.modelValue.text);
      return valid && !this.isInitialFormState;
    },
    displayShortcut() {
      if (!this.modelValue.shortcut && !this.shortcutFocused) return '';
      if (!this.modelValue.shortcut && this.shortcutFocused) return '/';

      const shortcut = this.modelValue.shortcut || '';
      return shortcut.startsWith('/') ? shortcut : '/' + shortcut;
    },
  },
  watch: {
    validForm: {
      immediate: true,
      handler() {
        this.$emit('changeIsValid', this.validForm);
      },
    },
  },
  mounted() {
    this.initialState = cloneDeep(this.modelValue);
  },
  methods: {
    handleShortcutInput(val) {
      const cleanValue = val.replace(/^\/+/, '');
      this.$emit('update:model-value', {
        ...this.modelValue,
        shortcut: cleanValue,
      });
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
