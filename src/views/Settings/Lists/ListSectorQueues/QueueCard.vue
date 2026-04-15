<template>
  <section
    class="queue-card"
    @click="emit('edit', props.queue)"
  >
    <section class="queue-card__info">
      <p class="queue-card__title">
        {{ props.queue.name }}
      </p>
    </section>
    <section
      class="queue-card__actions"
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
            @click="showModalConfirmDelete()"
          />
        </UnnnicPopoverContent>
      </UnnnicPopover>
    </section>
    <ModalConfirmDelete
      v-if="openModalConfirmDelete"
      v-model="openModalConfirmDelete"
      :title="titleModalConfirmDelete"
      :description="$t('config_chats.queues.delete_this_queue')"
      :confirmText="props.queue.name"
      :isLoading="isLoadingDelete"
      @confirm="deleteQueue"
      @cancel="openModalConfirmDelete = false"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { UnnnicToastManager, UnnnicCallAlert } from '@weni/unnnic-system';

import ModalConfirmDelete from '@/components/ModalConfirmDelete.vue';

import QueueService from '@/services/api/resources/settings/queue';

import type { Queue } from '@/types/Queue';

import i18n from '@/plugins/i18n';

const { t } = i18n.global;

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
const openModalConfirmDelete = ref(false);
const isLoadingDelete = ref(false);

const titleModalConfirmDelete = computed(() => {
  return `${t('delete')} ${props.queue.name}`;
});

const showModalConfirmDelete = () => {
  openPopover.value = false;
  openModalConfirmDelete.value = true;
};

const emitEdit = () => {
  openPopover.value = false;
  emit('edit', props.queue);
};

const deleteQueue = async () => {
  try {
    isLoadingDelete.value = true;
    await QueueService.delete(props.queue.uuid);
    UnnnicCallAlert({
      props: {
        text: t('config_chats.queues.message.delete_success'),
        type: 'success',
      },
    });
    emit('delete', props.queue);
  } catch (error) {
    console.error(error);
    UnnnicToastManager.error(
      t('config_chats.queues.message.delete_error'),
      '',
      {
        button: {
          text: t('try_again'),
          action: () => showModalConfirmDelete(),
        },
      },
    );
  } finally {
    openModalConfirmDelete.value = false;
    isLoadingDelete.value = false;
  }
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
