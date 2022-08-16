<template>
  <section class="quick-message-form">
    <unnnic-input
      :value="quickMessage.title"
      @input="quickMessage = { ...quickMessage, title: $event }"
      size="sm"
      :label="$t('title')"
      :placeholder="$t('quick_messages.title_field_placeholder')"
    />

    <unnnic-input
      :value="quickMessage.shortcut"
      @input="quickMessage = { ...quickMessage, shortcut: $event }"
      size="sm"
      :placeholder="$t('quick_messages.shortcut_field_placeholder')"
    >
      <template #label>
        <span class="label">
          {{ $t('shortcut') }}
          <unnnic-tool-tip enabled :text="$t('quick_messages.shortcut_field_tooltip')" side="right">
            <unnnic-icon-svg scheme="neutral-clean" icon="information-circle-4" size="sm" />
          </unnnic-tool-tip>
        </span>
      </template>
    </unnnic-input>

    <unnnic-text-area
      :value="quickMessage.message"
      @input="quickMessage = { ...quickMessage, message: $event }"
      :label="$t('message')"
      :placeholder="$t('quick_messages.message_field_placeholder')"
    />

    <div class="actions">
      <unnnic-button
        class="button"
        :text="$t('cancel')"
        type="secondary"
        size="small"
        @click="$emit('cancel')"
      />
      <unnnic-button
        class="button"
        :text="$t('save')"
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
    value: {
      type: Object,
      default: null,
    },
  },

  computed: {
    isSaveButtonDisabled() {
      return !this.hasMessageTitle || !this.hasMessageShortcut || !this.hasMessageContent;
    },
    hasMessageContent() {
      return this.quickMessage.message?.trim?.();
    },
    hasMessageShortcut() {
      return this.quickMessage.shortcut?.trim?.();
    },
    hasMessageTitle() {
      return this.quickMessage.title?.trim?.();
    },
    quickMessage: {
      get() {
        return this.value || {};
      },
      set(quickMessage) {
        this.$emit('input', quickMessage);
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
  gap: $unnnic-spacing-stack-sm;

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
}
</style>
