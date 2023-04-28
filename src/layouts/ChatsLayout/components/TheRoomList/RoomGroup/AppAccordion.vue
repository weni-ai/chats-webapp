<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <div>
    <div
      @click="toggleAccordion()"
      :aria-expanded="isOpen"
      :aria-controls="`collapse${_uid}`"
      style="display: flex; align-items: center; justify-content: space-between; cursor: pointer"
    >
      <slot name="title" />
      <unnnic-icon
        size="xs"
        :icon="isOpen ? 'arrow-button-up-1' : 'arrow-button-down-1'"
        scheme="neutral-darkest"
      />
    </div>

    <div v-show="isOpen" :id="`collapse${_uid}`">
      <slot name="content" />
    </div>
  </div>
</template>

<script>
export default {
  created() {
    this.isOpen = this.isDefaultOpen;
  },
  data() {
    return {
      isOpen: true,
    };
  },
  props: {
    isDefaultOpen: {
      type: Boolean,
      default: true,
    },
  },

  methods: {
    toggleAccordion() {
      this.isOpen = !this.isOpen;
      this.$emit('change', this.isOpen);
    },
  },
};
</script>

<style lang="scss" scoped></style>
