<!-- eslint-disable vuejs-accessibility/form-control-has-label -->
<template>
  <div class="custom-field">
    <component :is="isEditable && isCurrent ? 'label' : 'h3'" class="title" tabindex="0"
      >{{ title }}:
    </component>
    <div :class="['description', isEditable && 'editable', isCurrent && 'current']">
      <unnnic-tool-tip
        v-show="!isCurrent"
        class="tooltip"
        side="bottom"
        :enabled="isEditable"
        :text="$t('edit')"
        :title="description"
      >
        <h4
          tabindex="0"
          @click="isEditable && updateCurrentCustomField({ key: title, value: description })"
          @keypress.enter="
            isEditable && updateCurrentCustomField({ key: title, value: description })
          "
        >
          {{ description }}
        </h4>
      </unnnic-tool-tip>
      <input
        v-show="isEditable && isCurrent"
        :ref="'custom_field_input_' + title"
        type="text"
        :value="value"
        @input="updateCurrentCustomField({ key: title, value: $event.target.value || '' })"
        @blur="saveValue"
        @keypress.enter="saveValue"
        maxlength="50"
      />
    </div>
  </div>
</template>

<script>
export default {
  name: 'CustomField',
  props: {
    title: {
      type: String,
      default: 'Custom',
      required: true,
    },
    description: {
      type: String,
      default: '',
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
      required: true,
    },
  },

  methods: {
    updateCurrentCustomField(customField) {
      this.$emit('update-current-custom-field', customField);
    },
    saveValue() {
      this.$emit('save-value');
    },
  },

  watch: {
    isCurrent(isCurrent) {
      if (isCurrent) {
        this.$nextTick(() => {
          const inputRef = `custom_field_input_${this.title}`;
          const input = this.$refs[inputRef];
          console.log(this.$refs[inputRef]);

          if (input) {
            input.focus();
          }
        });
      }
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
