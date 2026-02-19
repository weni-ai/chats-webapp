<template>
  <UnnnicModalDialog
    :modelValue="true"
    class="modal-close-rooms"
    :showCloseIcon="!isLoadingBulkClose"
    :primaryButtonProps="primaryButtonProps"
    :secondaryButtonProps="secondaryButtonProps"
    :persistent="isLoadingBulkClose"
    data-testid="modal-bulk-close"
    size="lg"
    @secondary-button-click="handleSecondaryClick"
    @primary-button-click="handlePrimaryClick"
    @update:model-value="emitClose"
  >
    <template #title>
      <section class="modal-close-rooms__title-container">
        <span class="modal-close-rooms__title-text">{{ modalTitle }}</span>
        <UnnnicTag
          v-if="totalSectors > 1"
          :text="
            $t('bulk_close.sector_tag', {
              current: currentSectorIndex + 1,
              total: totalSectors,
            })
          "
          type="default"
          scheme="blue"
          class="modal-close-rooms__sector-tag"
        />
      </section>
    </template>

    <section class="modal-close-rooms__content">
      <p class="modal-close-rooms__subtitle">
        {{
          $tc('bulk_close.chats_count_sector', currentSectorData.rooms.length, {
            count: currentSectorData.rooms.length,
            sector: currentSectorData.name,
          })
        }}
      </p>

      <UnnnicDisclaimer
        v-if="shouldShowDisclaimer"
        class="modal-close-rooms__disclaimer"
        :type="disclaimerType"
        :title="disclaimerTitle"
        :description="disclaimerDescription"
      />

      <UnnnicInput
        v-model="tagsFilter"
        iconLeft="search"
        :placeholder="$t('tags.search')"
      />

      <section class="modal-close-rooms__tags-list">
        <ChatClassifier
          :key="currentSectorData.uuid"
          v-model="currentSectorSelectedTags"
          :tags="filteredSectorTags"
          :loading="isLoadingTags"
          @update:to-remove-tags="handleRemoveTags"
          @update:to-add-tags="handleAddTags"
        />
      </section>
    </section>
  </UnnnicModalDialog>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { unnnicCallAlert } from '@weni/unnnic-system';
import i18n from '@/plugins/i18n';

import { useRooms } from '@/store/modules/chats/rooms';
import Room from '@/services/api/resources/chats/room';
import Queue from '@/services/api/resources/settings/queue';

import ChatClassifier from '@/components/chats/ChatClassifier.vue';

defineProps({
  bulkClose: {
    type: Boolean,
    default: false,
  },
});

const BULK_CLOSE_BATCH_SIZE = 200;

const emit = defineEmits(['close']);

const roomsStore = useRooms();
const { selectedOngoingRooms, selectedWaitingRooms, activeTab, rooms } =
  storeToRefs(roomsStore);

// Get current selected rooms
const currentSelectedRooms = computed(() => {
  return activeTab.value === 'ongoing'
    ? selectedOngoingRooms.value
    : selectedWaitingRooms.value;
});

// Group rooms by sector
const roomsBySector = computed(() => {
  const grouped = {};

  currentSelectedRooms.value.forEach((roomUuid) => {
    const room = rooms.value.find((r) => r.uuid === roomUuid);
    if (!room || !room.queue) return;

    const sectorKey = room.queue.sector || room.queue.uuid;
    const sectorName = room.queue.sector_name || room.queue.name;

    if (!grouped[sectorKey]) {
      grouped[sectorKey] = {
        uuid: sectorKey,
        name: sectorName,
        rooms: [],
        queue: room.queue,
      };
    }

    grouped[sectorKey].rooms.push(roomUuid);
  });

  return grouped;
});

const sectorsArray = computed(() => Object.values(roomsBySector.value));
const totalSectors = computed(() => sectorsArray.value.length);

// Navigation state
const currentSectorIndex = ref(0);
const currentSectorData = computed(
  () =>
    sectorsArray.value[currentSectorIndex.value] || {
      rooms: [],
      queue: {},
      name: '',
    },
);

// Tag management
const isLoadingTags = ref(false);
const tagsFilter = ref('');
const allSectorTags = ref({});
const sectorSelectedTags = ref({});
const sectorToAddTags = ref({});
const sectorToRemoveTags = ref({});

const currentSectorTags = computed(() => {
  const sectorUuid = currentSectorData.value.uuid;
  return allSectorTags.value[sectorUuid] || [];
});

