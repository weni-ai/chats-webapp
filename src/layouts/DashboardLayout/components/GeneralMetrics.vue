<template>
  <section class="metrics">
    <template
      v-for="{ title, icon, scheme, value, percent, invertedPercentage, tooltip, type } in metrics"
    >
      <unnnic-tool-tip v-if="tooltip" :key="title" enabled :text="tooltip" side="right">
        <unnnic-card
          type="dash"
          :title="title"
          :icon="icon"
          :scheme="scheme"
          :value="type === 'time' ? timeToString(value) : value"
          :percent="percent"
          :inverted-percentage="invertedPercentage"
        />
      </unnnic-tool-tip>

      <unnnic-card
        v-else
        :key="title"
        type="dash"
        :title="title"
        :icon="icon"
        :scheme="scheme"
        :value="type === 'time' ? timeToString(value) : value"
        :percent="percent"
        :inverted-percentage="invertedPercentage"
      />
    </template>
  </section>
</template>

<script>
export default {
  props: {
    metrics: {
      type: Array,
      default: () => [],
    },
  },

  methods: {
    timeToString({ minutes, seconds }) {
      return `${minutes}min ${seconds}s`;
    },
  },
};
</script>

<style lang="scss" scoped>
.metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $unnnic-spacing-stack-sm;
}
</style>
