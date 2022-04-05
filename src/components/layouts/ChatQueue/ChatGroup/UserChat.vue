<template>
  <div
    class="container"
    :class="{ active: chat.id === activeChat.id, disabled }"
    @click="$emit('click')"
    @keypress.enter="$emit('click')"
  >
    <user-avatar
      :username="chat.username"
      :active="chat.id === activeChat.id"
      size="xl"
      :off="disabled"
    />

    <div class="content">
      <h3 class="username">{{ chat.username }}</h3>
      <div class="last-message">
        {{ chat.lastMessage }}
      </div>
    </div>

    <span v-if="chat.unreadMessages !== 0" class="unread-messages" :class="{ filled }">
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
    disabled: {
      type: Boolean,
      default: false,
    },
    filled: {
      type: Boolean,
      default: false,
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
    border-radius: $unnnic-border-radius-sm;
    background: rgba($unnnic-color-brand-weni, $unnnic-opacity-level-extra-light);
  }

  &.disabled {
    .content {
      .username {
        color: $unnnic-color-neutral-clean;
      }

      .last-message {
        color: $unnnic-color-neutral-lightest;
      }
    }

    .unread-messages {
      color: $unnnic-color-neutral-clean;
    }
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

    width: 1.25rem;
    height: 1.25rem;
    border-radius: 50%;
    font-size: $unnnic-font-size-body-sm;

    background: $unnnic-color-background-grass;
    color: $unnnic-color-aux-purple;

    &.filled {
      background: $unnnic-color-neutral-snow;
    }
  }
}
</style>
