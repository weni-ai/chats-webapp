<template>
  <header class="active-chat-header">
    <user-avatar size="lg" />
    <span class="username">{{ chat.username }}</span>
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
};
</script>

<style lang="scss" scoped>
.active-chat-header {
  display: flex;
  align-items: center;
  gap: 1rem;

  .avatar {
    display: inline-flex;
    align-items: center;
    justify-content: center;

    width: 2rem;
    height: 2rem;

    border-radius: 0.125rem;
    border: solid 1px $unnnic-color-aux-pink;

    background: $unnnic-color-aux-pink;
    color: $unnnic-color-neutral-snow;
  }

  .username {
    flex: 1;
    font-weight: 400;
    line-height: 1.5rem;
    color: $unnnic-color-neutral-dark;
  }

  .close-button {
    cursor: pointer;
  }
}
</style>
