<template>
  <div
    class="container"
    :class="{ active: chat.id === activeChat.id }"
    @click="$emit('click')"
    @keypress.enter="$emit('click')"
  >
    <user-avatar :active="!!chat.active" />

    <div class="content">
      <h3 class="username">{{ chat.username }}</h3>
      <div class="last-message">
        {{ chat.lastMessage }}
      </div>
    </div>

    <span class="unread-messages">
      {{ chat.unreadMessages }}
    </span>
  </div>
</template>

<script>
import { mapState } from 'vuex';

import UserAvatar from '@/components/UserAvatar';

export default {
  name: 'UserChat',

  components: {
    UserAvatar,
  },

  props: {
    chat: {
      type: Object,
      required: true,
    },
  },

  computed: {
    ...mapState({
      activeChat: (state) => state.chats.activeChat || {},
    }),
  },
};
</script>

<style lang="scss" scoped>
.container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.5rem;
  cursor: pointer;

  width: 16rem;

  &.active {
    padding: 0.25rem 0.5rem;
    border-radius: $unnnic-border-radius-sm;
    background: rgba($unnnic-color-brand-weni, $unnnic-opacity-level-extra-light);
  }

  .content {
    display: flex;
    flex-flow: column wrap;
    margin-right: auto;

    .username {
      font-size: $unnnic-font-size-body-md;
      font-weight: $unnnic-font-weight-regular;
    }

    .last-message {
      font-size: $unnnic-font-size-body-sm;
      font-weight: $unnnic-font-weight-regular;
    }
  }

  .unread-messages {
    display: flex;
    justify-content: center;
    align-items: center;
    background: $unnnic-color-background-grass;

    width: 1.25rem;
    height: 1.25rem;
    border-radius: 50%;

    font-size: $unnnic-font-size-body-sm;
    color: $unnnic-color-brand-weni;
  }
}
</style>
