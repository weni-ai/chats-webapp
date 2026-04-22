<template>
  <section class="settings-representatives">
    <section class="settings-representatives__header">
      <HeaderFilters />
      <Actions
        :selectAll="selectAllRepresentatives"
        :selectedCount="0"
        @update:select-all="handleSelectAllRepresentatives"
        @open-queue-management="openQueueManagement"
        @open-chats-limit-management="openChatsLimitManagement"
      />
    </section>
    <section class="settings-representatives__representatives-list">
      <RepresentativesList
        :representatives="representatives"
        :selectedRepresentatives="selectedRepresentatives"
        @update:selected-representatives="selectedRepresentatives = $event"
      />
    </section>
    <section class="settings-representatives__pagination">
      TODO: Pagination
    </section>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import HeaderFilters from './HeaderFilters.vue';
import Actions from './Actions.vue';
import RepresentativesList from './RepresentativesList/index.vue';

defineOptions({
  name: 'SettingsRepresentatives',
});

const representatives = ref([
  {
    name: 'John Doe',
    status: 'online',
    chats_limit: { active: true, total: 10 },
    email: 'john.doe@example.com',
    sector: [
      { name: 'Sales', queues: ['Queue 1', 'Queue 2'] },
      { name: 'Sales', queues: ['Queue 1', 'Queue 2'] },
      { name: 'Sales', queues: ['Queue 1', 'Queue 2'] },
      { name: 'Sales', queues: ['Queue 1', 'Queue 2'] },
      { name: 'Sales', queues: ['Queue 1', 'Queue 2'] },
      { name: 'Sales', queues: ['Queue 1', 'Queue 2'] },
      { name: 'Sales', queues: ['Queue 1', 'Queue 2'] },
      { name: 'Sales', queues: ['Queue 1', 'Queue 2'] },
      { name: 'Sales', queues: ['Queue 1', 'Queue 2'] },
      { name: 'Sales', queues: ['Queue 1', 'Queue 2'] },
      { name: 'Sales', queues: ['Queue 1', 'Queue 2'] },
      { name: 'Sales', queues: ['Queue 1', 'Queue 2'] },
      { name: 'Sales', queues: ['Queue 1', 'Queue 2'] },
      { name: 'Sales', queues: ['Queue 1', 'Queue 2'] },
      { name: 'Sales', queues: ['Queue 1', 'Queue 2'] },
      { name: 'Sales', queues: ['Queue 1', 'Queue 2'] },
      { name: 'Sales', queues: ['Queue 1', 'Queue 2'] },
      { name: 'Sales', queues: ['Queue 1', 'Queue 2'] },
      { name: 'Sales', queues: ['Queue 1', 'Queue 2'] },
      { name: 'Sales', queues: ['Queue 1', 'Queue 2'] },
      { name: 'Sales', queues: ['Queue 1', 'Queue 2'] },
      { name: 'Sales', queues: ['Queue 1', 'Queue 2'] },
      { name: 'Sales', queues: ['Queue 1', 'Queue 2'] },
      { name: 'Sales', queues: ['Queue 1', 'Queue 2'] },
    ],
    sector_chats_total_limit: 10,
  },
]);
const selectedRepresentatives = ref([]);
const selectAllRepresentatives = ref(false);

const handleSelectAllRepresentatives = (selected: boolean) => {
  selectAllRepresentatives.value = selected;
  if (selected) {
    selectedRepresentatives.value = representatives.value.map(
      (representative) => representative.email,
    );
  } else {
    selectedRepresentatives.value = [];
  }
};

const openQueueManagement = () => {
  console.log('openQueueManagement');
};

const openChatsLimitManagement = () => {
  console.log('openChatsLimitManagement');
};
</script>

<style lang="scss" scoped>
.settings-representatives {
  display: flex;
  flex-direction: column;
  gap: $unnnic-space-4;
  &__header {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-4;
  }
  &__representatives-list {
    height: 58vh; // TODO: verify
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }
  &__pagination {
    display: flex;
  }
}
</style>
