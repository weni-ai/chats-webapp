<template>
  <div class="discussion-sidebar__container">
    <DiscussionSidebarLoading v-show="isSidebarLoading" />
    <AsideSlotTemplate
      class="discussion-sidebar"
      v-show="!isSidebarLoading"
      :title="
        isOwnDiscussion
          ? $t('discussions.about.title')
          : $t('chats.closed_chats.contact_history')
      "
      :icon="isOwnDiscussion ? 'chat_info' : 'history'"
      iconScheme="neutral-dark"
      :close="isOwnDiscussion ? handleEndDiscussionModal : null"
    >
      <DiscussionAbout
        v-if="isOwnDiscussion"
        :details="details"
      />
      <section
        v-else
        class="discussion-sidebar__room"
      >
        <RoomMessages />
        <UnnnicButton
          :text="$t('update')"
          type="primary"
          iconLeft="refresh"
          size="small"
          :loading="isMessagesRoomLoading"
          @click="updateRoomMessages"
        />
      </section>

      <UnnnicModal
        v-if="isEndDiscussionModalOpen"
        @close="handleEndDiscussionModal"
        :text="$t('discussions.close.title')"
        :description="$t('discussions.close.description')"
        modalIcon="error"
        scheme="feedback-yellow"
        class="discussion-sidebar__end-modal"
      >
        <template #options>
          <UnnnicButton
            :text="$t('cancel')"
            type="tertiary"
            @click="handleEndDiscussionModal"
          />
          <UnnnicButton
            :text="$t('end')"
            type="primary"
            @click="endDiscussion"
            :loading="isEndDiscussionLoading"
          />
        </template>
      </UnnnicModal>
    </AsideSlotTemplate>
  </div>
</template>

<script>
import { mapState } from 'vuex';

import DiscussionSidebarLoading from '@/views/loadings/chat/DiscussionSidebar.vue';
import AsideSlotTemplate from '@/components/layouts/chats/AsideSlotTemplate/index.vue';
import RoomMessages from '@/components/chats/chat/RoomMessages.vue';
import DiscussionAbout from './DiscussionAbout.vue';

export default {
  name: 'DiscussionSidebar',

  components: {
    DiscussionSidebarLoading,
    AsideSlotTemplate,
    DiscussionAbout,
    RoomMessages,
  },

  data: () => {
    return {
      isSidebarLoading: true,
      isMessagesRoomLoading: false,

      details: null,
      isOwnDiscussion: false,

      isEndDiscussionModalOpen: false,
      isEndDiscussionLoading: false,
    };
  },

  computed: {
    ...mapState({
      me: (state) => state.profile.me,
      discussion: (state) => state.chats.discussions.activeDiscussion,
    }),
  },

  methods: {
    async loadDiscussionDetails() {
      this.isSidebarLoading = true;

      this.details = await this.$store.dispatch(
        'chats/discussions/getDiscussionDetails',
      );
      this.isOwnDiscussion = this.me.email === this.details.created_by?.email;
      await this.$store.dispatch('chats/rooms/setActiveRoom', {
        uuid: this.details.room,
        contact: { name: this.details.contact },
      });
      this.isSidebarLoading = false;
    },

    async updateRoomMessages() {
      this.isMessagesRoomLoading = true;
      await this.$store
        .dispatch('chats/roomMessages/getRoomMessages', {
          offset: 0,
          limit: 20,
        })
        .then(() => {
          this.isMessagesRoomLoading = false;
        })
        .catch((error) => {
          console.error(error);
        });
    },

    handleEndDiscussionModal() {
      this.isEndDiscussionModalOpen = !this.isEndDiscussionModalOpen;
    },

    async endDiscussion() {
      this.isEndDiscussionLoading = true;
      await this.$store.dispatch('chats/rooms/setActiveRoom', null);
      await this.$store.dispatch('chats/discussions/delete');
      this.handleEndDiscussionModal();
    },
  },

  watch: {
    discussion: {
      immediate: true,
      async handler() {
        await this.loadDiscussionDetails();
      },
    },
  },
};
</script>

<style lang="scss" scoped>
.discussion-sidebar__container {
  height: 100%;

  overflow: hidden;
}

.discussion-sidebar {
  &__room {
    padding: $unnnic-spacing-xs;
    padding-bottom: $unnnic-spacing-sm;

    display: flex;
    flex-direction: column;
    gap: $unnnic-spacing-xs;

    overflow: hidden;

    :deep(.chat-messages) {
      padding: 0;
      padding-right: $unnnic-spacing-xs;
    }
  }

  &__end-modal {
    :deep(.unnnic-modal-container-background-button) {
      padding-top: 0;
    }
  }

  // .aside-slot-template__sections {
  //   display: flex;
  //   width: 100%;
  // }
}
</style>
