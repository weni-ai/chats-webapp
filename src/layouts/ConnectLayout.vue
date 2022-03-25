<template>
  <section id="container">
    <connect-header class="topbar" />

    <nav>
      <unnnic-sidebar-primary
        :expanded="false"
        :items="sidebarItems"
        class="primary-sidebar"
        language="pt-br"
        hideText="Encolher"
      >
        <template #header>
          <img src="../assets/weni-logo.svg" alt="Weni's Logo" />
        </template>
      </unnnic-sidebar-primary>
    </nav>
    <div class="view">
      <slot />
    </div>
  </section>
</template>

<script>
import { unnnicSidebarPrimary } from '@weni/unnnic-system';

import ConnectHeader from '@/components/layouts/ConnectHeader';

export default {
  name: 'MainLayout',

  components: {
    unnnicSidebarPrimary,
    ConnectHeader,
  },

  data: () => ({
    sidebarItems: [
      {
        label: 'Menu principal',
        items: [{ label: 'Início', icon: 'house-1-1' }],
      },
      {
        label: 'Sistemas',
        items: [
          { label: 'Fluxos', active: false, icon: 'hierarchy-3-2' },
          { label: 'Inteligência Artificial', active: false, icon: 'science-fiction-robot-2' },
          {
            label: 'Chats',
            active: true,
            icon: 'messaging-we-chat-3',
          },
        ],
      },
      {
        label: 'Perfil',
        items: [{ label: 'Conta', active: false, icon: 'single-neutral-actions-1' }],
      },
    ],
  }),
};
</script>

<style lang="scss" scoped>
#container {
  min-height: 100vh;
  max-height: 100vh;

  display: grid;
  grid-template-rows: 5.5rem 1fr;
  grid-template-columns: auto 1fr;
  grid-template-areas:
    'primary-sidebar topbar'
    'primary-sidebar view';

  .topbar {
    grid-area: topbar;
  }

  .primary-sidebar {
    height: 100vh;
    grid-area: primary-sidebar;
  }

  .view {
    grid-area: view;
  }
}
</style>
