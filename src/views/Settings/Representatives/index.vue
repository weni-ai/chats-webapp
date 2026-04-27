<template>
  <section class="settings-representatives">
    <section class="settings-representatives__header">
      <HeaderFilters
        v-model="representativesFilters"
        @update:has-representatives="hasRepresentativesInProject = $event"
        @request-data="handleFiltersChange()"
      />
      <Actions
        v-if="representatives.length > 0"
        :selectAll="selectAllRepresentatives"
        :selectedCount="selectedRepresentatives.length"
        @update:select-all="handleSelectAllRepresentatives"
        @open-queue-management="openQueueManagement"
        @open-chats-limit-management="openChatsLimitManagement"
      />
    </section>
    <section class="settings-representatives__representatives-list">
      <UnnnicIconLoading
        v-if="isLoadingRepresentatives"
        class="settings-representatives__representatives-list__loading"
      />
      <RepresentativesList
        v-else
        :representatives="representatives"
        :selectedRepresentatives="selectedRepresentatives"
        :emptyRepresentatives="!hasRepresentativesInProject"
        @update:selected-representatives="selectedRepresentatives = $event"
        @click:representative="handleClickRepresentative"
      />
    </section>
    <section class="settings-representatives__pagination">
      <p class="settings-representatives__pagination__count">
        {{
          $t('pagination', {
            from: paginationParams.from,
            to: paginationParams.to,
            total: paginationParams.total,
          })
        }}
      </p>
      <UnnnicPagination
        v-model="representativesPage"
        :max="representativesTotalPages"
        :show="representativesLimit"
      />
    </section>
    <QueueManager
      v-if="showQueueManager"
      :open="showQueueManager"
      :representatives="toManagerRepresentative"
      @close="closeQueueManager"
      @update:open="closeQueueManager"
      @success="handleSuccessQueueManager()"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { cloneDeep } from 'lodash';

import HeaderFilters from './HeaderFilters.vue';
import Actions from './Actions.vue';
import RepresentativesList from './RepresentativesList/index.vue';
import QueueManager from './QueueManager/index.vue';

import RepresentativeService from '@/services/api/resources/settings/representative';

defineOptions({
  name: 'SettingsRepresentatives',
});

const openQueueManagement = () => {
  toManagerRepresentative.value = cloneDeep(selectedRepresentatives.value);
  showQueueManager.value = true;
};

const openChatsLimitManagement = () => {
  console.log('TODO:openChatsLimitManagement');
};

const handleClickRepresentative = (representative: any) => {
  toManagerRepresentative.value = [representative];
  showQueueManager.value = true;
};
const closeQueueManager = () => {
  showQueueManager.value = false;
  toManagerRepresentative.value = [];
};

const showQueueManager = ref(false);
const toManagerRepresentative = ref([]);

const hasRepresentativesInProject = ref(false);
const isLoadingRepresentatives = ref(false);
const representatives = ref([]);
const selectedRepresentatives = ref([]);
const selectAllRepresentatives = ref(false);
const representativesFilters = ref({
  status: [],
  representatives: [],
  sectors: [],
  queues: [],
});
const representativesPage = ref(1);
const representativesCount = ref(0);
const representativesLimit = 15;

const representativesTotalPages = computed(() => {
  return Math.ceil(representativesCount.value / representativesLimit);
});
const paginationParams = computed(() => {
  return {
    from: (representativesPage.value - 1) * representativesLimit + 1,
    to: Math.min(
      representativesPage.value * representativesLimit + representativesLimit,
      representativesCount.value,
    ),
    total: representativesCount.value,
  };
});

const getRepresentatives = async () => {
  try {
    isLoadingRepresentatives.value = true;

    const { results, count } = await RepresentativeService.listAll({
      offset: (representativesPage.value - 1) * representativesLimit,
      limit: representativesLimit,
      filters: {
        ...representativesFilters.value,
        sectors: representativesFilters.value.sectors.filter(
          (sector) => sector !== 'all',
        ),
        queues: representativesFilters.value.queues.filter(
          (queue) => queue !== 'all',
        ),
      },
    });

    representatives.value = results.map(({ agent }) => agent);
    representativesCount.value = count;
  } catch (error) {
    console.error('Error getting representatives', error);
  } finally {
    isLoadingRepresentatives.value = false;
  }
};

const handleSelectAllRepresentatives = (selected: boolean) => {
  selectAllRepresentatives.value = selected;
  if (selected) {
    selectedRepresentatives.value = cloneDeep(representatives.value);
  } else {
    selectedRepresentatives.value = [];
  }
};

const handleFiltersChange = () => {
  if (representativesPage.value === 1) getRepresentatives();
  else representativesPage.value = 1;
};

const handleSuccessQueueManager = () => {
  toManagerRepresentative.value = [];
  selectedRepresentatives.value = [];
  handleFiltersChange();
};

onMounted(async () => {
  await getRepresentatives();
});

watch(representativesPage, async () => {
  await getRepresentatives();
});

watch(
  () => selectedRepresentatives.value.length,
  () => {
    if (selectedRepresentatives.value.length === representatives.value.length) {
      selectAllRepresentatives.value = true;
    } else {
      selectAllRepresentatives.value = false;
    }
  },
);
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
    height: 53vh;
    overflow-y: auto;
    display: flex;
    flex-direction: column;

    &__loading {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
    }
  }
  &__pagination {
    display: flex;
    justify-content: space-between;
    align-items: center;
    &__count {
      color: $unnnic-color-fg-base;
      font: $unnnic-font-body;
    }
  }
}
</style>
