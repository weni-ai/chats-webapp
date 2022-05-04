<template>
  <section class="list-sector-queues">
    <p v-if="sector" class="title">Agentes em {{ sector }}</p>
    <unnnic-table :items="agents">
      <template #header>
        <unnnic-table-row :headers="tableHeaders" />
      </template>

      <template #item="{ item }">
        <unnnic-table-row :headers="tableHeaders">
          <template #name>
            {{ item.name }}
          </template>

          <template #additionDate>{{ item.additionDate }}</template>

          <template #visualize>
            <unnnic-button
              text="Detalhes"
              type="secondary"
              size="small"
              class="details-button"
              @click="$emit('details', item)"
            />
          </template>
        </unnnic-table-row>
      </template>
    </unnnic-table>
  </section>
</template>

<script>
export default {
  name: 'ListSectorAgents',

  props: {
    agents: {
      type: Array,
      default: () => [],
    },
    sector: {
      type: String,
      default: '',
    },
  },

  data: () => ({
    tableHeaders: [
      {
        id: 'name',
        text: 'Nome',
        flex: 3,
      },
      {
        id: 'additionDate',
        text: 'Data de adição',
        flex: 3,
      },
      {
        id: 'visualize',
        text: 'Visualizar',
        flex: 2,
      },
    ],
  }),
};
</script>

<style lang="scss" scoped>
.list-sector-queues {
  .title {
    font-weight: $unnnic-font-weight-bold;
    color: $unnnic-color-neutral-dark;
    font-size: $unnnic-font-size-body-lg;
    line-height: 1.5rem;

    margin-bottom: 1rem;
  }
  .details-button {
    width: 100%;
  }
}
</style>
