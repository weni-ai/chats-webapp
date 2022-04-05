<template>
  <div class="chat-group" :class="{ disabled }">
    <header>
      <h2>{{ chatGroup.name }}</h2>
      <unnnic-icon icon="add-1" size="xs" />
    </header>

    <ul class="chats" :class="{ filled }">
      <li v-for="chat in chatGroup.chats" :key="chat.id">
        <user-chat :chat="chat" @click="selectChat(chat)" :filled="filled" :disabled="disabled" />
      </li>
    </ul>
  </div>
</template>

<script>
import { unnnicIcon } from '@weni/unnnic-system';

import UserChat from './UserChat';

export default {
  name: 'ChatGroup',

  components: {
    unnnicIcon,
    UserChat,
  },

  props: {
    chatGroup: {
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

  methods: {
    selectChat(chat) {
      this.$store.commit('chats/setActiveChat', { ...chat, active: true });
    },
  },
};
</script>

<style lang="scss" scoped>
.chat-group {
  &.disabled {
    header {
      h2 {
        color: $unnnic-color-neutral-lightest;
      }
    }
  }

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    padding: 0 0 0.5rem 0.5rem;
    h2 {
      font-size: $unnnic-font-size-body-md;
      font-weight: $unnnic-font-weight-regular;
      line-height: 1.25rem;
      color: $unnnic-color-neutral-cloudy;
    }
  }

  ul.chats {
    list-style-type: none;
    margin: 0;
    padding: 0;

    &.filled {
      background: $unnnic-color-background-carpet;
    }

    li + li {
      padding-top: $unnnic-inline-xs;
    }
  }
}
</style>
