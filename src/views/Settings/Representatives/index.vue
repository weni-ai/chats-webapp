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
    <section
      v-if="representatives.length > 0"
      class="settings-representatives__pagination"
    >
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
      @success="handleSuccessSaveChanges()"
    />
    <BulkChatsLimitModal
      v-if="showBulkChatsLimitModal"
      :modelValue="showBulkChatsLimitModal"
      :representatives="selectedRepresentatives"
      @close="closeBulkChatsLimitModal"
      @update:model-value="closeBulkChatsLimitModal"
      @success="handleSuccessSaveChanges()"
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
import BulkChatsLimitModal from './BulkChatsLimitModal.vue';

import RepresentativeService from '@/services/api/resources/settings/representative';

import type { Representative } from './types';

defineOptions({
  name: 'SettingsRepresentatives',
});

const openQueueManagement = () => {
  toManagerRepresentative.value = cloneDeep(selectedRepresentatives.value);
  showQueueManager.value = true;
};

const openChatsLimitManagement = () => {
  toManagerRepresentative.value = cloneDeep(selectedRepresentatives.value);
  showBulkChatsLimitModal.value = true;
};

const closeBulkChatsLimitModal = () => {
  showBulkChatsLimitModal.value = false;
  toManagerRepresentative.value = [];
};

const handleClickRepresentative = (representative: any) => {
  toManagerRepresentative.value = [representative];
  showQueueManager.value = true;
};
const closeQueueManager = () => {
  showQueueManager.value = false;
  toManagerRepresentative.value = [];
};

const showBulkChatsLimitModal = ref(false);
const showQueueManager = ref(false);
const toManagerRepresentative = ref<Representative[]>([]);

const hasRepresentativesInProject = ref(false);
const isLoadingRepresentatives = ref(false);
const representatives = ref<Representative[]>([]);
const selectedRepresentatives = ref<Representative[]>([]);
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

const handleSuccessSaveChanges = () => {
  toManagerRepresentative.value = [];
  selectedRepresentatives.value = [];
  showQueueManager.value = false;
  showBulkChatsLimitModal.value = false;
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
