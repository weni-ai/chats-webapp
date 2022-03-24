<template>
  <div class="chat-group">
    <header>
      <h2>{{ chatGroup.name }}</h2>
      <unnnic-icon icon="add-1" size="xs" />
    </header>

    <ul class="chats" :class="{ 'background-darkest': backgroundDarkest }">
      <li v-for="chat in chatGroup.chats" :key="chat.id">
        <user-chat :chat="chat" />
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
    backgroundDarkest: {
      type: Boolean,
      default: false,
    },
    chatGroup: {
      type: Object,
      required: true,
    },
  },
};
</script>

<style lang="scss" scoped>
.chat-group {
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

    &.background-darkest {
      background: $unnnic-color-background-carpet;
    }

    li + li {
      padding-top: $unnnic-inline-xs;
    }
  }
}
</style>
