<template>
  <section class="queue-filter">
    <UnnnicPopover
      :open="openPopover"
      @update:open="openPopover = $event"
    >
      <UnnnicPopoverTrigger>
        <UnnnicToolTip
          class="queue-filter__tooltip"
          enabled
          :text="$t('filter.by_queue')"
          side="top"
        >
          <section class="queue-filter__trigger">
            <UnnnicIcon
              icon="filter_list"
              size="ant"
              :scheme="hasFilterQueues ? 'fg-accent' : 'fg-emphasized'"
            />
            <p
              v-if="hasFilterQueues"
              class="queue-filter__count"
            >
              ({{ filterQueues.length }})
            </p>
          </section>
        </UnnnicToolTip>
      </UnnnicPopoverTrigger>
      <UnnnicPopoverContent>
        <section class="queue-filter__content">
          <UnnnicInput
            v-model="searchQueue"
            iconLeft="search-1"
            :placeholder="$t('queues.search')"
          />
          <section
            v-if="isLoadingQueuesOptions"
            class="queue-filter__loading"
          >
            <UnnnicIconLoading />
          </section>
          <section
            v-else
            class="queue-filter__checkboxes"
          >
            <UnnnicCheckbox
              v-for="queue in queuesOptionsFiltered"
              :key="queue.value"
              :modelValue="selectedQueues.includes(queue.value)"
              :label="queue.label"
              @update:model-value="handleSelectedQueues(queue.value, $event)"
            />
          </section>
        </section>
        <UnnnicPopoverFooter>
          <UnnnicButton
            :text="$t('clear')"
            type="tertiary"
            @click="clearFilterQueues"
          />
          <UnnnicButton
            :text="$t('filter.label')"
            type="primary"
            :disabled="isLoadingQueuesOptions || !selectedQueues.length"
            @click="applyFilterQueues"
          />
        </UnnnicPopoverFooter>
      </UnnnicPopoverContent>
    </UnnnicPopover>
    <UnnnicIcon
      v-if="hasFilterQueues"
      class="queue-filter__close"
      icon="close"
      size="ant"
      clickable
      @click="clearFilterQueues()"
    />
  </section>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { cloneDeep } from 'lodash';

import { useRooms } from '@/store/modules/chats/rooms';

import QueueService from '@/services/api/resources/chats/queues';

import i18n from '@/plugins/i18n';

const roomsStore = useRooms();
const { filterQueues, activeTab } = storeToRefs(roomsStore);

const hasFilterQueues = computed(() => filterQueues.value.length > 0);

const openPopover = ref(false);
const searchQueue = ref('');
const isLoadingQueuesOptions = ref(false);
const queuesOptions = ref<{ count: number; value: string; label: string }[]>(
  [],
);
const selectedQueues = ref<string[]>([]);

const queuesOptionsFiltered = computed(() => {
  return queuesOptions.value
    .filter((queue) => {
      return queue.label
        .toLowerCase()
        .includes(searchQueue.value.toLowerCase());
    })
    .map((queue) => {
      return {
        ...queue,
        label: `${queue.label} (${i18n.global.tc('chats_count', queue.count, { count: queue.count })})`,
      };
    });
});

const getQueuesOptions = async () => {
  try {
    isLoadingQueuesOptions.value = true;
    const { sectors } = await QueueService.getQueuesToFilter();

    queuesOptions.value = sectors.flatMap((sector) => {
      return sector.queues.map((queue) => {
        const count =
          activeTab.value === 'ongoing'
            ? queue.rooms_in_progress
            : queue.rooms_in_awaiting;

        return {
          count,
          value: queue.uuid,
          label: `${sector.name} - ${queue.name}`,
        };
      });
    });
  } catch (error) {
    console.error('Error getting queues options', error);
  } finally {
    isLoadingQueuesOptions.value = false;
  }
};

const handleSelectedQueues = (queueUuid: string, isSelected: boolean) => {
  if (isSelected) {
    selectedQueues.value.push(queueUuid);
  } else {
    selectedQueues.value = selectedQueues.value.filter(
      (selectedQueueUuid) => selectedQueueUuid !== queueUuid,
    );
  }
};

const clearFilterQueues = () => {
  filterQueues.value = [];
  openPopover.value = false;
};

const applyFilterQueues = () => {
  filterQueues.value = cloneDeep(selectedQueues.value);
  openPopover.value = false;
};

const fillSelectedQueues = () => {
  selectedQueues.value = cloneDeep(filterQueues.value);
};

watch(openPopover, async () => {
  if (openPopover.value) {
    await getQueuesOptions();
    fillSelectedQueues();
  } else {
    searchQueue.value = '';
    selectedQueues.value = [];
  }
});
</script>

<style lang="scss" scoped>
.queue-filter {
  display: flex;

  &__trigger {
    display: flex;
    align-items: center;
    gap: $unnnic-space-05;
    cursor: pointer;
  }
  :deep(.queue-filter__tooltip) {
    display: flex;
  }
  &__count {
    font: $unnnic-font-body;
    color: $unnnic-color-fg-accent;
  }
  &__close {
    margin-left: $unnnic-space-05;
  }
  &__content {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-2;
  }
  &__checkboxes {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-2;
    height: 140px;
    overflow-y: auto;
  }
  &__loading {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 140px;
  }
}
</style>
