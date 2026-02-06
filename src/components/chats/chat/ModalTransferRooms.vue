<template>
  <UnnnicDialog v-model:open="open">
    <UnnnicDialogContent size="medium">
      <UnnnicDialogHeader :closeButton="!isLoadingBulkTransfer">
        <UnnnicDialogTitle>
          {{
            bulkTransfer
              ? $t('bulk_transfer.transfer_selected_contacts')
              : $t('transfer_contact')
          }}
        </UnnnicDialogTitle>
      </UnnnicDialogHeader>
      <RoomsTransferFields
        ref="roomsTransferFields"
        v-model="selectedQueue"
        class="modal-transfer-rooms__content"
        :bulkTransfer="bulkTransfer"
        fixed
        @transfer-complete="transferComplete"
      />
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
          :text="$t('transfer')"
          type="primary"
          :loading="isLoadingBulkTransfer"
          :disabled="disabledTransferButton"
          @click="transfer()"
        />
      </UnnnicDialogFooter>
    </UnnnicDialogContent>
  </UnnnicDialog>
</template>

<script>
import RoomsTransferFields from '@/components/chats/RoomsTransferFields.vue';

export default {
  name: 'ModalTransferRooms',

  components: {
    RoomsTransferFields,
  },
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
    bulkTransfer: {
      type: Boolean,
      default: false,
    },
  },

  emits: ['close', 'update:modelValue'],

  data() {
    return {
      selectedQueue: [],
      isLoadingBulkTransfer: false,
    };
  },

  computed: {
    open: {
      get() {
        return this.modelValue;
      },
      set(value) {
        this.$emit('update:modelValue', value);
      },
    },
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
      this.emitClose();
    },

    emitClose() {
      this.$emit('close');
    },
  },
};
</script>

<style lang="scss">
.modal-transfer-rooms {
  &__content {
    padding: $unnnic-space-6;
  }
}
</style>
