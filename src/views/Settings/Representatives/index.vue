<template>
  <section class="settings-representatives">
    <section class="settings-representatives__header">
      <HeaderFilters />
      <Actions
        :selectAll="selectAllRepresentatives"
        :selectedCount="0"
        @update:select-all="selectAllRepresentatives = $event"
        @open-queue-management="openQueueManagement"
        @open-chats-limit-management="openChatsLimitManagement"
      />
    </section>
    <section class="settings-representatives__representatives-list">
      TODO: Representatives list
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

defineOptions({
  name: 'SettingsRepresentatives',
});

const selectAllRepresentatives = ref(false);

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
