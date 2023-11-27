<template>
  <div class="chat-header-loading">
    <header>
      <unnnic-skeleton-loading />
      <unnnic-skeleton-loading />
    </header>
  </div>
</template>

<script>
export default {
  name: 'ChatHeaderLoading',
};
</script>

<style lang="scss" scoped>
.chat-header-loading {
  width: 100%;

  z-index: 10000;

  header {
    padding: $unnnic-spacing-sm;

    display: grid;
    gap: $unnnic-spacing-md;
    grid-template-columns: 40px 70%;

    box-shadow: $unnnic-shadow-level-far;

    & > * {
      width: 100%;
      height: 40px;
    }
  }
}
</style>
