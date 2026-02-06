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
        iconLeft="sync_alt"
        type="primary"
        size="small"
        data-testid="transfer-button"
        @click="handleModalTransferRooms"
      />
      <ModalTransferRooms
        v-if="isModalTransferRoomsOpened"
        v-model="isModalTransferRoomsOpened"
        bulkTransfer
        data-testid="bulk-transfer-modal"
        @close="handleModalTransferRooms"
      />
    </section>
  </section>
</template>

<script>
import { mapState } from 'pinia';

import { useRooms } from '@/store/modules/chats/rooms';

import ModalTransferRooms from '@/components/chats/chat/ModalTransferRooms.vue';
export default {
  name: 'ChatsLayoutFooterButton',

  components: {
    ModalTransferRooms,
  },

  data() {
    return {
      isModalTransferRoomsOpened: false,
    };
  },

  computed: {
    ...mapState(useRooms, ['selectedRoomsToTransfer']),
  },
  methods: {
    handleModalTransferRooms() {
      this.isModalTransferRoomsOpened = !this.isModalTransferRoomsOpened;
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
