<!-- eslint-disable vuejs-accessibility/form-control-has-label -->
<template>
  <section class="custom-field">
    <section class="custom-field__content">
      <component
        :is="isEditable && isCurrent ? 'label' : 'h3'"
        class="title"
        :for="isEditable && isCurrent ? textareaId : undefined"
        tabindex="0"
      >
        {{ title }}:
      </component>
      <section :class="descriptionClasses">
        <a
          v-if="showLink"
          :href="description"
          target="_blank"
        >
          {{ description }}
        </a>

        <UnnnicToolTip
          v-if="showEditTooltip"
          class="tooltip"
          side="bottom"
          :enabled="isEditable"
          :text="$t('edit')"
        >
          <h4
            tabindex="0"
            @click="updateField"
            @keypress.enter="updateField"
          >
            {{ description }}
          </h4>
        </UnnnicToolTip>

        <textarea
          v-show="showInput"
          :id="textareaId"
          ref="textarea"
          rows="1"
          :value="value"
          maxlength="500"
          @input="updateValue"
          @blur="saveValue"
          @keydown.enter.prevent="saveValue"
        />
      </section>
    </section>
    <CopyValueButton :value="description" />
  </section>
</template>

<script>
import CopyValueButton from './CopyValueButton.vue';

export default {
  name: 'CustomField',
  components: {
    CopyValueButton,
  },
  props: {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    isEditable: {
      type: Boolean,
      default: false,
      required: false,
    },
    isCurrent: {
      type: Boolean,
      default: false,
      required: false,
    },
    value: {
      type: String,
      default: '',
    },
  },
  emits: ['save-value', 'update-current-custom-field'],

  computed: {
    isDescriptionAUrl() {
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      return urlRegex.test(this.description);
    },

    descriptionClasses() {
      return [
        'description',
        this.isEditable && 'editable',
        this.isCurrent && 'current',
      ];
    },
    showLink() {
      return !this.isEditable && this.isDescriptionAUrl;
    },
    showEditTooltip() {
      return !this.isCurrent && (this.isEditable || !this.isDescriptionAUrl);
    },
    showInput() {
      return this.isEditable && this.isCurrent;
    },
    textareaId() {
      return `custom-field-${String(this.title).replace(/[^\w-]+/g, '-')}`;
    },
  },

  watch: {
    isCurrent(isCurrent) {
      if (isCurrent) {
        this.$nextTick(() => {
          const textarea = this.$refs.textarea;

          if (textarea) {
            textarea.focus();
            this.adjustTextareaHeight();
          }
        });
      }
    },
  },

  methods: {
    updateField() {
      if (this.isEditable) {
        this.updateCurrentCustomField({
          key: this.title,
          value: this.description,
        });
      }
    },
    updateValue(event) {
      this.updateCurrentCustomField({
        key: this.title,
        value: event.target.value || '',
      });
      this.adjustTextareaHeight();
    },
    adjustTextareaHeight() {
      const textarea = this.$refs.textarea;
      if (!textarea) return;

      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    },
    updateCurrentCustomField(customField) {
      this.$emit('update-current-custom-field', customField);
    },
    saveValue() {
      this.$emit('save-value');
    },
  },
};
</script>

<style lang="scss" scoped>
.custom-field {
  display: flex;
  align-items: flex-start;
  gap: $unnnic-space-2;
  width: 100%;
  min-width: 0;

  &__content {
    display: flex;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: $unnnic-space-1;
    flex: 1;
    min-width: 0;
  }

  .title {
    flex: 0 1 auto;
    max-width: 100%;
    font: $unnnic-font-emphasis;
    color: $unnnic-color-fg-base;
    font-weight: $unnnic-font-weight-bold;
    overflow-wrap: anywhere;
  }

  .description {
    flex: 1 1 12ch;
    min-width: 0;
    max-width: 100%;
    font: $unnnic-font-body;
    color: $unnnic-color-fg-base;
    cursor: default;
    border: 1px solid transparent;
    border-radius: $unnnic-border-radius-sm;
    display: flex;
    overflow-wrap: anywhere;

    > .tooltip,
    :deep(.unnnic-tooltip) {
      display: block;
      min-width: 0;
      max-width: 100%;
      width: 100%;
      white-space: normal;
    }

    &.editable {
      cursor: text;

      &:hover {
        border: 1px solid $unnnic-color-border-soft;
      }
    }

    &.current {
      width: 100%;
      flex-basis: 100%;
      border: 1px solid $unnnic-color-border-soft;

      textarea {
        display: block;
        width: 100%;
        max-height: ($unnnic-font-size-body-gt + $unnnic-line-height-md) * 8;
        border: none;
        border-radius: $unnnic-border-radius-sm;
        padding: 0;
        outline: none;
        resize: none;
        overflow-x: hidden;
        overflow-y: auto;
        font: $unnnic-font-body;
        font-size: $unnnic-font-size-body-gt;
        color: $unnnic-color-fg-base;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
      }
    }

    a,
    h4 {
      width: 100%;
      max-width: 100%;
      min-width: 0;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }
  }

  :deep(.copy-value-button) {
    flex-shrink: 0;
  }
}
</style>
