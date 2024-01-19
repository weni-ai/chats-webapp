<template>
  <unnnic-dropdown-item class="more-actions-option" @click="action" @keypress.enter="action">
    <div class="title">
      <unnnic-icon-svg :icon="icon" next size="sm" />
      <span> {{ title }} </span>
      <!-- eslint-disable-next-line vuejs-accessibility/form-control-has-label -->
      <input
        class="input-file"
        v-if="inputType"
        type="file"
        :accept="inputFileExtensions"
        @change="handleFileChange"
      />
      <!-- TODO: debug @change function not being called -->
    </div>
  </unnnic-dropdown-item>
</template>

<script>
export default {
  name: 'MoreAtionsOption',

  props: {
    icon: { type: String, required: true },
    title: { type: String, required: true },
    action: { type: Function, required: true },
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
    margin: 0;
  }

  .title {
    position: relative;

    padding: $unnnic-spacing-stack-sm 0;

    display: flex;
    gap: $unnnic-spacing-inline-xs;

    width: max-content;
  }

  .input-file {
    position: absolute;
    top: 0;
    left: 0;

    width: 100%;
    height: 100%;

    background-color: transparent;
    border: none;
    opacity: 0;
  }
}
</style>
