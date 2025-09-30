<template>
  <UnnnicModalDialog
    :modelValue="true"
    :title="$t('bulk_transfer.transfer_selected_contacts')"
    :showCloseIcon="!isLoadingBulkTransfer"
    :primaryButtonProps="{
      text: $t('transfer'),
      loading: isLoadingBulkTransfer,
      disabled: disabledTransferButton,
    }"
    :secondaryButtonProps="{
      text: $t('cancel'),
      disabled: isLoadingBulkTransfer,
    }"
    :persistent="isLoadingBulkTransfer"
    data-testid="modal-bulk-transfer"
    @secondary-button-click="emitClose()"
    @primary-button-click="bulkTransfer()"
    @update:model-value="emitClose()"
  >
    <RoomsTransferFields
      ref="roomsTransferFields"
      v-model="selectedQueue"
      bulkTransfer
      fixed
      @transfer-complete="transferComplete"
    />
  </UnnnicModalDialog>
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

    emitClose() {
      this.$emit('close');
    },
  },
};
</script>
