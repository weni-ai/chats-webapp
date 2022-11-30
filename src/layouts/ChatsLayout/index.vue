<template>
  <section
    class="chats-layout unnnic-grid-giant"
    style="padding: 0px 0px; padding-left: 10px; overflow-y: hidden"
  >
    <slot name="room-list" v-if="!this.contactList">
      <div
        :style="{ display: 'flex', flexDirection: 'column', height: '100vh' }"
        class="unnnic-grid-span-3"
      >
        <preferences-bar :style="{ margin: '16px 0 0 0px' }" />

        <div class="template-message-button">
          <unnnic-button-icon
            size="small"
            icon="pencil-write-1"
            style="width: 100%"
            @click="showContactsList"
          />
        </div>

        <the-room-list class="room-list" :disabled="disabledChatList" />
      </div>
    </slot>

    <slot name="template-message" v-if="this.contactList">
      <div
        :style="{ display: 'flex', flexDirection: 'column', height: '100vh' }"
        class="unnnic-grid-span-3"
      >
        <contact-list class="room-list" :disabled="disabledChatList" @close="closeContactList" />
      </div>
    </slot>

    <main
      v-bind:class="[isAsideSlotInUse ? 'unnnic-grid-span-6' : 'unnnic-grid-span-9']"
      style="height: 100vh"
    >
      <slot />
    </main>

    <section
      v-if="isAsideSlotInUse"
      class="aside unnnic-grid-span-3"
      style="border: 1px solid #e2e6ed"
    >
      <slot name="aside" />
    </section>
    <section v-if="sectors === 0">
      <modal-on-boarding-chats />
    </section>
    <div v-show="isLoading && disabledChatList">
      <skeleton-loading />
    </div>
  </section>
</template>

<script>
import PreferencesBar from '@/components/PreferencesBar.vue';
import ModalOnBoardingChats from '@/components/ModalOnBoardingChats.vue';
import Sector from '@/services/api/resources/settings/sector.js';
import SkeletonLoading from '@/views/loadings/chats.vue';
import TheRoomList from './components/TheRoomList';
import ContactList from './components/TemplateMessages';

export default {
  name: 'ChatsLayout',

  components: {
    PreferencesBar,
    TheRoomList,
    ModalOnBoardingChats,
    SkeletonLoading,
    ContactList,
  },

  props: {
    disabledChatList: {
      type: Boolean,
      default: false,
    },
    totalOfSectors: {},
  },
  methods: {
    showContactsList() {
      this.contactList = true;
    },
    closeContactList() {
      this.contactList = false;
    },
  },
  data: () => ({
    sectors: {},
    isLoading: false,
    contactList: false,
  }),
  async mounted() {
    try {
      this.isLoading = true;
      const response = await Sector.countOfSectorsAvaible();
      this.sectors = response.sector_count;
      this.isLoading = false;
    } catch (error) {
      this.isLoading = false;
      console.log(error);
    }
  },

  computed: {
    isAsideSlotInUse() {
      return !!this.$slots.aside;
    },
  },
};
</script>

<style lang="scss" scoped>
.chats-layout {
  height: 100%;
  max-height: 100%;
  display: flex;

  .room-list {
    margin: {
      top: $unnnic-spacing-inline-sm;
      right: 0;
      bottom: 0;
    }
    overflow-y: auto;
  }

  main {
    flex: 1 1;
    height: 100%;
  }

  .aside {
    height: 100vh;

    background: $unnnic-color-background-grass;
  }
  .template-message-button {
    margin-top: $unnnic-spacing-stack-sm;
    margin-bottom: $unnnic-spacing-stack-sm;
  }
}
</style>
