<template>
  <header class="active-chat-header">
    <user-avatar size="lg" class="avatar" @click="showContactInfo" />
    <span class="username" @click="showContactInfo" @keypress.enter="showContactInfo">
      {{ chat.username }}
    </span>
    <span @click="$emit('close')" @keypress.enter="$emit('close')">
      <unnnic-icon-svg class="close-button" icon="close-1" size="sm" />
    </span>
  </header>
</template>

<script>
import UserAvatar from '@/components/UserAvatar';

export default {
  name: 'ActiveChatHeader',

  components: {
    UserAvatar,
  },

  props: {
    chat: {
      type: Object,
      required: true,
    },
  },

  methods: {
    showContactInfo() {
      if (this.chat.username === 'Atendente') return;

      this.$emit('show-contact-info');
    },
  },
};
</script>

<style lang="scss" scoped>
.active-chat-header {
  display: flex;
  align-items: center;
  gap: 1rem;

  .avatar,
  .username,
  .close-button {
    cursor: pointer;
  }

  .username {
    flex: 1;
    font-weight: 400;
    line-height: 1.5rem;
    color: $unnnic-color-neutral-dark;
  }
}
</style>
