<template>
  <section
    class="queue-card"
    data-testid="queue-card"
    @click="emit('edit', props.queue)"
  >
    <section class="queue-card__info">
      <p
        class="queue-card__title"
        data-testid="queue-card-title"
      >
        {{ props.queue.name }}
      </p>
    </section>
    <section
      class="queue-card__actions"
      data-testid="queue-card-actions"
      @click.stop
    >
      <UnnnicPopover
        :open="openPopover"
        @update:open="openPopover = $event"
      >
        <UnnnicPopoverTrigger>
          <UnnnicButton
            data-testid="queue-card-more-button"
            iconCenter="more_vert"
            type="tertiary"
          />
        </UnnnicPopoverTrigger>
        <UnnnicPopoverContent size="small">
          <UnnnicPopoverOption
            data-testid="queue-card-edit-option"
            :label="$t('edit')"
            icon="edit_square"
            @click="emitEdit"
          />
          <UnnnicPopoverOption
            data-testid="queue-card-delete-option"
            :label="$t('delete')"
            icon="delete"
            scheme="fg-critical"
            @click="emitDelete"
          />
        </UnnnicPopoverContent>
      </UnnnicPopover>
    </section>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import type { Queue } from '@/types/Queue';

defineOptions({
  name: 'QueueCard',
});

interface Props {
  queue: Queue;
}
const props = defineProps<Props>();

const emit = defineEmits<{
  edit: [Queue];
  delete: [Queue];
}>();

const openPopover = ref(false);

const emitEdit = () => {
  openPopover.value = false;
  emit('edit', props.queue);
};

const emitDelete = () => {
  openPopover.value = false;
  emit('delete', props.queue);
};
</script>

<style lang="scss" scoped>
.queue-card {
  display: flex;
  width: 100%;
  height: 100%;
  padding: $unnnic-space-6;

  border-radius: $unnnic-radius-2;
  border: 1px solid $unnnic-color-border-base;

  cursor: pointer;

  &__info {
    display: flex;
    align-items: center;
    gap: $unnnic-space-1;
    width: 100%;
  }
  &__title {
    font: $unnnic-font-display-3;
    color: $unnnic-color-fg-emphasized;
    flex: 1;
  }
}
</style>
