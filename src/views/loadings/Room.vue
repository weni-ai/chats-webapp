<template>
  <div class="room-loading">
    <header>
      <unnnic-skeleton-loading />
      <unnnic-skeleton-loading />
    </header>
    <main>
      <div class="room-loading__messages">
        <unnnic-skeleton-loading width="80px" height="23px" />
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
      grid-template-rows: 23px 95px 95px 70px 70px;

      .message {
        width: 55%;
        height: 100%;
        min-height: 46px;

        & > * {
          width: 100%;
          height: 100%;
        }

        &:nth-of-type(1),
        &:nth-of-type(2) {
          max-height: 95px;
        }
        &:nth-of-type(3),
        &:nth-of-type(4) {
          max-height: 70px;
        }

        &:nth-child(odd) {
          align-self: end;
        }

        &:nth-child(even) {
          align-self: start;
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
