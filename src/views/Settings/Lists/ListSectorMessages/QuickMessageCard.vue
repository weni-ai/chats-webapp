<template>
  <section
    class="quick-message-card"
    @click="emit('edit', props.quickMessage)"
  >
    <section class="quick-message-card__info">
      <h1 class="quick-message-card__title">
        {{ `/${props.quickMessage.shortcut}` }}
      </h1>
      <p
        :title="props.quickMessage.text"
        class="quick-message-card__text"
      >
        {{ props.quickMessage.text }}
      </p>
    </section>
    <section
      class="quick-message-card__actions"
      @click.stop
    >
      <UnnnicPopover
        :open="openPopover"
        @update:open="openPopover = $event"
      >
        <UnnnicPopoverTrigger>
          <UnnnicButton
            iconCenter="more_vert"
            type="tertiary"
          />
        </UnnnicPopoverTrigger>
        <UnnnicPopoverContent size="small">
          <UnnnicPopoverOption
            :label="$t('edit')"
            icon="edit_square"
            @click="emitEdit"
          />
          <UnnnicPopoverOption
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

import type { QuickMessage } from '@/types/QuickMessages';

defineOptions({
  name: 'QuickMessageCard',
});
interface Props {
  quickMessage: QuickMessage;
}
const props = defineProps<Props>();

const emit = defineEmits<{
  edit: [QuickMessage];
  delete: [QuickMessage];
}>();

const openPopover = ref(false);

const emitEdit = () => {
  openPopover.value = false;
  emit('edit', props.quickMessage);
};
const emitDelete = () => {
  openPopover.value = false;
  emit('delete', props.quickMessage);
};
</script>

<style lang="scss" scoped>
.quick-message-card {
  display: flex;
  width: 100%;
  height: 100%;
  padding: $unnnic-space-6;

  border-radius: $unnnic-radius-2;
  border: 1px solid $unnnic-color-border-base;

  cursor: pointer;

  &__info {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-1;
    width: 100%;
  }
  &__title {
    font: $unnnic-font-display-3;
    color: $unnnic-color-fg-emphasized;
    flex: 1;
  }
  &__text {
    font: $unnnic-font-caption-2;
    color: $unnnic-color-fg-base;
    -webkit-line-clamp: 1;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
