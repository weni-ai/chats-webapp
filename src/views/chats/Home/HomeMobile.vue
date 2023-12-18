<template>
  <div class="home-mobile">
    <unnnic-chats-header
      title="Chats"
      subtitle="Nome do projeto"
      avatarIcon="forum"
      :back="() => {}"
      sectionIconScheme="weni-600"
    />
    <main class="home-mobile__main">
      <the-card-groups class="room-list" />
    </main>
    <unnnic-chats-navbar :links="navs" />
  </div>
</template>

<script>
import TheCardGroups from '@/layouts/ChatsLayout/components/TheCardGroups';

export default {
  name: 'HomeMobile',

  components: {
    TheCardGroups,
  },

  computed: {
    navs() {
      return [
        {
          name: 'history',
          icon: {
            default: 'history',
            selected: 'history',
          },
          action: () => {},
        },
        {
          name: 'send',
          icon: {
            default: 'send',
            selected: 'send',
          },
          action: () => {},
        },
        {
          name: 'forum',
          icon: {
            default: 'forum',
            selected: 'forum',
          },
          action: () => {},
        },
        {
          name: 'preferences',
          icon: {
            default: 'preferences',
            selected: 'preferences',
          },
          action: () => {},
        },
      ];
    },
  },
};
</script>

<style lang="scss" scoped>
.home-mobile {
  overflow: hidden;

  display: grid;
  grid-template-rows: auto 1fr auto;

  height: 100vh;

  &__main {
    overflow: hidden;

    padding: $unnnic-spacing-xs $unnnic-spacing-sm 0;
  }
}
</style>
