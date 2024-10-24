<template>
  <UnnnicModal
    data-testid="modal-bulk-transfer"
    :text="$t('bulk_transfer.transfer_selected_contacts')"
    class="modal-bulk-transfer"
    :closeIcon="false"
  >
    <RoomsTransferFields
      ref="roomsTransferFields"
      v-model="selectedQueue"
      bulkTransfer
      @transfer-complete="transferComplete"
    />

    <template #options>
      <UnnnicButton
        data-testid="cancel-button"
        :text="$t('cancel')"
        type="tertiary"
        size="large"
        @click="$emit('close')"
      />
      <UnnnicButton
        data-testid="transfer-button"
        :text="$t('transfer')"
        type="primary"
        size="large"
        :disabled="disabledTransferButton"
        :loading="isLoadingBulkTransfer"
        @click="bulkTransfer()"
      />
    </template>
  </UnnnicModal>
</template>

<script>
import RoomsTransferFields from '@/components/chats/RoomsTransferFields.vue';

export default {
  name: 'ModalBulkTransfer',

  components: {
    RoomsTransferFields,
  },
  emits: ['close'],

  data() {
    return {
      selectedQueue: [],
      isLoadingBulkTransfer: false,
    };
  },

  computed: {
    disabledTransferButton() {
      return (
        this.selectedQueue.length === 0 || this.selectedQueue[0]?.value === ''
      );
    },
  },

  methods: {
    bulkTransfer() {
      this.isLoadingBulkTransfer = true;

      this.$refs.roomsTransferFields.transfer();
    },

    transferComplete() {
      this.isLoadingBulkTransfer = false;
      this.$emit('close');
    },
  },
};
</script>

<style lang="scss" scoped>
.modal-bulk-transfer {
  :deep(.unnnic-modal-container-background) {
    overflow: visible;

    .unnnic-modal-container-background-body {
      padding-top: $unnnic-spacing-giant;

      &-description-container {
        padding-bottom: 0;
      }

      &-description,
      &-description-container {
        overflow: visible;
      }
    }
  }
}
</style>
