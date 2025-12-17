<template>
  <UnnnicModalDialog
    :modelValue="true"
    :title="
      bulkTransfer
        ? $t('bulk_transfer.transfer_selected_contacts')
        : $t('transfer_contact')
    "
    class="modal-transfer-rooms"
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
    @primary-button-click="transfer()"
    @update:model-value="emitClose()"
  >
    <RoomsTransferFields
      ref="roomsTransferFields"
      v-model="selectedQueue"
      :bulkTransfer="bulkTransfer"
      fixed
      @transfer-complete="transferComplete"
    />
  </UnnnicModalDialog>
</template>

<script>
import RoomsTransferFields from '@/components/chats/RoomsTransferFields.vue';

export default {
  name: 'ModalTransferRooms',

  components: {
    RoomsTransferFields,
  },
  props: {
    bulkTransfer: {
      type: Boolean,
      default: false,
    },
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
    transfer() {
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

<style lang="scss">
.modal-transfer-rooms {
  min-height: 450px;
}
</style>
