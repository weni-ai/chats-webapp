<template>
  <section class="dashboard-filters">
    <unnnic-autocomplete
      v-if="visualizations.length !== 0"
      v-model="visualizationSearch"
      @choose="onChooseVisualization($event)"
      :data="visualizations"
      label="Visualizar por setor, fila ou agente"
      highlight
      open-with-focus
      size="sm"
    />

    <unnnic-select
      v-if="tags.length !== 0"
      v-model="filters.tag"
      placeholder="Filtrar por tags"
      label="Filtrar por tags"
      size="sm"
    >
      <option v-for="tag in tags" :key="tag.value" :selected="tag.value === tag">
        {{ tag.text }}
      </option>
    </unnnic-select>

    <unnnic-select
      v-if="dates.length !== 0"
      v-model="filters.date"
      placeholder="Agora"
      label="Filtrar por data"
      size="sm"
    >
      <option v-for="date in dates" :key="date.value" :value="date.value">{{ date.text }}</option>
    </unnnic-select>

    <unnnic-tool-tip enabled text="Limpar filtro" side="right">
      <unnnic-button-icon
        icon="button-refresh-arrows-1"
        size="small"
        class="clear-filters-btn"
        @click="clearFilters"
      />
    </unnnic-tool-tip>
  </section>
</template>

<script>
export default {
  name: 'DashboardFilters',

  props: {
    tags: {
      type: Array,
      default: () => [],
    },
    visualizations: {
      type: Array,
      default: () => [],
    },
    dates: {
      type: Array,
      default: () => [],
    },
  },

  created() {
    this.visualizationSearch = this.visualizations[0]?.text;
  },

  data: () => ({
    visualizationSearch: '',
    filters: {
      tag: '',
      visualization: '',
      date: '',
    },
  }),

  methods: {
    clearFilters() {
      const emptyFilters = {
        tag: '',
        visualization: '',
        date: '',
      };
      this.filters = emptyFilters;
      this.visualizationSearch = this.visualizations[0]?.text;
    },
    onChooseVisualization(visualizationValue) {
      const visualization = this.visualizations.find((v) => v.value === visualizationValue);

      this.filters = {
        ...this.filters,
        visualization,
      };
    },
  },

  watch: {
    filters: {
      deep: true,
      handler(filters) {
        this.$emit('filter', filters);
      },
    },
  },
};
</script>

<style lang="scss" scoped>
.dashboard-filters {
  display: flex;
  align-items: flex-end;
  gap: 1rem;

  & > *:not(:last-child) {
    min-width: 16.5rem;
  }
}
</style>
