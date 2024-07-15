<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <div>
    <div
      class="app-accordion"
      :aria-expanded="isOpen"
      :aria-controls="`collapse${_uid}`"
      style="
        display: flex;
        align-items: center;
        justify-content: space-between;
        cursor: pointer;
      "
      @click="toggleAccordion()"
    >
      <header>
        <h2>{{ title }}</h2>
      </header>
      <UnnnicIcon
        size="xs"
        :icon="isOpen ? 'arrow-button-up-1' : 'arrow-button-down-1'"
        scheme="neutral-darkest"
      />
    </div>

    <div
      v-show="isOpen"
      :id="`collapse${_uid}`"
    >
      <slot name="content" />
    </div>
  </div>
</template>

<script>
export default {
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
  emits: ['change'],
  data() {
    return {
      isOpen: true,
    };
  },
  created() {
    this.isOpen = this.isDefaultOpen;
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
  margin-bottom: $unnnic-spacing-stack-sm;

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    h2 {
      font-size: $unnnic-font-size-body-md;
      font-weight: $unnnic-font-weight-regular;
      line-height: 1.25rem;
      color: $unnnic-color-neutral-cloudy;
    }
  }
}
</style>
