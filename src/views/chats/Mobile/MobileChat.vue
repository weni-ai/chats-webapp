<template>
  <contact-info v-if="showRoomContactInfo" @close="closeRoomContactInfo" />
  <home-chat
    class="mobile-chat"
    v-else
    @open-room-contact-info="openRoomContactInfo"
    @close-room-contact-info="closeRoomContactInfo"
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
    };
  },
  methods: {
    openRoomContactInfo() {
      this.showRoomContactInfo = true;
    },
    closeRoomContactInfo() {
      this.showRoomContactInfo = false;
    },
  },
};
</script>

<style lang="scss" scoped>
.mobile-chat {
  background-color: $unnnic-color-background-lightest;
}
</style>
