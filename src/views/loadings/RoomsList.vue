<template>
  <div class="rooms-list-loading">
    <div
      v-for="roomGroup in 2"
      :key="`roomGroup-${roomGroup}`"
      class="rooms-list-loading__room-list"
    >
      <header>
        <unnnic-skeleton-loading />
        <unnnic-skeleton-loading height="22px" />
      </header>
      <main>
        <ul class="rooms-list-loading__room-group">
          <li v-for="room in 2" :key="`room-${room}`" class="rooms-list-loading__room">
            <unnnic-skeleton-loading height="40px" />
            <div class="rooms-list-loading__room__infos">
              <unnnic-skeleton-loading />
              <unnnic-skeleton-loading />
            </div>
            <unnnic-skeleton-loading height="20px" />
          </li>
        </ul>
      </main>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RoomLoading',
};
</script>

<style lang="scss" scoped>
.rooms-list-loading {
  margin-top: $unnnic-spacing-sm;

  display: flex;
  flex-direction: column;

  width: 100%;
  height: 100%;

  z-index: 10000;

  header {
    padding: $unnnic-spacing-ant 0;

    display: grid;
    gap: $unnnic-spacing-xs;
    grid-template-columns: auto 22px;

    & > * {
      width: 100%;
      height: 22px;
    }
  }

  &__room-list {
    margin-bottom: $unnnic-spacing-sm;
  }

  &__room-group {
    padding: 0;
    margin: 0;
  }

  &__room {
    padding: $unnnic-spacing-xs;
    display: grid;
    grid-template-columns: 40px auto 20px;
    gap: $unnnic-spacing-xs;
    align-items: center;

    & > * {
      width: 100%;
      max-height: 40px;
    }

    &__infos {
      display: grid;
      gap: $unnnic-spacing-nano;

      & > * {
        width: 100%;
        height: 16px;
      }
    }
  }
}
</style>
