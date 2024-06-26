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
      @update:model-value="quickMessage = { ...quickMessage, title: $event }"
      size="md"
      :label="$t('title')"
      :placeholder="$t('quick_messages.title_field_placeholder')"
    />

    <UnnnicInput
      v-model="quickMessage.shortcut"
      @update:model-value="quickMessage = { ...quickMessage, shortcut: $event }"
      size="md"
      :placeholder="$t('quick_messages.shortcut_field_placeholder')"
      :label="$t('shortcut')"
    />

    <UnnnicTextArea
      v-model="quickMessage.text"
      @update:model-value="quickMessage = { ...quickMessage, text: $event }"
      :label="$t('message')"
      :placeholder="$t('quick_messages.message_field_placeholder')"
      :maxLength="1000"
      size="md"
    />

    <div
      class="actions"
      v-if="!externalActions"
    >
      <UnnnicButton
        class="button"
        :text="$t('cancel')"
        type="tertiary"
        size="small"
        @click="$emit('cancel')"
      />
      <UnnnicButton
        class="button"
        :text="$t('save')"
        type="primary"
        size="small"
        @click="submit"
        :disabled="isSaveButtonDisabled"
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
      require: false,
    },
  },

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
