<template>
  <section>
    <UnnnicModal
      :showModal="showModal"
      @close="close"
      :text="title"
      :description="description"
      modalIcon="forum"
      scheme="neutral-darkest"
    >
      <template #options>
        <UnnnicButton
          :text="$t('cancel')"
          type="tertiary"
          @click="close"
        />
        <UnnnicButton
          :text="$t('confirm')"
          type="primary"
          @click="getChat"
        />
      </template>
    </UnnnicModal>
  </section>
</template>

<script>
import { mapState } from 'vuex';

import { unnnicCallAlert } from '@weni/unnnic-system';

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
      required: false,
    },
    description: {
      type: String,
      required: true,
    },
    whenGetChat: {
      type: Function,
      required: false,
    },
  },

  data() {
    return {
      showModalCaughtChat: false,
    };
  },

  computed: {
    ...mapState({
      room: (state) => state.chats.rooms.activeRoom,
      me: (state) => state.profile.me,
      viewedAgent: (state) => state.dashboard.viewedAgent,
    }),
  },

  watch: {
    room: {
      handler(newRoom, oldRoom) {
        if (this.showModal === true && newRoom == null) {
          this.close();
          unnnicCallAlert({
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
      if (this.whenGetChat) this.whenGetChat();
      let me = this.me.email;

      if (!me) {
        const response = await Profile.me();
        me = response.email;
        this.$store.commit('profile/setMe', response);
      }

      if (this.viewedAgent.name === '') {
        await Room.getQueueRoom(this.room.uuid, me);
      } else {
        await Room.take(this.room.uuid, me);
      }

      await this.setActiveRoom(this.room.uuid);
      if (this.room.user) {
        Room.updateReadMessages(this.room.uuid, true);
      }

      this.close();
    },

    async setActiveRoom(uuid) {
      const room = this.$store.getters['chats/rooms/getRoomById'](uuid);
      await this.$store.dispatch('chats/rooms/setActiveRoom', room);
    },
  },
};
</script>
