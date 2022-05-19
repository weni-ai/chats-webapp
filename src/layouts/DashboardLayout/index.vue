<template>
  <section class="dashboard-layout">
    <header class="dashboard__header">
      <unnnic-avatar-icon icon="graph-stats-1" scheme="aux-purple" />
      <span class="title">
        <slot name="header" />
      </span>
      <unnnic-icon-svg icon="information-circle-4" size="sm" scheme="neutral-soft" />
    </header>

    <section class="filters">
      <unnnic-select
        v-model="filters.tag"
        placeholder="Selecionar tags"
        label="Filtrar por tags"
        size="sm"
      >
        <option v-for="tag in tags" :key="tag.value" :selected="tag.value === tag">
          {{ tag.text }}
        </option>
      </unnnic-select>
      <unnnic-autocomplete
        v-model="visualizationSearch"
        @choose="onChangeVisualization($event)"
        :data="visualizations"
        label="Visualização"
        highlight
        open-with-focus
        size="sm"
      />
      <unnnic-select v-model="filters.date" placeholder="Agora" label="Filtrar por data" size="sm">
        <option value="now">Agora</option>
        <option value="last-7-days">Últimos 7 dias</option>
        <option value="last-14-days">Últimos 14 dias</option>
        <option value="last-30-days">Últimos 30 dias</option>
        <option value="last-12-months">Últimos 12 meses</option>
        <option value="current-month">Mês Atual</option>
        <option value="">Desde o início</option>
      </unnnic-select>
    </section>

    <section class="view scrollable">
      <slot />
    </section>
  </section>
</template>

<script>
export default {
  name: 'DashboardLayout',

  data: () => ({
    visualizationSearch: 'Geral',
    filters: {
      tag: '',
      visualization: '',
      date: '',
    },
    tags: [
      { text: 'Dúvidas', value: 'doubts' },
      { text: 'Financeiro', value: 'finance' },
      { text: 'Ajuda', value: 'help' },
    ],
    visualizations: [
      { text: 'Geral', value: 'general', type: 'option' },
      { type: 'category', text: 'Departamentos' },
      { text: 'Financeiro', value: 'finance', type: 'option', category: 'sector' },
      { text: 'Suporte', value: 'support', type: 'option', category: 'sector' },
      { type: 'category', text: 'Agentes' },
      { text: 'Juliano', value: 'juliano', type: 'option', category: 'agent' },
    ],
  }),

  methods: {
    onChangeVisualization(visualizationValue) {
      if (visualizationValue === 'general') this.activeFilters.visualization = {};

      const { text, value, category } = this.visualizations.find(
        (v) => v.value === visualizationValue,
      );

      this.filters.visualization = {
        text,
        category,
        value,
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
.dashboard-layout {
  $max-height: calc(100vh - 5.5rem);
  height: $max-height;
  max-height: $max-height;

  display: flex;
  flex-direction: column;

  padding: 1.5rem 0.5rem 0 1.5rem;

  background: $unnnic-color-background-carpet;

  .dashboard__header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-right: 1rem;
    padding-bottom: 1.5rem;
    margin-bottom: 1.5rem;
    border-bottom: solid 1px $unnnic-color-neutral-soft;

    .title {
      font-size: 1.5rem;
      color: $unnnic-color-neutral-darkest;
    }
  }

  .filters {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;

    & > * {
      min-width: 16.5rem;
    }
  }

  .scrollable {
    overflow-y: auto;
    padding: {
      right: $unnnic-spacing-inset-sm;
      bottom: $unnnic-spacing-inset-md;
    }
  }

  .view {
    flex: 1 1;
  }
}
</style>
