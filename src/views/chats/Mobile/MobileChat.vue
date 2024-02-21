<template>
  <contact-info
    v-if="showRoomContactInfo"
    @close="handleRoomContactInfo"
    @transferred-contact="emitTransferredContact"
  />
  <home-chat
    class="mobile-chat"
    v-else
    @open-room-contact-info="handleRoomContactInfo"
    @close-room-contact-info="handleRoomContactInfo"
    @handle-show-quick-messages="handleQuickMessagesModal"
  />
</template>

<script>
import HomeChat from '@/views/chats/Home/HomeChat';
import ContactInfo from '@/components/chats/ContactInfo';

export default {
  name: 'MobileChat',
  components: {
    HomeChat,
    ContactInfo,
  },
  data() {
    return {
      showRoomContactInfo: false,
      showQuickMessagesModal: false,
    };
  },
  methods: {
    handleRoomContactInfo() {
      this.showRoomContactInfo = !this.showRoomContactInfo;
    },
    handleQuickMessagesModal() {
      this.showQuickMessagesModal = !this.showQuickMessagesModal;
    },

    emitTransferredContact() {
      this.$emit('transferred-contact');
    },
  },
};
</script>

<style lang="scss" scoped>
.mobile-chat {
  background-color: $unnnic-color-background-lightest;
}
</style>
