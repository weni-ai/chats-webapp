<template>
  <section>
    <img class="illustration__doodles" src="/homepage-illustration/doodles.svg" alt="" />
    <img class="illustration__background" src="/homepage-illustration/background.svg" alt="" />
  </section>
</template>

<script>
export default {
  name: 'ChatsHome',
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
    width: 73%;
    object-fit: cover;
    object-position: center;
    pointer-events: none;
  }

  &__doodles {
    padding-left: $unnnic-spacing-inset-xs;
  }
}
</style>
