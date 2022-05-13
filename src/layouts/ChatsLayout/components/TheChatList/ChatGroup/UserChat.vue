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
      <h3 class="username" :class="{ bold: hasUnreadMessages }">
        {{ chat.username }}
      </h3>
      <div class="additional-information" :class="{ bold: hasUnreadMessages }">
        <span v-if="waitingTime !== 0"> Aguardando há {{ waitingTime }} minutos </span>
        <span v-else>
          {{ chat.lastMessage }}
        </span>
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

const ONE_MINUTE_IN_MILLISECONDS = 60000;

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

  mounted() {
    const randomPeriodInMilliseconds = Math.ceil(Math.random() * 30 + 1) * 1000;

    if (this.chat.waitingTime) {
      this.waitingTime = this.chat.waitingTime;
      this.timer = setInterval(() => {
        this.waitingTime += 1;
        // ensures that all chats waiting times don't update at same time
      }, ONE_MINUTE_IN_MILLISECONDS + randomPeriodInMilliseconds);
    }
  },

  destroyed() {
    setInterval(this.timer);
  },

  data: () => ({
    waitingTime: 0,
    timer: null,
  }),

  computed: {
    ...mapState({
      activeChat: (state) => state.chats.activeChat || {},
    }),
    hasUnreadMessages() {
      return this.chat.unreadMessages > 0;
    },
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

      .additional-information {
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

    & .bold {
      font-weight: $unnnic-font-weight-bold;
    }

    .username {
      color: $unnnic-color-neutral-darkest;
      font-size: $unnnic-font-size-body-md;
    }

    .additional-information {
      color: $unnnic-color-neutral-cloudy;
      font-size: $unnnic-font-size-body-sm;
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
