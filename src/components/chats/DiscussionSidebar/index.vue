<template>
  <div class="discussion-sidebar__container">
    <DiscussionSidebarLoading v-show="isSidebarLoading" />
    <AsideSlotTemplate
      v-show="!isSidebarLoading"
      class="discussion-sidebar"
    >
      <template #header>
        <header class="discussion-sidebar__header">
          <p>
            {{
              isOwnDiscussion
                ? $t('discussions.about.title')
                : $t('chats.closed_chats.contact_history')
            }}
          </p>
        </header>
      </template>
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
          data-testid="update-room-messages-button"
          :loading="isMessagesRoomLoading"
          @click="updateRoomMessages"
        />
      </section>
    </AsideSlotTemplate>
  </div>
</template>

<script>
import { mapActions, mapState } from 'pinia';

import { useProfile } from '@/store/modules/profile';
import { useDiscussions } from '@/store/modules/chats/discussions';
import { useRooms } from '@/store/modules/chats/rooms';
import { useRoomMessages } from '@/store/modules/chats/roomMessages';

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
    };
  },

  computed: {
    ...mapState(useProfile, ['me']),
    ...mapState(useDiscussions, {
      discussion: (store) => store.activeDiscussion,
      discussionsCount: (store) => store.discussionsCount,
    }),
  },

  watch: {
    discussion: {
      immediate: true,
      async handler() {
        if (this.discussion) await this.loadDiscussionDetails();
      },
    },
  },

  methods: {
    ...mapActions(useDiscussions, {
      getDiscussionDetails: 'getDiscussionDetails',
      deleteDiscussion: 'delete',
      setDiscussionsCount: 'setDiscussionsCount',
    }),
    ...mapActions(useRooms, ['setActiveRoom', 'setActiveRoom']),
    ...mapActions(useRoomMessages, ['getRoomMessages']),

    async loadDiscussionDetails() {
      this.isSidebarLoading = true;

      this.details = await this.getDiscussionDetails();

      this.isOwnDiscussion = this.me.email === this.details.created_by?.email;
      await this.setActiveRoom({
        uuid: this.details.room,
        contact: { name: this.details.contact },
        queue: {
          sector: {},
        },
      });
      this.isSidebarLoading = false;
    },

    updateRoomMessages() {
      this.isMessagesRoomLoading = true;
      this.getRoomMessages({
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
  },
};
</script>

<style lang="scss" scoped>
.discussion-sidebar__container {
  height: 100%;

  overflow: hidden;
}

.discussion-sidebar {
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $unnnic-space-2;
    font: $unnnic-font-display-3;
    color: $unnnic-color-fg-emphasized;
    border-bottom: 1px solid $unnnic-color-border-soft;
    height: 55px;
  }
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
    &__content {
      padding: $unnnic-space-6;
    }

    &__description {
      color: $unnnic-color-fg-base;
      font: $unnnic-font-body;
      margin: 0;
    }
  }
}
</style>
