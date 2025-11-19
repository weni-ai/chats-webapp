<template>
  <section class="chats-background">
    <img
      class="chats-background__icon"
      :src="chatHomeIcon"
      alt="Chat Home Icon"
    />
    <h1 class="chats-background__title">{{ $t('home.title') }}</h1>
    <p class="chats-background__description">
      {{ $t('home.description') }}
    </p>
  </section>
</template>

<script>
import chatHomeIcon from '@/assets/chat-home-icon.png';

export default {
  name: 'ChatsBackground',
  data() {
    return {
      chatHomeIcon,
    };
  },
};
</script>

<style lang="scss" scoped>
.chats-background {
  position: relative;
  height: 100%;
  background: rgba(246, 247, 249, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: $unnnic-space-3;

  &__icon {
    max-width: $unnnic-space-20;
    max-height: $unnnic-space-20;
  }

  &__title {
    font: $unnnic-font-display-1;
    color: $unnnic-color-fg-emphasized;
  }
  &__description {
    font: $unnnic-font-body;
    color: $unnnic-color-fg-base;
    font-weight: $unnnic-font-weight-medium;
  }
}
</style>
