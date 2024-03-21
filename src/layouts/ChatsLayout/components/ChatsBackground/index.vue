<template>
  <section class="chats-background">
    <img
      class="illustration__doodles"
      src="/homepage-illustration/doodles.svg"
      alt=""
    />
    <img
      class="illustration__background"
      src="/homepage-illustration/background.svg"
      alt=""
    />
  </section>
</template>

<script>
export default {
  name: 'ChatsHome',
};
</script>

<style lang="scss" scoped>
.chats-background {
  position: relative;

  height: 100%;

  .illustration {
    display: flex;
    align-items: center;
    justify-content: center;

    position: relative;
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
  }
}
</style>
