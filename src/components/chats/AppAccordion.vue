<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <div>
    <div
      class="app-accordion"
      @click="toggleAccordion()"
      :aria-expanded="isOpen"
      :aria-controls="`collapse${_uid}`"
      style="display: flex; align-items: center; justify-content: space-between; cursor: pointer"
    >
      <header :class="{ disabled }">
        <h2>{{ title }}</h2>
      </header>
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
    title: {
      type: String,
      default: 'Seção',
    },
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

<style lang="scss" scoped>
.app-accordion {
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    padding: 0 0 0.5rem 0.5rem;

    &.disabled {
      h2 {
        color: $unnnic-color-neutral-lightest;
      }
    }

    h2 {
      font-size: $unnnic-font-size-body-md;
      font-weight: $unnnic-font-weight-regular;
      line-height: 1.25rem;
      color: $unnnic-color-neutral-cloudy;
    }
  }
}
</style>
