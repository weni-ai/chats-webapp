<template>
  <section class="list-sector-queues">
    <p
      v-if="sector"
      class="title"
    >
      Filas em {{ sector }}
    </p>

    <UnnnicTable :items="queues">
      <template #header>
        <UnnnicTableRow :headers="tableHeaders" />
      </template>

      <template #item="{ item }">
        <UnnnicTableRow :headers="tableHeaders">
          <template #name>
            {{ item.name }}
          </template>

          <template #agents>{{ item.agents }}</template>

          <template #visualize>
            <UnnnicButton
              text="Editar"
              type="secondary"
              size="small"
              class="visualize-button"
              @click="$emit('visualize', { ...item })"
            />
          </template>
        </UnnnicTableRow>
      </template>
    </UnnnicTable>
  </section>
</template>

<script>
export default {
  name: 'ListSectorQueues',

  props: {
    queues: {
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
        id: 'agents',
        text: 'Qtd de agentes',
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

  .visualize-button {
    width: 100%;
  }
}
</style>
