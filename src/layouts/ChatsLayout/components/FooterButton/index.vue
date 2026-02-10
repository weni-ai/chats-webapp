<template>
  <section
    class="chats-layout-footer-button"
    data-testid="footer-button-container"
  >
    <section
      v-if="currentSelectedRooms.length >= 1"
      class="chats-layout-footer-button__bulk-transfer"
      data-testid="bulk-transfer-section"
    >
      <UnnnicToolTip
        v-if="isTransferContactsEnabled"
        enabled
        class="chats-layout-footer-button__tooltip"
        :text="$t('transfer_all_selected_chats')"
        side="top"
      >
        <UnnnicButton
          class="chats-layout-footer-button__button"
          :text="$t('transfer')"
          :type="isOnlyBulkTransferBtn ? 'primary' : 'secondary'"
          size="large"
          data-testid="transfer-button"
          @click="handleModalTransferRooms"
        />
      </UnnnicToolTip>
      <UnnnicToolTip
        v-if="isBulkCloseContactsEnabled"
        enabled
        class="chats-layout-footer-button__tooltip"
        :text="$t('end_all_selected_chats_tooltip')"
        side="top"
      >
        <UnnnicButton
          class="chats-layout-footer-button__button chats-layout-footer-button__button--end"
          :text="$t('end')"
          type="primary"
          size="large"
          data-testid="end-button"
          @click="handleModalCloseRooms"
        />
      </UnnnicToolTip>
      <ModalTransferRooms
        v-if="isModalTransferRoomsOpened"
        bulkTransfer
        data-testid="bulk-transfer-modal"
        @close="handleModalTransferRooms"
      />
      <ModalCloseRooms
        v-if="isModalCloseRoomsOpened"
        bulkClose
        data-testid="bulk-close-modal"
        @close="handleModalCloseRooms"
      />
    </section>
  </section>
</template>

<script>
import { mapState } from 'pinia';

import { useRooms } from '@/store/modules/chats/rooms';
import { useConfig } from '@/store/modules/config';

import ModalTransferRooms from '@/components/chats/chat/ModalTransferRooms.vue';
import ModalCloseRooms from '@/components/chats/chat/ModalCloseRooms.vue';

export default {
  name: 'ChatsLayoutFooterButton',

  components: {
    ModalTransferRooms,
    ModalCloseRooms,
  },

  data() {
    return {
      isModalTransferRoomsOpened: false,
      isModalCloseRoomsOpened: false,
    };
  },

  computed: {
    ...mapState(useRooms, [
      'selectedOngoingRooms',
      'selectedWaitingRooms',
      'activeTab',
    ]),
    ...mapState(useConfig, ['project']),

    currentSelectedRooms() {
      return this.activeTab === 'ongoing'
        ? this.selectedOngoingRooms
        : this.selectedWaitingRooms;
    },
    isOnlyBulkTransferBtn() {
      return this.isTransferContactsEnabled && !this.isBulkCloseContactsEnabled;
    },
    isTransferContactsEnabled() {
      return (
        this.project.config?.can_use_bulk_transfer &&
        this.activeTab === 'ongoing'
      );
    },
    isBulkCloseContactsEnabled() {
      const canBulkClose = this.project.config?.can_use_bulk_close;
      const blockCloseInQueue = this.project.config?.can_close_chats_in_queue;

      if (!canBulkClose) return false;

      // Se bloqueia close na fila, só permitir em ongoing
      if (blockCloseInQueue && this.activeTab === 'waiting') {
        return false;
      }

      return true;
    },
  },
  methods: {
    handleModalTransferRooms() {
      this.isModalTransferRoomsOpened = !this.isModalTransferRoomsOpened;
    },
    handleModalCloseRooms() {
      this.isModalCloseRoomsOpened = !this.isModalCloseRoomsOpened;
    },
  },
};
</script>

<style lang="scss" scoped>
.chats-layout-footer-button {
  padding-left: $unnnic-spacing-xs;

  &__tooltip {
    display: flex;
    width: 100%;
  }

  &__bulk-transfer {
    display: flex;
    gap: $unnnic-spacing-xs;
  }

  &__button {
    flex: 1;
  }
}
</style>
