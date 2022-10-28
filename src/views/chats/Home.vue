<template>
  <chats-layout>
    <section class="illustration">
      <img class="illustration__doodles" src="/homepage-illustration/doodles.svg" alt="" />
      <img class="illustration__background" src="/homepage-illustration/background.svg" alt="" />
    </section>
  </chats-layout>
</template>

<script>
import ChatsLayout from '@/layouts/ChatsLayout';

export default {
  name: 'ChatsHome',

  components: {
    ChatsLayout,
  },
};
</script>

<style lang="scss" scoped>
.illustration {
  display: flex;
  align-items: center;
  justify-content: center;

  position: relative;
  height: 100%;
  margin-left: $unnnic-spacing-inline-sm;

  &__doodles,
  &__background {
    position: absolute;
    height: 100%;
    width: 100%;
    object-fit: cover;
    object-position: center;
    pointer-events: none;
  }

  &__doodles {
    padding-left: $unnnic-spacing-inset-xs;
  }
}
</style>
