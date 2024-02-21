<template>
  <unnnic-dropdown-item
    class="more-actions-option"
    @click="handlerClick"
    @keypress.enter="handlerClick"
  >
    <unnnic-icon-svg :icon="icon" next size="sm" />
    <p>{{ title }}</p>
  </unnnic-dropdown-item>
</template>

<script>
export default {
  name: 'MoreAtionsOption',

  props: {
    icon: { type: String, required: true },
    title: { type: String, required: true },
    action: { type: Function, required: false },
    inputType: {
      type: String,
      required: false,
      validator(value) {
        return ['image', 'doc'].includes(value);
      },
    },
  },

  computed: {
    inputFileExtensions() {
      const inputFileExtensionsMap = {
        image: '.png,.jpeg,.jpg,.mp4',
        doc: '.pdf,.doc,.docx,.txt,.xls,.xlsx,.csv',
      };
      return inputFileExtensionsMap[this.inputType];
    },
  },

  methods: {
    handlerClick() {
      return this.inputType ? this.openFileSelector() : this.action();
    },
    openFileSelector() {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = this.inputFileExtensions;
      input.addEventListener('change', this.handleFileChange);
      input.click();
    },
    handleFileChange(event) {
      const selectedFiles = event.target.files;
      this.$emit('files-selected', selectedFiles);
    },
  },
};
</script>

<style lang="scss" scoped>
a.more-actions-option {
  &::before {
    display: none;
  }

  padding: $unnnic-spacing-stack-sm 0;

  display: flex;
  gap: $unnnic-spacing-inline-xs;

  width: max-content;
}
</style>
