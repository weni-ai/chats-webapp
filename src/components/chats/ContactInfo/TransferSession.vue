<template>
  <AsideSlotTemplateSection class="transfer-session__section">
    <ModalProgressBarFalse
      v-if="showTransferProgressBar"
      :title="$t('contact_info.transfering_chat')"
      type="secondary"
      @close="closeTransferProgressBar"
    />

    <p
      class="transfer-session__title"
      data-testid="transfer-session-title"
    >
      {{ $tc('transfer_contact') }}
    </p>
    <section class="transfer-section">
      <RoomsTransferFields
        ref="roomsTransferFields"
        v-model="selectedQueue"
        size="sm"
        data-testid="transfer-fields"
        @transfer-complete="transferComplete"
      />

      <UnnnicButton
        class="transfer-session__handler"
        :text="$t('transfer')"
        type="primary"
        size="small"
        :disabled="selectedQueue.length === 0 || isViewMode"
        :loading="isLoading"
        data-testid="transfer-button"
        @click="transferRooms"
      />
    </section>
  </AsideSlotTemplateSection>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue';
import { storeToRefs } from 'pinia';
import isMobile from 'is-mobile';

import { useRooms } from '@/store/modules/chats/rooms';

import AsideSlotTemplateSection from '@/components/layouts/chats/AsideSlotTemplate/Section.vue';
import RoomsTransferFields from '@/components/chats/RoomsTransferFields.vue';
import ModalProgressBarFalse from '@/components/ModalProgressBarFalse.vue';

interface QueueOption {
  label: string;
  value: string;
  sector_uuid: string;
  queue_name: string;
}

interface Props {
  isViewMode?: boolean;
}

withDefaults(defineProps<Props>(), {
  isViewMode: false,
});

const emit = defineEmits<{
  'transferred-contact': [];
}>();

defineOptions({ name: 'TransferSession' });

const roomsStore = useRooms();
const { activeRoom } = storeToRefs(roomsStore);

const isMobileDevice = ref(isMobile());

const selectedQueue = ref<QueueOption[]>([]);

const isLoading = ref(false);
const showTransferProgressBar = ref(false);

const roomsTransferFields = ref<InstanceType<
  typeof RoomsTransferFields
> | null>(null);

if (activeRoom.value?.uuid) {
  roomsStore.setContactToTransfer(activeRoom.value.uuid);
}

onBeforeUnmount(() => {
  roomsStore.setContactToTransfer('');
});

async function transferRooms() {
  isLoading.value = true;

  if (isMobileDevice.value) {
    await handleFalseTransferProgressBar();
  }

  roomsTransferFields.value?.transfer();
}

function transferComplete(status: 'success' | 'error') {
  isLoading.value = false;

  if (status === 'success') {
    resetActiveRoom();
  }
}

function resetActiveRoom() {
  roomsStore.setActiveRoom(null);
}

function handleFalseTransferProgressBar(): Promise<void> {
  showTransferProgressBar.value = true;

  return new Promise<void>((resolve) => {
    const waitForCloseTransferProgressBar = () => {
      if (showTransferProgressBar.value) {
        setTimeout(waitForCloseTransferProgressBar, 100);
      } else {
        resolve();
      }
    };

    waitForCloseTransferProgressBar();
  }).then(() => {
    emit('transferred-contact');
  });
}

function closeTransferProgressBar() {
  showTransferProgressBar.value = false;
}

defineExpose({
  selectedQueue,
  isLoading,
  showTransferProgressBar,
  isMobile: isMobileDevice,
  transferRooms,
  transferComplete,
  resetActiveRoom,
  handleFalseTransferProgressBar,
  closeTransferProgressBar,
});
</script>

<style lang="scss" scoped>
.transfer-session {
  &__section {
    padding: $unnnic-space-2;
  }

  &__title {
    margin-bottom: $unnnic-space-3;

    font-weight: $unnnic-font-weight-bold;
    font-size: $unnnic-font-size-body-gt;
    color: $unnnic-color-fg-base;
  }

  &__handler {
    margin-top: $unnnic-space-3;
    width: 100%;
  }
}
</style>