const filteredSectorTags = computed(() => {
  return currentSectorTags.value.filter((tag) =>
    tag.name.toLowerCase().includes(tagsFilter.value.toLowerCase()),
  );
});

const currentSectorSelectedTags = computed({
  get() {
    const sectorUuid = currentSectorData.value.uuid;
    return sectorSelectedTags.value[sectorUuid] || [];
  },
  set(value) {
    const sectorUuid = currentSectorData.value.uuid;
    sectorSelectedTags.value[sectorUuid] = value;
  },
});

// Disclaimer computed properties
const shouldShowDisclaimer = computed(() => {
  return currentSectorData.value.queue.required_tags !== undefined;
});

const disclaimerType = computed(() => {
  return currentSectorData.value.queue.required_tags
    ? 'attention'
    : 'informational';
});

const disclaimerTitle = computed(() => {
  const titleKey = currentSectorData.value.queue.required_tags
    ? 'bulk_close.required_tags_title'
    : 'bulk_close.optional_tags_title';

  return i18n.global.t(titleKey, {
    sector: currentSectorData.value.name,
  });
});

const disclaimerDescription = computed(() => {
  const descriptionKey = currentSectorData.value.queue.required_tags
    ? 'bulk_close.required_tags_description'
    : 'bulk_close.optional_tags_description';

  return i18n.global.tc(descriptionKey, currentSectorData.value.rooms.length, {
    count: currentSectorData.value.rooms.length,
  });
});

// Loading state
const isLoadingBulkClose = ref(false);

// Modal title
const modalTitle = computed(() =>
  i18n.global.t('bulk_close.end_all_selected_chats'),
);

// Total rooms count across all sectors
const totalRoomsCount = computed(() => {
  return sectorsArray.value.reduce(
    (sum, sector) => sum + sector.rooms.length,
    0,
  );
});

// Button props
const primaryButtonProps = computed(() => {
  const isLastSector = currentSectorIndex.value === totalSectors.value - 1;
  const isSingleSector = totalSectors.value === 1;

  return {
    text:
      isLastSector || isSingleSector
        ? i18n.global.t('bulk_close.end_all_chats', {
            count: totalRoomsCount.value,
          })
        : i18n.global.t('bulk_close.next_sector'),
    loading: isLoadingBulkClose.value,
    disabled:
      currentSectorData.value.queue.required_tags &&
      currentSectorSelectedTags.value.length === 0,
  };
});

const secondaryButtonProps = computed(() => {
  const isFirstSector = currentSectorIndex.value === 0;
  const isMultipleSectors = totalSectors.value > 1;

  return {
    text:
      isMultipleSectors && !isFirstSector
        ? i18n.global.t('bulk_close.back')
        : i18n.global.t('cancel'),
    disabled: isLoadingBulkClose.value,
  };
});

// Load sector tags
const loadSectorTags = async () => {
  const sectorUuid = currentSectorData.value.uuid;
  const queueUuid = currentSectorData.value.queue.uuid;

  if (allSectorTags.value[sectorUuid]) {
    isLoadingTags.value = false;
    return;
  }

  isLoadingTags.value = true;

  try {
    let allTags = [];
    let nextUrl = null;

    do {
      const response = await Queue.tags(queueUuid, {
        limit: 20,
        next: nextUrl,
      });

      allTags = allTags.concat(response.results);
      nextUrl = response.next;
    } while (nextUrl);

    allSectorTags.value[sectorUuid] = allTags;
  } catch (error) {
    console.error('Error loading sector tags:', error);
  } finally {
    isLoadingTags.value = false;
  }
};

// Handle tag updates
const handleAddTags = (tags) => {
  const sectorUuid = currentSectorData.value.uuid;
  sectorToAddTags.value[sectorUuid] = tags;
};

const handleRemoveTags = (tags) => {
  const sectorUuid = currentSectorData.value.uuid;
  sectorToRemoveTags.value[sectorUuid] = tags;
};

// Navigation functions
const goToNextSector = () => {
  if (currentSectorIndex.value < totalSectors.value - 1) {
    currentSectorIndex.value++;
    tagsFilter.value = '';
    loadSectorTags();
  } else {
    executeBulkClose();
  }
};

const goToPreviousSector = () => {
  if (currentSectorIndex.value > 0) {
    currentSectorIndex.value--;
    tagsFilter.value = '';
    loadSectorTags();
  }
};

const handlePrimaryClick = () => {
  goToNextSector();
};

