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
        class="chats-layout-footer-button__button"
        :text="$tc('transfer_contact', selectedRoomsToTransfer.length)"
        iconLeft="read_more"
        type="primary"
        size="small"
        data-testid="transfer-button"
        @click="handleModalBulkTransfer"
      />
      <ModalBulkTransfer
        v-if="isModalBulkTransferOpened"
        data-testid="bulk-transfer-modal"
        @close="handleModalBulkTransfer"
      />
    </section>
  </section>
</template>

<script>
import { mapState } from 'pinia';

import { useRooms } from '@/store/modules/chats/rooms';

import ModalBulkTransfer from '@/components/chats/chat/ModalBulkTransfer.vue';
export default {
  name: 'ChatsLayoutFooterButton',

  components: {
    ModalBulkTransfer,
  },

  data() {
    return {
      isModalBulkTransferOpened: false,
    };
  },

  computed: {
    ...mapState(useRooms, ['selectedRoomsToTransfer']),
  },
  methods: {
    handleModalBulkTransfer() {
      this.isModalBulkTransferOpened = !this.isModalBulkTransferOpened;
    },
  },
};
</script>

<style lang="scss" scoped>
.chats-layout-footer-button {
  padding-left: $unnnic-spacing-xs;
  &__button {
    width: 100%;
  }
}
</style>
