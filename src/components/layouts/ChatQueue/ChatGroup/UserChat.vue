<template>
  <div class="container" :class="{ active: !!chat.active }">
    <span class="avatar" :class="{ active: !!chat.active }">{{ chat.username.charAt(0) }}</span>

    <div class="content">
      <h3 class="username">{{ chat.username }}</h3>
      <div class="last-message">
        {{ chat.lastMessage }}
      </div>
    </div>

    <span class="unread-messages">
      {{ chat.unreadedMessages }}
    </span>
  </div>
</template>

<script>
export default {
  name: 'UserChat',

  props: {
    chat: {
      type: Object,
      required: true,
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

  min-width: 255px;
  max-width: 255px;

  &.active {
    padding: 0.75rem 0.5rem;
    border: solid 0.5px $unnnic-color-brand-weni;
    border-radius: $unnnic-border-radius-sm;
    background: rgba($unnnic-color-brand-weni, 0.04);
  }

  .avatar {
    display: inline-flex;
    align-items: center;
    justify-content: center;

    width: 2rem;
    height: 2rem;
    border-radius: $unnnic-border-radius-sm;

    color: $unnnic-color-aux-orange;
    border: solid 1px $unnnic-color-aux-orange;

    &.active {
      border: solid 1px $unnnic-color-aux-pink;
      background: $unnnic-color-aux-pink;
      color: $unnnic-color-neutral-snow;
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
    background: $unnnic-color-background-snow;

    width: 1.25rem;
    height: 1.25rem;
    border-radius: 50%;

    font-size: $unnnic-font-size-body-sm;
    color: $unnnic-color-brand-weni;
  }
}
</style>
