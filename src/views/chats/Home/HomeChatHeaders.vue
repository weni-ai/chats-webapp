<template>
  <section class="home-chat-headers">
    <ChatHeaderLoading
      v-show="isLoading"
      data-testid="chat-header-loading"
    />
    <UnnnicChatsHeader
      v-show="isShowingRoomHeader"
      :title="headerRoomTitle"
      :avatarClick="emitOpenRoomContactInfo"
      :titleClick="emitOpenRoomContactInfo"
      :avatarName="room?.contact.name"
      :back="isMobile ? emitBack : null"
      data-testid="chat-header"
    >
      <template #right>
        <section class="home-chat-headers__actions">
          <!-- TODO: implement ia summary  -->
          <!-- <img
            class="stars-icon"
            :src="starsIcon"
          /> -->
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
            <UnnnicIcon
              icon="history"
              size="ant"
              :clickable="room?.has_history"
              :scheme="room?.has_history ? 'neutral-cloudy' : 'neutral-soft'"
              @click="openHistory"
            />
          </UnnnicToolTip>
          <UnnnicToolTip
            v-if="
              featureFlags.active_features?.includes('weniChatsContactInfoV2')
            "
            enabled
            :text="$tc('transfer_contact', 1)"
            side="left"
          >
            <UnnnicIcon
              icon="sync_alt"
              size="ant"
              clickable
              scheme="neutral-cloudy"
              @click="openTransferModal"
            />
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
      v-if="isShowingSendFlowHeader"
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

import { useRooms } from '@/store/modules/chats/rooms';
import { useDiscussions } from '@/store/modules/chats/discussions';

import isMobile from 'is-mobile';

import ChatHeaderLoading from '@/views/loadings/chat/ChatHeader.vue';

import ChatHeaderSendFlow from '@/components/chats/chat/ChatHeaderSendFlow.vue';

import { formatContactName } from '@/utils/chats';

import starsIcon from '@/assets/icons/bi_stars.svg';

import { parseUrn } from '@/utils/room';

import ModalTransferRooms from '@/components/chats/chat/ModalTransferRooms.vue';
import { useFeatureFlag } from '@/store/modules/featureFlag';
import { useConfig } from '@/store/modules/config';
import { useProfile } from '@/store/modules/profile';

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
    return { starsIcon, isModalTransferRoomsOpened: false };
  },

  computed: {
    ...mapState(useFeatureFlag, ['featureFlags']),
    ...mapState(useRooms, {
      room: (store) => store.activeRoom,
    }),
    ...mapState(useDiscussions, {
      discussion: (store) => store.activeDiscussion,
    }),
    ...mapWritableState(useRooms, ['contactToTransfer']),
    ...mapState(useConfig, ['project']),
    ...mapState(useProfile, ['isHumanServiceProfile']),
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
    isShowingSendFlowHeader() {
      const { room, discussion, isLoading } = this;
      return room && !discussion && !room.is_24h_valid && !isLoading;
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
  &__actions {
    display: flex;
    gap: $unnnic-space-6;
    align-items: center;

    :deep(.unnnic-tooltip) {
      display: flex;
    }

    .stars-icon {
      width: $unnnic-space-5;
      height: $unnnic-space-5;
      cursor: pointer;
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
