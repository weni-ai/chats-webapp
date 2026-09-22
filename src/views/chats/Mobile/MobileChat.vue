<template>
  <ContactInfo
    v-if="showRoomContactInfo"
    @close="closeRoomContactInfo"
    @transferred-contact="emitTransferredContact"
  />
  <div
    v-else
    class="mobile-chat"
  >
    <HomeChat
      @open-room-contact-info="openRoomContactInfo"
      @close-room-contact-info="closeRoomContactInfo"
      @handle-show-quick-messages="handleQuickMessagesModal"
    />
    <SearchMessages
      v-if="showSearchMessagesDrawer"
      class="mobile-chat__search"
      @close="showSearchMessagesDrawer = false"
    />
  </div>
</template>

<script>
import { mapWritableState } from 'pinia';

import { useRoomMessages } from '@/store/modules/chats/roomMessages';

import HomeChat from '@/views/chats/Home/HomeChat.vue';
import ContactInfo from '@/components/chats/ContactInfo/index.vue';
import SearchMessages from '@/components/chats/SearchMessages/index.vue';

export default {
  name: 'MobileChat',
  components: {
    HomeChat,
    ContactInfo,
    SearchMessages,
  },
  emits: ['transferred-contact'],
  data() {
    return {
      showRoomContactInfo: false,
      showQuickMessagesModal: false,
    };
  },
  computed: {
    ...mapWritableState(useRoomMessages, [
      'showSearchMessagesDrawer',
      'toScrollMessage',
    ]),
  },
  watch: {
    toScrollMessage(message) {
      if (!message || !this.showSearchMessagesDrawer) return;

      this.$nextTick(() => {
        this.showSearchMessagesDrawer = false;
      });
    },
  },
  beforeUnmount() {
    this.showSearchMessagesDrawer = false;
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
  position: relative;
  height: 100%;
  background-color: $unnnic-color-bg-base-soft;

  &__search {
    position: absolute;
    inset: 0;
    z-index: 2;
    background-color: $unnnic-color-bg-base;
  }
}
</style>
