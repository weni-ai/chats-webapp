<template>
  <section class="flows-contacts-loading">
    <header>
      <unnnic-skeleton-loading />
      <unnnic-skeleton-loading height="22px" />
    </header>
    <main>
      <ul class="flows-contacts-loading__room-group">
        <li v-for="room in 4" :key="`room-${room}`" class="flows-contacts-loading__room">
          <unnnic-skeleton-loading height="40px" />
          <div class="flows-contacts-loading__room__infos">
            <unnnic-skeleton-loading />
            <unnnic-skeleton-loading />
          </div>
        </li>
      </ul>
    </main>
  </section>
</template>

<script>
export default {
  name: 'FlowsContactsLoading',
};
</script>

<style lang="scss" scoped>
.flows-contacts-loading {
  display: flex;
  flex-direction: column;

  overflow: hidden auto;

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
