<template>
  <ContactInfo
    v-if="showRoomContactInfo"
    @close="closeRoomContactInfo"
    @transferred-contact="emitTransferredContact"
  />
  <HomeChat
    v-else
    class="mobile-chat"
    @open-room-contact-info="openRoomContactInfo"
    @close-room-contact-info="closeRoomContactInfo"
    @handle-show-quick-messages="handleQuickMessagesModal"
  />
</template>

<script>
import HomeChat from '@/views/chats/Home/HomeChat.vue';
import ContactInfo from '@/components/chats/ContactInfo/index.vue';

export default {
  name: 'MobileChat',
  components: {
    HomeChat,
    ContactInfo,
  },
  emits: ['transferred-contact'],
  data() {
    return {
      showRoomContactInfo: false,
      showQuickMessagesModal: false,
    };
  },
  methods: {
    openRoomContactInfo() {
      this.showRoomContactInfo = true;
    },
    closeRoomContactInfo() {
      this.showRoomContactInfo = false;
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
