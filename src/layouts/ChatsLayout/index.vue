<template>
  <section class="chats-layout">
    <slot name="room-list">
      <div :style="{ display: 'flex', flexDirection: 'column' }">
        <preferences-bar :style="{ margin: '16px 0 0 16px' }" />

        <the-room-list class="room-list" :disabled="disabledChatList" />
      </div>
    </slot>

    <main>
      <slot />
    </main>

    <section v-if="isAsideSlotInUse" class="aside">
      <slot name="aside" />
    </section>
    <section v-if="sectors === 0">
      <modal-on-boarding-chats />
    </section>
    <div>
      <skeleton-loading v-show="isLoading" />
    </div>
  </section>
</template>

<script>
import PreferencesBar from '@/components/PreferencesBar.vue';
import ModalOnBoardingChats from '@/components/ModalOnBoardingChats.vue';
import Sector from '@/services/api/resources/settings/sector.js';
import SkeletonLoading from '@/views/loadings/chats.vue';
import TheRoomList from './components/TheRoomList';

export default {
  name: 'ChatsLayout',

  components: {
    PreferencesBar,
    TheRoomList,
    ModalOnBoardingChats,
    SkeletonLoading,
  },

  props: {
    disabledChatList: {
      type: Boolean,
      default: false,
    },
    totalOfSectors: {},
  },
  data: () => ({
    sectors: {},
    isLoading: false,
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
    overflow-y: auto;
    margin: {
      top: $unnnic-spacing-inline-sm;
      right: 0;
      bottom: 0;
      left: $unnnic-spacing-inline-sm;
    }
  }

  main {
    flex: 1 1;
    height: 100%;
  }

  .aside {
    height: 100%;
    width: 20.625rem;

    background: $unnnic-color-background-grass;
    padding-left: $unnnic-spacing-inline-xs;
  }
}
</style>
