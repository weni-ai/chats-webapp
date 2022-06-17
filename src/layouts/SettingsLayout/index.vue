<template>
  <section class="settings-layout">
    <aside>
      <settings-options class="options" :options="options" />
    </aside>

    <section class="content">
      <section v-if="breadcrumb" class="breadcrumb">
        <unnnic-breadcrumb :crumbs="breadcrumb" @crumbClick="$router.push($event.path)" />
      </section>

      <section id="view">
        <router-view />
      </section>
    </section>
  </section>
</template>

<script>
import SettingsOptions from './components/SettingsOptions';

export default {
  name: 'SettingsLayout',

  components: {
    SettingsOptions,
  },

  computed: {
    getters() {
      return this.$store.getters;
    },
    breadcrumb() {
      const { breadcrumb } = this.$route.meta;

      if (!breadcrumb) return null;

      return breadcrumb.map(this.parseBreadcrumb);
    },
  },

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

  methods: {
    parseBreadcrumb(breadcrumb) {
      if (!breadcrumb) return null;

      const { name, getter, path } = breadcrumb;

      const value = this.getters[getter];
      const { params } = this.$route;

      return {
        name: typeof name === 'function' ? name(value, params) : name,
        path: typeof path === 'function' ? path(value, params) : path,
      };
    },
  },
};
</script>

<style lang="scss" scoped>
.settings-layout {
  display: grid;
  grid-template-columns: 33.33% 1fr;
  grid-template-rows: 100%;
  grid-template-areas: 'options content';

  height: 100%;

  padding: {
    top: 1.5rem;
    bottom: 1.5rem;
    left: 1.5rem;
  }

  .options {
    grid-area: options;
    margin-right: 1rem;
    height: 100%;
    border-right: solid 1px $unnnic-color-neutral-soft;
  }

  .content {
    grid-area: content;

    #view {
      padding-top: 0.5rem;

      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      height: 100%;
    }
  }
}
</style>
