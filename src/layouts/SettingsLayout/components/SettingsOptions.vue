<template>
  <nav>
    <section class="settings-options">
      <div
        v-for="{ title, description, icon, route, isActive } in options"
        :key="route"
        @click="navigate(route)"
        @keypress.enter="navigate(route)"
        class="clickable option"
      >
        <unnnic-card
          type="account"
          :enabled="isActive ? isActive(currentRoute) : isCurrentRoute(route)"
          :title="title"
          :description="description"
          :icon="icon"
        />
      </div>
    </section>
  </nav>
</template>

<script>
export default {
  name: 'SettingsOptions',

  data: () => ({
    options: [
      {
        title: 'Preferências',
        icon: 'cog-2',
        description: 'Altere informações do projeto ou visualize informações importantes.',
        route: '/settings/preferences',
      },
      {
        title: 'Importação',
        icon: 'download-bottom-1',
        description: 'Insira um arquivo de importação com fluxos e campanhas no seu projeto atual.',
        route: '/settings/importation',
      },
      {
        title: 'Exportação',
        icon: 'upload-bottom-1',
        description:
          'Gere um arquivo de exportação dos fluxos ou campanhas criados no seu projeto atual.',
        route: '/settings/exportation',
      },
      {
        title: 'Chats',
        icon: 'messages-bubble-1',
        description: 'Gerencie equipes ou altere configurações do Chats.',
        route: '/settings/chats',
        isActive: (currentRoute) => currentRoute.includes('/settings/chats'),
      },
    ],
  }),

  computed: {
    currentRoute() {
      return this.$route.path;
    },
  },

  methods: {
    isCurrentRoute(route) {
      return typeof route === 'function' ? route(this.currentRoute) : route === this.currentRoute;
    },
    navigate(route) {
      this.$router.push(route);
    },
  },
};
</script>

<style lang="scss" scoped>
.settings-options {
  padding-right: 1rem;

  .option {
    & + .option {
      padding-top: 0.5rem;
    }
  }
}
</style>
