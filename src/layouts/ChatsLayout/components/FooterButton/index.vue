<template>
  <section
    class="chats-layout-footer-button"
    data-testid="footer-button-container"
  >
    <section
      v-if="selectedRoomsToTransfer.length >= 1"
      class="chats-layout-footer-button__bulk-transfer"
      data-testid="bulk-transfer-section"
    >
      <UnnnicButton
        v-if="isTransferContactsEnabled"
        class="chats-layout-footer-button__button"
        :text="$t('transfer')"
        :type="isOnlyBulkTransferBtn ? 'primary' : 'secondary'"
        size="large"
        data-testid="transfer-button"
        @click="handleModalTransferRooms"
      />
      <UnnnicButton
        v-if="isBulkCloseContactsEnabled"
        class="chats-layout-footer-button__button chats-layout-footer-button__button--end"
        :text="$t('end')"
        type="primary"
        size="large"
        data-testid="end-button"
        @click="handleModalCloseRooms"
      />
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
    ...mapState(useRooms, ['selectedRoomsToTransfer']),
    ...mapState(useConfig, ['project']),
    isOnlyBulkTransferBtn() {
      return this.isTransferContactsEnabled && !this.isBulkCloseContactsEnabled;
    },
    isTransferContactsEnabled() {
      return this.project.config?.can_use_bulk_transfer;
    },
    isBulkCloseContactsEnabled() {
      return this.project.config?.can_use_bulk_close;
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

  &__bulk-transfer {
    display: flex;
    gap: $unnnic-spacing-xs;
  }

  &__button {
    flex: 1;
  }
}
</style>
