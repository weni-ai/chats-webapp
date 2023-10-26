<template>
  <unnnic-modal
    :showModal="showModal"
    @close="close"
    :text="title"
    :description="description"
    modal-icon="messages-bubble-1"
    scheme="neutral-darkest"
  >
    <template #options>
      <unnnic-button :text="$t('cancel')" type="tertiary" @click="close" />
      <unnnic-button :text="$t('confirm')" type="secondary" @click="getChat" />
    </template>
  </unnnic-modal>
</template>

<script>
import { mapState } from 'vuex';

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

  computed: {
    ...mapState({
      room: (state) => state.chats.rooms.activeRoom,
      me: (state) => state.profile.me,
    }),
  },

  methods: {
    close() {
      this.$emit('closeModal');
    },

    async getChat() {
      if (this.whenGetChat) this.whenGetChat();
      let me = this.me.email;

      if (!me) {
        const response = await Profile.me();
        me = response.email;
        this.$store.commit('profile/setMe', response);
      }

      await Room.take(this.room.uuid, me);
      await this.setActiveRoom(this.room.uuid);
      if (this.room.user) {
        Room.updateReadMessages(this.room.uuid, true);
      }

      this.close();
    },

    async setActiveRoom(uuid) {
      const room = this.$store.getters['chats/rooms/getRoomById'](uuid);
      if (!room) this.$router.push({ name: 'home' });
      await this.$store.dispatch('chats/rooms/setActiveRoom', room);
    },
  },
};
</script>
