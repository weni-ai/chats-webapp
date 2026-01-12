<template>
  <section class="home-chat-headers">
    <ChatHeaderLoading
      v-show="isLoading"
      data-testid="chat-header-loading"
    />
    <UnnnicChatsHeader
      v-show="isShowingRoomHeader"
      :title="headerRoomTitle || `[${$t('unnamed_contact')}]`"
      :avatarClick="emitOpenRoomContactInfo"
      :titleClick="emitOpenRoomContactInfo"
      :avatarName="room?.contact.name || '-'"
      :back="isMobile ? emitBack : null"
      data-testid="chat-header"
    >
      <template #right>
        <section class="home-chat-headers__actions">
          <UnnnicToolTip
            v-if="enableRoomSummary"
            enabled
            :text="
              openActiveRoomSummary
                ? $t('chats.summary.close_summary_tooltip')
                : $t('chats.summary.open_summary_tooltip')
            "
            side="left"
            class="home-chat-headers__summary-icon-tooltip"
          >
            <section
              class="home-chat-headers__icon"
              :class="{
                'home-chat-headers__summary-icon--open': openActiveRoomSummary,
              }"
            >
              <UnnnicIcon
                icon="bi:stars"
                clickable
                :scheme="openActiveRoomSummary ? 'gray-900' : 'gray-500'"
                size="ant"
                @click="openActiveRoomSummary = !openActiveRoomSummary"
              />
            </section>
          </UnnnicToolTip>
          <UnnnicToolTip
            enabled
            :text="'Search in conversation'"
            side="left"
            class="home-chat-headers__search-messages-icon-tooltip"
          >
            <section
              class="home-chat-headers__icon"
              :class="{
                'home-chat-headers__search-messages-icon--open':
                  showSearchMessagesDrawer,
              }"
            >
              <UnnnicIcon
                icon="search"
                clickable
                scheme="gray-900"
                size="ant"
                @click="showSearchMessagesDrawer = !showSearchMessagesDrawer"
              />
            </section>
          </UnnnicToolTip>
          <UnnnicToolTip
            v-if="
              featureFlags.active_features?.includes('weniChatsContactInfoV2')
            "
            enabled
            :text="
              room?.has_history
                ? $t('contact_info.see_contact_history')
                : $t('contact_info.no_contact_history')
            "
            side="left"
          >
            <section class="home-chat-headers__icon">
              <UnnnicIcon
                icon="history"
                size="ant"
                :clickable="room?.has_history"
                :scheme="room?.has_history ? 'neutral-cloudy' : 'neutral-soft'"
                @click="openHistory"
              />
            </section>
          </UnnnicToolTip>
          <UnnnicToolTip
            v-if="
              featureFlags.active_features?.includes('weniChatsContactInfoV2')
            "
            enabled
            :text="$tc('transfer_contact', 1)"
            side="left"
          >
            <section class="home-chat-headers__icon">
              <UnnnicIcon
                icon="sync_alt"
                size="ant"
                clickable
                scheme="neutral-cloudy"
                @click="openTransferModal"
              />
            </section>
          </UnnnicToolTip>
          <UnnnicButton
            v-if="showCloseChatButton"
            type="secondary"
            size="small"
            @click="emitOpenModalCloseChat"
          >
            {{ $t('end_chat') }}
          </UnnnicButton>
        </section>
      </template>
    </UnnnicChatsHeader>
    <UnnnicChatsHeader
      v-show="isShowingDiscussionHeader"
      class="home-chat-headers__discussion"
      :title="headerDiscussionTitle"
      :subtitle="headerDiscussionSubtitle"
      avatarIcon="forum"
      size="small"
      :back="isMobile ? emitBack : null"
      data-testid="discussion-header"
    />
    <ChatHeaderSendFlow
      v-if="isShowingSendFlowHeader && !openActiveRoomSummary"
      data-testid="chat-header-send-flow"
      @send-flow="emitOpenFlowsTrigger"
    />
    <ModalTransferRooms
      v-if="isModalTransferRoomsOpened"
      @close="closeTransferModal()"
    />
  </section>
</template>

<script>
import { format as dateFnsFormat, subYears as dateFnsSubYears } from 'date-fns';
import { mapState, mapWritableState } from 'pinia';
import isMobile from 'is-mobile';

import { useRooms } from '@/store/modules/chats/rooms';
import { useDiscussions } from '@/store/modules/chats/discussions';
import { useFeatureFlag } from '@/store/modules/featureFlag';
import { useConfig } from '@/store/modules/config';
import { useProfile } from '@/store/modules/profile';

import ChatHeaderLoading from '@/views/loadings/chat/ChatHeader.vue';
import ChatHeaderSendFlow from '@/components/chats/chat/ChatHeaderSendFlow.vue';
import ModalTransferRooms from '@/components/chats/chat/ModalTransferRooms.vue';

import { formatContactName } from '@/utils/chats';
import { parseUrn } from '@/utils/room';
import { useRoomMessages } from '@/store/modules/chats/roomMessages';

