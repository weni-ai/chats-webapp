<template>
  <div class="room-loading">
    <header>
      <unnnic-skeleton-loading />
      <unnnic-skeleton-loading />
    </header>
    <main>
      <div class="room-loading__messages">
        <unnnic-skeleton-loading width="250px" height="23px" />
        <div class="message">
          <unnnic-skeleton-loading />
        </div>
        <div class="message">
          <unnnic-skeleton-loading />
        </div>
        <div class="message">
          <unnnic-skeleton-loading />
        </div>
        <div class="message">
          <unnnic-skeleton-loading />
        </div>
      </div>
      <div class="room-loading__messages-manager">
        <unnnic-skeleton-loading />
        <unnnic-skeleton-loading />
        <unnnic-skeleton-loading />
      </div>
    </main>
  </div>
</template>

<script>
export default {
  name: 'RoomLoading',
};
</script>

<style lang="scss" scoped>
.room-loading {
  display: flex;
  flex-direction: column;

  width: 100%;
  height: 100%;

  z-index: 10000;

  header {
    padding: $unnnic-spacing-sm 0;

    display: grid;
    gap: $unnnic-spacing-md;
    grid-template-columns: 48px 70%;

    & > * {
      width: 100%;
      height: 48px;
    }
  }
  main {
    display: grid;
    grid-template-rows: 1fr auto;
    gap: $unnnic-spacing-sm;

    padding: $unnnic-spacing-sm;
    height: 100%;

    .room-loading__messages {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: $unnnic-spacing-md;
      grid-template-rows: 23px 60px 60px 60px 60px;

      .message {
        width: 55%;
        height: 100%;
        min-height: 46px;

        align-self: start;
        max-height: 60px;

        & > * {
          width: 100%;
          height: 100%;
        }
      }
    }

    .room-loading__messages-manager {
      display: grid;
      gap: $unnnic-spacing-xs;
      grid-template-columns: auto 46px 46px;

      & > * {
        width: 100%;
        height: 46px;
      }
    }
  }
}
</style>
