<template>
  <section class="list-agents">
    <p
      v-if="title"
      class="title"
      data-testid="title"
    >
      {{ title }}
    </p>
    <UnnnicTable :items="agents">
      <template #header>
        <UnnnicTableRow :headers="tableHeaders" />
      </template>

      <template #item="{ item }">
        <UnnnicTableRow :headers="tableHeaders">
          <template #name>
            {{ item.name }}
          </template>

          <template #additionDate>{{ item.additionDate }}</template>

          <template #visualize>
            <UnnnicButton
              :text="actionText || $t('details')"
              type="secondary"
              size="small"
              class="action-button"
              @click="$emit('select', item)"
            />
          </template>
        </UnnnicTableRow>
      </template>
    </UnnnicTable>
  </section>
</template>

<script>
export default {
  name: 'ListAgents',

  props: {
    agents: {
      type: Array,
      default: () => [],
    },
    actionText: {
      type: String,
      default: '',
    },
    title: {
      type: String,
      default: '',
    },
  },
  emits: ['select'],

  computed: {
    tableHeaders() {
      return [
        {
          id: 'name',
          text: this.$t('name'),
          flex: 3,
        },
        {
          id: 'additionDate',
          text: this.$t('addition_date'),
          flex: 3,
        },
        {
          id: 'visualize',
          text: this.$t('view'),
          flex: 2,
        },
      ];
    },
  },
};
</script>

<style lang="scss" scoped>
.list-agents {
  .title {
    font-weight: $unnnic-font-weight-bold;
    color: $unnnic-color-neutral-dark;
    font-size: $unnnic-font-size-body-lg;
    line-height: 1.5rem;

    margin-bottom: 1rem;
  }

  .action-button {
    width: 100%;
  }
}
</style>