export default {
  name: 'HomeChatHeaders',

  components: {
    ChatHeaderLoading,
    ChatHeaderSendFlow,
    ModalTransferRooms,
  },

  props: {
    isLoading: {
      type: Boolean,
      default: false,
    },
  },
  emits: [
    'openRoomContactInfo',
    'openModalCloseChat',
    'openFlowsTrigger',
    'back',
  ],

  data() {
    return { isModalTransferRoomsOpened: false };
  },

  computed: {
    ...mapState(useFeatureFlag, ['featureFlags']),
    ...mapState(useRooms, {
      room: (store) => store.activeRoom,
      isLoadingCanSendMessageStatus: (store) =>
        store.isLoadingCanSendMessageStatus,
      isCanSendMessageActiveRoom: (store) => store.isCanSendMessageActiveRoom,
    }),
    ...mapState(useDiscussions, {
      discussion: (store) => store.activeDiscussion,
    }),
    ...mapState(useConfig, {
      enableRoomSummary: (store) => store.project?.config?.has_chats_summary,
      project: (store) => store.project,
    }),
    ...mapState(useProfile, ['isHumanServiceProfile']),

    ...mapWritableState(useRooms, [
      'contactToTransfer',
      'openActiveRoomSummary',
    ]),
    ...mapWritableState(useRoomMessages, ['showSearchMessagesDrawer']),

    ...mapState(useConfig, {
      enableRoomSummary: (store) => store.project?.config?.has_chats_summary,
    }),

    isMobile() {
      return isMobile();
    },

    isShowingRoomHeader() {
      const { room, discussion, isLoading } = this;
      return room && !discussion && !isLoading;
    },
    isShowingDiscussionHeader() {
      const { discussion, isLoading } = this;
      return discussion && !isLoading;
    },
    isActiveFeatureIs24hValidOptimization() {
      return this.featureFlags.active_features?.includes(
        'weniChatsIs24hValidOptimization',
      );
    },
    isCanSendMessage() {
      return this.isActiveFeatureIs24hValidOptimization
        ? this.isCanSendMessageActiveRoom && !this.isLoadingCanSendMessageStatus
        : this.room?.is_24h_valid;
    },
    isShowingSendFlowHeader() {
      const { room, discussion, isLoading } = this;
      return (
        room &&
        !discussion &&
        !this.isCanSendMessage &&
        !isLoading &&
        !this.isLoadingCanSendMessageStatus
      );
    },

    headerRoomTitle() {
      return formatContactName(this.room);
    },
    headerDiscussionTitle() {
      const { discussion } = this;
      return discussion?.subject || '';
    },
    headerDiscussionSubtitle() {
      const { discussion } = this;
      return `${this.$tc('discussions.title')} ${this.$t('about')} ${
        discussion?.contact
      }`;
    },
    showCloseChatButton() {
      if (
        !this.isHumanServiceProfile ||
        this.project.config?.can_close_chats_in_queue
      )
        return true;

      return !!this.room.user;
    },
  },

  methods: {
    emitOpenRoomContactInfo() {
      this.$emit('openRoomContactInfo');
    },
    emitOpenModalCloseChat() {
      this.$emit('openModalCloseChat');
    },
    emitOpenFlowsTrigger() {
      this.$emit('openFlowsTrigger');
    },
    emitBack() {
      return this.$emit('back');
    },
    openHistory() {
      const { plataform, contactNum } = parseUrn(this.room);
      const protocol = this.room.protocol;
      const contactUrn =
        plataform === 'whatsapp' ? contactNum.replace('+', '') : contactNum;

      const A_YEAR_AGO = dateFnsFormat(
        dateFnsSubYears(new Date(), 1),
        'yyyy-MM-dd',
      );

      this.$router.push({
        name: 'closed-rooms',
        query: {
          contactUrn,
          protocol,
          startDate: A_YEAR_AGO,
          from: this.room.uuid,
        },
      });
    },
    openTransferModal() {
      this.contactToTransfer = this.room.uuid;
      this.isModalTransferRoomsOpened = true;
    },
    closeTransferModal() {
      this.contactToTransfer = '';
      this.isModalTransferRoomsOpened = false;
    },
  },
};
</script>

<style lang="scss" scoped>
.home-chat-headers {
  &__icon {
    width: 38px;
    height: 38px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: $unnnic-radius-2;
  }
  &__search-messages-icon {
    &--open {
      background-color: rgba(136, 147, 168, 0.2);
    }
  }
  &__summary-icon {
    &--open {
      background-color: $unnnic-color-purple-100;
      &::after {
        content: '';
        position: fixed;
        top: 67px;
        transform: rotate(-45deg);
        width: $unnnic-space-3;
        height: $unnnic-space-3;
        background-color: $unnnic-color-purple-100;
        border-radius: $unnnic-space-1;
      }
    }
  }
  &__actions {
    display: flex;
    gap: $unnnic-space-2;
    align-items: center;

    :deep(.unnnic-tooltip) {
      display: flex;
    }
  }

  &__discussion {
    :deep(.unnnic-chats-header) {
      .unnnic-chats-header__avatar-icon {
        background-color: $unnnic-color-aux-purple-500;

        [class*='unnnic-icon'] {
          color: $unnnic-color-weni-50;
        }
      }
    }
  }
}
</style>
