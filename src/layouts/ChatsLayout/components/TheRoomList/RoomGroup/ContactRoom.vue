<template>
  <div
    class="container"
    :class="{
      active: room.uuid === activeRoomId,
      disabled,
      'new-messages': newMessages?.length,
    }"
    @click="$emit('click')"
    @keypress.enter="$emit('click')"
    :tabindex="0"
  >
    <user-avatar
      :username="room.contact.name"
      :photo-url="!!usePhoto ? room.contact.photo_url : ''"
      :active="room.uuid === activeRoomId"
      size="xl"
      :off="disabled"
      style="min-width: 2.2rem"
    />

    <div class="content">
      <h3 class="username ellipsis" :title="room.contact.name" :class="{ bold: hasUnreadMessages }">
        {{ room.contact.name }}
      </h3>
      <div class="additional-information" :class="{ bold: hasUnreadMessages }">
        <p v-if="waitingTime !== 0" class="ellipsis">
          {{ $t('waiting_for.minutes', waitingTime) }}
        </p>
        <p
          v-else
          class="ellipsis"
          :title="newMessages?.[newMessages.length - 1]?.text || room?.last_message || ''"
        >
          <template v-if="newMessages?.length">
            {{ newMessages[newMessages.length - 1].text }}
          </template>
          <template v-if="!newMessages?.length">
            {{ room.last_message }}
          </template>
        </p>
      </div>
    </div>

    <span
      v-if="room.unread_msgs || newMessages?.length"
      class="unread-messages"
      :class="{ filled }"
      :title="`${room.unread_msgs + (newMessages?.length || 0)} mensagens não lidas`"
    >
      {{ room.unread_msgs + (newMessages?.length || 0) }}
    </span>
  </div>
</template>

<script>
import { mapState } from 'vuex';

import UserAvatar from '@/components/chats/UserAvatar';

const ONE_MINUTE_IN_MILLISECONDS = 60000;

export default {
  name: 'ContactRoom',

  components: {
    UserAvatar,
  },

  props: {
    room: {
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
    usePhoto: {
      type: Boolean,
      default: false,
    },
  },

  mounted() {
    const randomPeriodInMilliseconds = Math.ceil(Math.random() * 30 + 1) * 1000;

    if (this.room.waitingTime) {
      this.waitingTime = this.room.waitingTime;
      this.timer = setInterval(() => {
        this.waitingTime += 1;
        // ensures that all chats waiting times don't update at same time
      }, ONE_MINUTE_IN_MILLISECONDS + randomPeriodInMilliseconds);
    }
  },

  destroyed() {
    clearInterval(this.timer);
  },

  data: () => ({
    waitingTime: 0,
    timer: null,
  }),

  computed: {
    ...mapState({
      newMessages(state) {
        return state.rooms.newMessagesByRoom[this.room.uuid]?.messages;
      },
      activeRoomId: (state) => state.rooms.activeRoom?.uuid,
    }),
    hasUnreadMessages() {
      return this.room.unread_msgs > 0;
    },
  },
};
</script>

<style lang="scss" scoped>
.container {
  display: grid;
  grid-template-columns: max-content 1fr min-content;
  align-items: center;
  gap: 0.5rem;

  padding: 0.5rem;

  cursor: pointer;

  &.active {
    border-radius: $unnnic-border-radius-sm;
    background: rgba($unnnic-color-brand-weni, $unnnic-opacity-level-extra-light);
  }

  &.new-messages {
    .username {
      color: $unnnic-color-neutral-darkest;
      font-weight: $unnnic-font-weight-bold;
    }

    .additional-information {
      color: $unnnic-color-neutral-cloudy;
      font-weight: $unnnic-font-weight-bold;
    }
  }

  &.disabled {
    .content {
      .username {
        color: $unnnic-color-neutral-cleanest;
      }

      .additional-information {
        color: $unnnic-color-neutral-lightest;
      }
    }

    .unread-messages {
      color: $unnnic-color-neutral-cleanest;
    }
  }

  .content {
    margin-right: auto;

    display: flex;
    flex-flow: column wrap;

    width: 100%;
    overflow: hidden;

    & .bold {
      font-weight: $unnnic-font-weight-bold;
    }

    .username {
      color: $unnnic-color-neutral-darkest;
      font-size: $unnnic-font-size-body-gt;
    }

    .additional-information {
      width: 100%;

      color: $unnnic-color-neutral-cloudy;
      font-size: $unnnic-font-size-body-md;
    }

    .ellipsis {
      width: 100%;

      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .unread-messages {
    display: flex;
    justify-content: center;
    align-items: center;

    width: 1.25rem;
    min-width: 1.25rem;
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
