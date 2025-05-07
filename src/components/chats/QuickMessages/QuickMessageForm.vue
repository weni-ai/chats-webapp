<template>
  <section class="quick-message-form">
    <h1
      v-if="title"
      class="quick-message-form__title"
    >
      {{ title }}
    </h1>
    <UnnnicInput
      v-model="quickMessage.title"
      size="md"
      :label="$t('title')"
      :placeholder="$t('quick_messages.title_field_placeholder')"
      data-testid="title-input"
      @update:model-value="quickMessage = { ...quickMessage, title: $event }"
    />

    <UnnnicInput
      v-model="quickMessage.shortcut"
      size="md"
      :placeholder="$t('quick_messages.shortcut_field_placeholder')"
      :label="$t('shortcut')"
      data-testid="shortcut-input"
      @update:model-value="quickMessage = { ...quickMessage, shortcut: $event }"
    />

    <UnnnicTextArea
      v-model="quickMessage.text"
      :label="$t('message')"
      :placeholder="$t('quick_messages.message_field_placeholder')"
      :maxLength="1000"
      size="md"
      data-testid="message-input"
      @update:model-value="quickMessage = { ...quickMessage, text: $event }"
    />

    <div
      v-if="!externalActions"
      class="actions"
    >
      <UnnnicButton
        class="button"
        :text="$t('cancel')"
        type="tertiary"
        size="small"
        data-testid="cancel-button"
        @click="$emit('cancel')"
      />
      <UnnnicButton
        class="button"
        :text="$t('save')"
        type="primary"
        size="small"
        :disabled="isSaveButtonDisabled"
        data-testid="save-button"
        @click="submit"
      />
    </div>
  </section>
</template>

<script>
export default {
  name: 'QuickMessageForm',

  props: {
    modelValue: {
      type: Object,
      default: null,
    },
    size: {
      type: String,
      default: 'sm',
    },
    externalActions: {
      type: Boolean,
      default: false,
    },
    title: {
      type: String,
      default: '',
    },
  },
  emits: ['cancel', 'update:model-value', 'submit'],

  computed: {
    isSaveButtonDisabled() {
      return (
        !this.hasMessageTitle ||
        !this.hasMessageShortcut ||
        !this.hasMessageText
      );
    },
    hasMessageText() {
      return this.quickMessage.text?.trim?.();
    },
    hasMessageShortcut() {
      return this.quickMessage.shortcut?.trim?.();
    },
    hasMessageTitle() {
      return this.quickMessage.title?.trim?.();
    },
    quickMessage: {
      get() {
        return this.modelValue || {};
      },
      set(quickMessage) {
        this.$emit('update:model-value', quickMessage);
      },
    },
  },

  methods: {
    cancel() {
      this.$emit('cancel');
    },
    submit() {
      this.$emit('submit', this.quickMessage);
    },
  },
};
</script>

<style lang="scss" scoped>
.quick-message-form {
  display: flex;
  flex-direction: column;
  gap: $unnnic-spacing-xs;

  &__title {
    font-size: $unnnic-font-size-body-lg;
    line-height: $unnnic-font-size-body-lg + $unnnic-line-height-medium;
    color: $unnnic-color-neutral-dark;
  }

  .label {
    display: flex;
    align-items: center;
    gap: $unnnic-spacing-stack-nano;
  }

  .actions {
    display: flex;
    align-items: center;
    margin-top: auto;
    gap: $unnnic-spacing-stack-sm;

    .button {
      flex: 1 1;
    }
  }

  :deep([class*='label']) {
    margin-top: 0;
    margin-bottom: $unnnic-spacing-nano;
  }
}
</style>
