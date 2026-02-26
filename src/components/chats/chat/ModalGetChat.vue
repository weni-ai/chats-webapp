<template>
  <UnnnicDialog
    :open="showModal"
    @update:open="close"
  >
    <UnnnicDialogContent size="medium">
      <section class="modal-get-chat__content">
        <UnnnicIcon
          icon="forum"
          size="xl"
        />
        <h2 class="modal-get-chat__title">{{ title }}</h2>
        <p class="modal-get-chat__description">{{ description }}</p>
      </section>
      <UnnnicDialogFooter>
        <UnnnicDialogClose>
          <UnnnicButton
            :text="$t('cancel')"
            :disabled="loadingGetChat"
            type="tertiary"
            @click="close"
          />
        </UnnnicDialogClose>
        <UnnnicButton
          :text="$t('confirm')"
          :loading="loadingGetChat"
          :disabled="loadingGetChat"
          type="primary"
          @click="getChat"
        />
      </UnnnicDialogFooter>
    </UnnnicDialogContent>
  </UnnnicDialog>
</template>

<script>
import { mapActions, mapState, mapWritableState } from 'pinia';

import { useRooms } from '@/store/modules/chats/rooms';
import { useProfile } from '@/store/modules/profile';
import { useDashboard } from '@/store/modules/dashboard';

import unnnic from '@weni/unnnic-system';

import Profile from '@/services/api/resources/profile';
import Room from '@/services/api/resources/chats/room';

export default {
  name: 'ModalGetChat',

  props: {
    showModal: {
      type: Boolean,
      required: true,
    },
    title: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      required: true,
    },
    whenGetChat: {
      type: Function,
      default: () => {},
    },
  },
  emits: ['closeModal'],

  data() {
    return {
      showModalCaughtChat: false,
      loadingGetChat: false,
    };
  },

  computed: {
    ...mapState(useRooms, {
      room: (store) => store.activeRoom,
      getRoomById: 'getRoomById',
    }),
    ...mapWritableState(useRooms, ['activeTab']),
    ...mapState(useProfile, ['me']),
    ...mapState(useDashboard, ['viewedAgent']),
  },

  watch: {
    room: {
      handler(newRoom, oldRoom) {
        if (this.showModal === true && newRoom == null) {
          this.close();
          unnnic.unnnicCallAlert({
            props: {
              text: this.$t('chats.feedback.agent_took_chat', {
                contact: oldRoom?.contact?.name,
              }),
              type: 'default',
              position: 'bottom-right',
            },
            seconds: 15,
          });
        }
      },
      deep: true,
    },
  },

  methods: {
    ...mapActions(useProfile, ['setMe']),
    ...mapActions(useRooms, ['setActiveRoom', 'addRoom']),
    ...mapActions(useDashboard, ['setViewedAgent']),

    close() {
      this.$emit('closeModal');
    },

    closeCaughtChatModal() {
      this.showModalCaughtChat = false;
    },

    openCaughtChatModal() {
      this.showModalCaughtChat = true;
    },

    async getChat() {
      try {
        this.loadingGetChat = true;
        let me = this.me.email;

        if (!me) {
          const response = await Profile.me();
          me = response.email;
          this.setMe(response);
        }

        if (this.viewedAgent.name === '') {
          await Room.getQueueRoom(this.room.uuid, me);
        } else {
          await Room.take(this.room.uuid, me);
          this.addRoom(this.room);
        }

        await this.handlingSetActiveRoom(this.room.uuid);

        if (this.room.user) {
          Room.updateReadMessages(this.room.uuid, true);
        }

        if (this.whenGetChat) this.whenGetChat();

        this.close();
      } catch (error) {
        console.error('error to get chat', error);
        unnnic.unnnicCallAlert({
          props: {
            text: this.$t('chats.get_chat_error'),
            type: 'error',
          },
        });
      } finally {
        this.loadingGetChat = false;
      }
    },

    async handlingSetActiveRoom(uuid) {
      const room = this.getRoomById(uuid);
      await this.setActiveRoom(room);
    },
  },
};
</script>

<style lang="scss" scoped>
.modal-get-chat {
  :deep(.unnnic-modal-dialog__container) {
    width: 500px;
  }
  &__content {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: $unnnic-icon-size-ant;
    padding: $unnnic-space-6;
    color: $unnnic-color-gray-500;
  }

  &__title {
    font-family: $unnnic-font-family-secondary;
    color: $unnnic-color-neutral-darkest;
    font-weight: $unnnic-font-weight-bold;
    font-size: $unnnic-font-size-title-sm;
    line-height: ($unnnic-font-size-title-sm + $unnnic-line-height-medium);
  }
}
</style>
