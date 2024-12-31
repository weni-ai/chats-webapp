<template>
  <section class="chats-layout-footer-button">
    <section
      v-if="selectedRoomsToTransfer.length >= 1"
      class="chats-layout-footer-button__bulk-transfer"
    >
      <UnnnicButton
        class="chats-layout-footer-button__button"
        :text="$tc('transfer_contact', selectedRoomsToTransfer.length)"
        iconLeft="read_more"
        type="primary"
        size="small"
        @click="handleModalBulkTransfer"
      />
      <ModalBulkTransfer
        v-if="isModalBulkTransferOpened"
        @close="handleModalBulkTransfer"
      />
    </section>
    <UnnnicButton
      v-else
      class="chats-layout-footer-button__button"
      :text="$t('chats.see_history')"
      iconLeft="history"
      type="secondary"
      size="small"
      @click="navigate('closed-rooms')"
    />
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
    navigate(name) {
      this.$router.push({
        name,
      });
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
