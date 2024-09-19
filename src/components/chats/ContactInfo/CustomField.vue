<!-- eslint-disable vuejs-accessibility/form-control-has-label -->
<template>
  <section class="custom-field">
    <component
      :is="isEditable && isCurrent ? 'label' : 'h3'"
      class="title"
      tabindex="0"
      >{{ title }}:
    </component>
    <section :class="descriptionClasses">
      <a
        v-if="showLink"
        :href="description"
        target="_blank"
        >{{ description }}</a
      >

      <UnnnicToolTip
        v-show="showEditTooltip"
        class="tooltip"
        side="bottom"
        :enabled="isEditable"
        :text="$t('edit')"
        :title="description"
      >
        <h4
          tabindex="0"
          @click="updateField"
          @keypress.enter="updateField"
        >
          {{ description }}
        </h4>
      </UnnnicToolTip>

      <input
        v-show="showInput"
        :ref="'custom_field_input_' + title"
        type="text"
        :value="value"
        maxlength="500"
        @input="updateValue"
        @blur="saveValue"
        @keypress.enter="saveValue"
      />
    </section>
  </section>
</template>

<script>
export default {
  name: 'CustomField',
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
      required: true,
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
  },

  watch: {
    isCurrent(isCurrent) {
      if (isCurrent) {
        this.$nextTick(() => {
          const inputRef = `custom_field_input_${this.title}`;
          const input = this.$refs[inputRef];

          if (input) {
            input.focus();
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
  align-items: center;
  gap: $unnnic-spacing-inline-nano;

  .title {
    font-weight: $unnnic-font-weight-bold;
    text-transform: capitalize;
  }

  .title,
  .description {
    font-size: $unnnic-font-size-body-gt;

    cursor: default;
  }

  .description {
    border: 1px solid transparent;
    border-radius: $unnnic-border-radius-sm;

    display: flex;

    max-width: 100%;

    overflow: hidden;

    > .tooltip {
      display: flex;

      width: 100%;
    }

    &.editable {
      cursor: text;

      &:hover {
        border: 1px solid $unnnic-color-neutral-cleanest;
      }
    }

    &.current {
      width: 100%;
      border: 1px solid $unnnic-color-neutral-clean;

      input {
        width: 100%;
        border: none;
        border-radius: $unnnic-border-radius-sm;
        padding: 0;
        outline: none;
        font-size: $unnnic-font-size-body-gt;
        color: $unnnic-color-neutral-cloudy;
      }
    }

    h4 {
      width: 100%;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
}
</style>
