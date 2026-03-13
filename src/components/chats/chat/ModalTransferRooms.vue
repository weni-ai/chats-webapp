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

<script>
import { mapState } from 'pinia';

import { useRooms } from '@/store/modules/chats/rooms';

import RoomsTransferFields from '@/components/chats/RoomsTransferFields.vue';
import i18n from '@/plugins/i18n';

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
    ...mapState(useRooms, [
      'selectedOngoingRooms',
      'selectedWaitingRooms',
      'activeTab',
    ]),

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
    currentSelectedRooms() {
      return this.activeTab === 'ongoing'
        ? this.selectedOngoingRooms
        : this.selectedWaitingRooms;
    },
    disclaimerDescription() {
      return i18n.global.tc(
        'bulk_transfer.selected_chats_count',
        this.currentSelectedRooms.length,
        { count: this.currentSelectedRooms.length },
      );
    },
  },

  methods: {
    transfer() {
      this.isLoadingBulkTransfer = true;

      this.$refs.roomsTransferFields.transfer();
    },

    transferComplete(status) {
      this.isLoadingBulkTransfer = false;
      if (status !== 'error') {
        this.emitClose();
      }
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
    display: flex;
    flex-direction: column;
    gap: $unnnic-spacing-md;
    padding: $unnnic-space-6;
  }

  &__disclaimer {
    display: flex;
  }
}
</style>
