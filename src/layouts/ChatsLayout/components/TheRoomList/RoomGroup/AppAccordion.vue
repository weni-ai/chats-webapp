<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <div>
    <div
      @click="toggleAccordion()"
      :aria-expanded="isOpen"
      :aria-controls="`collapse${_uid}`"
      style="display: flex; align-items: center; justify-content: space-between"
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
  data() {
    return {
      isOpen: true,
    };
  },

  methods: {
    toggleAccordion() {
      this.isOpen = !this.isOpen;
    },
  },
};
</script>

<style lang="scss" scoped></style>