const handleSecondaryClick = () => {
  const isFirstSector = currentSectorIndex.value === 0;
  const isMultipleSectors = totalSectors.value > 1;

  if (isMultipleSectors && !isFirstSector) {
    goToPreviousSector();
  } else {
    emitClose();
  }
};

// Execute bulk close
const ROOMS_REFETCH_LIMIT = 30;

const refetchRoomsIfEmpty = async () => {
  const hasOngoingRooms = roomsStore.agentRooms.length > 0;
  const hasWaitingRooms = roomsStore.waitingQueue.length > 0;

  if (activeTab.value === 'ongoing' && hasOngoingRooms) return;
  if (activeTab.value === 'waiting' && hasWaitingRooms) return;

  await roomsStore.getAll({
    offset: 0,
    limit: ROOMS_REFETCH_LIMIT,
    order: roomsStore.orderBy[activeTab.value],
    roomsType: activeTab.value,
  });
};

const clearSelectionsAndClose = async () => {
  if (activeTab.value === 'ongoing') {
    roomsStore.setSelectedOngoingRooms([]);
  } else {
    roomsStore.setSelectedWaitingRooms([]);
  }

  await refetchRoomsIfEmpty();

  isLoadingBulkClose.value = false;
  emit('close');
};

const executeBulkClose = async () => {
  isLoadingBulkClose.value = true;

  // Build rooms array with selected tags
  const roomsToClose = [];

  sectorsArray.value.forEach((sectorData) => {
    const sectorUuid = sectorData.uuid;
    const selectedTags = (sectorSelectedTags.value[sectorUuid] || []).map(
      (tag) => tag.uuid,
    );

    sectorData.rooms.forEach((roomUuid) => {
      roomsToClose.push({
        uuid: roomUuid,
        tags: selectedTags,
      });
    });
  });

  // Split into batches of BULK_CLOSE_BATCH_SIZE
  const chunks = [];
  for (let i = 0; i < roomsToClose.length; i += BULK_CLOSE_BATCH_SIZE) {
    chunks.push(roomsToClose.slice(i, i + BULK_CLOSE_BATCH_SIZE));
  }

  // Execute sequentially and aggregate results
  let totalSuccess = 0;
  let totalFailed = 0;

  for (const chunk of chunks) {
    const response = await Room.bulkClose({
      rooms: chunk,
      end_by: 'mass_closure',
    });
    const { data } = response;
    totalSuccess += data?.success_count || 0;
    totalFailed += data?.failed_count || 0;
  }

  // Show a single toast based on aggregated results
  if (totalFailed === 0 && totalSuccess > 0) {
    unnnicCallAlert({
      props: {
        text: i18n.global.tc('bulk_close.success_message', totalSuccess, {
          count: totalSuccess,
        }),
        type: 'success',
      },
      seconds: 5,
    });
    clearSelectionsAndClose();
  } else if (totalFailed > 0 && totalSuccess > 0) {
    unnnicCallAlert({
      props: {
        text: i18n.global.tc(
          'bulk_close.partial_success_message',
          totalSuccess,
          { success: totalSuccess, failed: totalFailed },
        ),
        type: 'attention',
      },
      seconds: 5,
    });
    clearSelectionsAndClose();
  } else {
    unnnicCallAlert({
      props: {
        text: i18n.global.t('bulk_close.error_message'),
        type: 'error',
      },
      seconds: 5,
    });
    isLoadingBulkClose.value = false;
  }
};

const emitClose = () => {
  emit('close');
};

// Load initial sector tags
onMounted(() => {
  if (totalSectors.value > 0) {
    loadSectorTags();
  }
});

// Watch for sector changes
watch(currentSectorIndex, () => {
  loadSectorTags();
});
</script>

<style lang="scss" scoped>
.modal-close-rooms {
  :deep(.unnnic-modal-dialog__container) {
    max-width: 800px;
  }

  :deep(.modal-close-rooms__disclaimer) {
    display: flex;
  }

  &__title-container {
    display: flex;
    align-items: center;
    gap: $unnnic-space-2;
  }

  &__title-text {
    font: $unnnic-font-display-2;
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: $unnnic-spacing-md;
  }

  &__subtitle {
    font-size: $unnnic-font-size-body-lg;
    font-weight: $unnnic-font-weight-bold;
    line-height: $unnnic-line-height-md;
    color: $unnnic-color-neutral-darkest;
    margin: 0;
  }

  &__tags-list {
    display: flex;
    gap: $unnnic-spacing-sm;
    overflow: hidden auto;
    flex-wrap: wrap;
    max-height: 208px;
    scroll-snap-type: y proximity;
  }
}
</style>
