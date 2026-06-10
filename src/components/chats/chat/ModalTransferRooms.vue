<template>
  <UnnnicDialog :open="open">
    <UnnnicDialogContent
      size="medium"
      click.self
    >
      <UnnnicDialogHeader :closeButton="false">
        <UnnnicDialogTitle>
          {{
            bulkTransfer
              ? $t('transfer_all_selected_chats')
              : $t('transfer_contact')
          }}
        </UnnnicDialogTitle>
      </UnnnicDialogHeader>
      <section class="modal-transfer-rooms__content">
        <UnnnicDisclaimer
          v-if="bulkTransfer"
          class="modal-transfer-rooms__disclaimer"
          type="informational"
          :description="disclaimerDescription"
          data-testid="transfer-disclaimer"
        />
        <RoomsTransferFields
          ref="roomsTransferFields"
          v-model="selectedQueue"
          :bulkTransfer="bulkTransfer"
          fixed
          @transfer-complete="transferComplete"
        />
      </section>
      <UnnnicDialogFooter>
        <UnnnicDialogClose>
          <UnnnicButton
            :text="$t('cancel')"
            type="tertiary"
            :disabled="isLoadingBulkTransfer"
            @click="emitClose()"
          />
        </UnnnicDialogClose>
        <UnnnicButton
          :text="
            bulkTransfer ? $t('bulk_transfer.transfer_all') : $t('transfer')
          "
          type="primary"
          :loading="isLoadingBulkTransfer"
          :disabled="disabledTransferButton"
          @click="transfer()"
        />
      </UnnnicDialogFooter>
    </UnnnicDialogContent>
  </UnnnicDialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';

import { useRooms } from '@/store/modules/chats/rooms';

import RoomsTransferFields from '@/components/chats/RoomsTransferFields.vue';
import i18n from '@/plugins/i18n';

interface QueueOption {
  label: string;
  value: string;
  sector_uuid: string;
  queue_name: string;
}

interface Props {
  modelValue: boolean;
  bulkTransfer?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  bulkTransfer: false,
});

const emit = defineEmits<{
  close: [];
  'update:modelValue': [value: boolean];
}>();

defineOptions({ name: 'ModalTransferRooms' });

const roomsStore = useRooms();
const { selectedOngoingRooms, selectedWaitingRooms, activeTab } =
  storeToRefs(roomsStore);

const selectedQueue = ref<QueueOption[]>([]);
const isLoadingBulkTransfer = ref(false);
const roomsTransferFields = ref<InstanceType<
  typeof RoomsTransferFields
> | null>(null);

const open = computed<boolean>({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const disabledTransferButton = computed(
  () =>
    selectedQueue.value.length === 0 || selectedQueue.value[0]?.value === '',
);

const currentSelectedRooms = computed(() =>
  activeTab.value === 'ongoing'
    ? selectedOngoingRooms.value
    : selectedWaitingRooms.value,
);

const disclaimerDescription = computed(() =>
  i18n.global.tc(
    'bulk_transfer.selected_chats_count',
    currentSelectedRooms.value.length,
    { count: currentSelectedRooms.value.length },
  ),
);

function transfer() {
  isLoadingBulkTransfer.value = true;
  roomsTransferFields.value?.transfer();
}

function transferComplete(status: 'success' | 'error') {
  isLoadingBulkTransfer.value = false;
  if (status !== 'error') {
    emitClose();
  }
}

function emitClose() {
  emit('close');
}

defineExpose({
  selectedQueue,
  isLoadingBulkTransfer,
  disabledTransferButton,
  currentSelectedRooms,
  disclaimerDescription,
  transfer,
  transferComplete,
  emitClose,
});
</script>

<style lang="scss">
.modal-transfer-rooms {
  &__content {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-6;
    padding: $unnnic-space-6;
  }

  &__disclaimer {
    display: flex;
  }
}
</style>
