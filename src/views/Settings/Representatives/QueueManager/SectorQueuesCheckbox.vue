<template>
  <section class="sector-queues-checkbox">
    <p
      v-if="props.isBulk"
      class="sector-queues-checkbox__bulk-description"
    >
      {{
        $t(
          'config_chats.representatives.queue_manager.sector_queues_checkbox.bulk_description',
        )
      }}
    </p>
    <h1
      v-else
      class="sector-queues-checkbox__title"
    >
      {{
        $t(
          'config_chats.representatives.queue_manager.sector_queues_checkbox.title',
        )
      }}
    </h1>
    <template
      v-for="(sector, index) in validSectors"
      :key="index"
    >
      <section class="sector-queues-checkbox__sector-block">
        <UnnnicCheckbox
          class="sector-queues-checkbox__sector-checkbox"
          :label="sector.name"
          :modelValue="
            sector.queues.every((queue) =>
              props.selectedQueues.includes(queue.uuid),
            )
          "
          @update:model-value="handleSectorSelect(sector, $event)"
        />

        <section class="sector-queues-checkbox__sector-queues">
          <UnnnicCheckbox
            v-for="queue in sector.queues"
            :key="queue.uuid"
            :modelValue="props.selectedQueues.includes(queue.uuid)"
            :label="queue.name"
            @update:model-value="handleQueueSelect(queue.uuid, $event)"
          />
        </section>
      </section>
      <hr
        v-if="index !== validSectors.length - 1"
        class="sector-queues-checkbox__divider"
      />
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';

defineOptions({
  name: 'SectorQueuesCheckbox',
});

interface Props {
  selectedQueues: string[];
  sectors: { name: string; queues: Record<string, any> }[];
  isBulk?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isBulk: false,
});

const emit = defineEmits<{
  'update:selectedQueues': [
    value: {
      currentQueues: string[];
      queuesToAdd: string[];
      queuesToRemove: string[];
    },
  ];
}>();

const validSectors = computed(() => {
  return props.sectors.filter((sector) => sector.queues.length > 0);
});

const handleSectorSelect = (sector: any, selected: boolean) => {
  if (selected) {
    const queuesToAdd = sector.queues.map((queue) => queue.uuid);
    const currentQueues = [...props.selectedQueues, ...queuesToAdd];
    emit('update:selectedQueues', {
      currentQueues,
      queuesToAdd,
      queuesToRemove: [],
    });
  } else {
    const sectorQueuesUuids = sector.queues.map((queue) => queue.uuid);
    const filteredQueues = props.selectedQueues.filter(
      (queueUuid) => !sectorQueuesUuids.includes(queueUuid),
    );
    emit('update:selectedQueues', {
      currentQueues: filteredQueues,
      queuesToAdd: [],
      queuesToRemove: sectorQueuesUuids,
    });
  }
};
const handleQueueSelect = (queueUuid: string, selected: boolean) => {
  if (selected) {
    const currentQueues = [...props.selectedQueues, queueUuid];
    emit('update:selectedQueues', {
      currentQueues,
      queuesToAdd: [queueUuid],
      queuesToRemove: [],
    });
  } else {
    const currentQueues = props.selectedQueues.filter(
      (filterQueueUuid) => queueUuid !== filterQueueUuid,
    );
    emit('update:selectedQueues', {
      currentQueues,
      queuesToAdd: [],
      queuesToRemove: [queueUuid],
    });
  }
};
</script>

<style lang="scss" scoped>
.sector-queues-checkbox {
  display: flex;
  flex-direction: column;
  gap: $unnnic-space-4;

  &__bulk-description {
    font: $unnnic-font-body;
    color: $unnnic-color-fg-base;
  }

  &__title {
    font: $unnnic-font-display-3;
    color: $unnnic-color-fg-emphasized;
  }

  &__sector-block {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-3;

    :deep(.sector-queues-checkbox__sector-checkbox) {
      .unnnic-checkbox__label {
        font: $unnnic-font-action;
        color: $unnnic-color-fg-emphasized;
      }
    }
  }

  &__sector-queues {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: $unnnic-space-4;
  }

  &__divider {
    border: 1px solid $unnnic-color-border-base;
  }
}
</style>
