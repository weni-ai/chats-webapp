<template>
  <section class="list-sector-queues">
    <p v-if="sector" class="title">{{ $t('queues.queue_title') }} {{ sector }}</p>

    <unnnic-table :items="queues">
      <template #header>
        <unnnic-table-row :headers="tableHeaders" />
      </template>

      <template #item="{ item }">
        <unnnic-table-row :headers="tableHeaders">
          <template #name>
            {{ item.name }}
          </template>

          <template #agents>{{ item.agents }}</template>

          <template #visualize>
            <unnnic-button
              :text="$t('queues.queue_edit')"
              type="secondary"
              size="small"
              class="visualize-button"
              @click="$emit('visualize', { ...item })"
            />
          </template>
        </unnnic-table-row>
      </template>
    </unnnic-table>
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

  data() {
    return {
      tableHeaders: [
        {
          id: 'name',
          text: this.$t('queues.queue_table_name'),
          flex: 3,
        },
        {
          id: 'agents',
          text: this.$t('queues.quantity_agents'),
          flex: 3,
        },
        {
          id: 'visualize',
          text: this.$t('queues.visualize'),
          flex: 2,
        },
        // outros cabeçalhos de tabela...
      ],
    };
  },
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
