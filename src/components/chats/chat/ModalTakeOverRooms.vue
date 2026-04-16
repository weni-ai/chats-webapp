<template>
  <UnnnicDialog v-model:open="open">
    <UnnnicDialogContent size="medium">
      <UnnnicDialogHeader>
        <UnnnicDialogTitle>
          {{ $t('bulk_take.title') }}
        </UnnnicDialogTitle>
      </UnnnicDialogHeader>
      <section class="modal-take-over-rooms__content">
        <UnnnicDisclaimer
          class="modal-take-over-rooms__disclaimer"
          type="informational"
          :description="disclaimerDescription"
          data-testid="take-over-disclaimer"
        />
        <p class="modal-take-over-rooms__description">
          {{ $t('bulk_take.confirm_take_over_selected') }}
        </p>
      </section>
      <UnnnicDialogFooter>
        <UnnnicDialogClose>
          <UnnnicButton
            :text="$t('cancel')"
            type="tertiary"
            :disabled="isLoadingBulkTake"
            data-testid="cancel-button"
          />
        </UnnnicDialogClose>
        <UnnnicButton
          :text="$t('bulk_take.take_over_all')"
          type="primary"
          :loading="isLoadingBulkTake"
          data-testid="take-over-button"
          @click="executeBulkTake"
        />
      </UnnnicDialogFooter>
    </UnnnicDialogContent>
  </UnnnicDialog>
</template>

<script setup>
import { ref, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { unnnicCallAlert } from '@weni/unnnic-system';
import i18n from '@/plugins/i18n';

import { useRooms } from '@/store/modules/chats/rooms';
import Room from '@/services/api/resources/chats/room';

const BULK_TAKE_BATCH_SIZE = 200;

const emit = defineEmits(['close']);

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: true,
  },
});

const open = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    if (!value) {
      emitClose();
    }
  },
});

const roomsStore = useRooms();
const { selectedWaitingRooms } = storeToRefs(roomsStore);

const currentSelectedRooms = computed(() => selectedWaitingRooms.value);

const disclaimerDescription = computed(() =>
  i18n.global.tc(
    'bulk_take.selected_chats_count',
    currentSelectedRooms.value.length,
    { count: currentSelectedRooms.value.length },
  ),
);

const isLoadingBulkTake = ref(false);

const ROOMS_REFETCH_LIMIT = 30;

const refetchRoomsIfEmpty = async () => {
  const hasWaitingRooms = roomsStore.waitingQueue.length > 0;
  if (hasWaitingRooms) return;

  await roomsStore.getAll({
    offset: 0,
    limit: ROOMS_REFETCH_LIMIT,
    order: roomsStore.orderBy.waiting,
    roomsType: 'waiting',
  });
};

const clearSelectionsAndClose = async () => {
  isLoadingBulkTake.value = false;
  emit('close');

  roomsStore.setSelectedWaitingRooms([]);
  await refetchRoomsIfEmpty();
};

const executeBulkTake = async () => {
  isLoadingBulkTake.value = true;

  const roomUuids = [...currentSelectedRooms.value];

  const chunks = [];
  for (let i = 0; i < roomUuids.length; i += BULK_TAKE_BATCH_SIZE) {
    chunks.push(roomUuids.slice(i, i + BULK_TAKE_BATCH_SIZE));
  }

  let totalSuccess = 0;
  let totalFailed = 0;

  for (const chunk of chunks) {
    const response = await Room.bulkTake({ rooms: chunk });
    const { data } = response;
    totalSuccess += data?.success_count || 0;
    totalFailed += data?.failed_count || 0;
  }

  if (totalFailed === 0 && totalSuccess > 0) {
    unnnicCallAlert({
      props: {
        text: i18n.global.tc('bulk_take.success_message', totalSuccess, {
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
          'bulk_take.partial_success_message',
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
        text: i18n.global.t('bulk_take.error_message'),
        type: 'error',
      },
      seconds: 5,
    });
    isLoadingBulkTake.value = false;
  }
};

const emitClose = () => {
  emit('close');
};
</script>

<style lang="scss" scoped>
.modal-take-over-rooms {
  &__content {
    display: flex;
    flex-direction: column;
    gap: $unnnic-spacing-md;
    padding: $unnnic-space-6;
  }

  &__disclaimer {
    display: flex;
  }

  &__description {
    font-size: $unnnic-font-size-body-lg;
    line-height: $unnnic-line-height-md;
    color: $unnnic-color-fg-emphasized;
    margin: 0;
  }
}
</style>
