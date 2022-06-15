<template>
  <section class="settings-layout">
    <aside>
      <settings-options class="options" />
    </aside>

    <section id="view">
      <section v-if="breadcrumb" class="breadcrumb">
        <unnnic-breadcrumb :crumbs="breadcrumb" @crumbClick="$router.push($event.path)" />
      </section>

      <router-view />
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
  grid-template-areas: 'options main';

  height: 100%;

  padding: {
    top: 1.5rem;
    bottom: 1.5rem;
    left: 1.5rem;
  }

  .options {
    grid-area: options;
    height: 100%;
    margin-right: 1rem;
    border-right: solid 1px $unnnic-color-neutral-soft;
  }

  #view {
    grid-area: main;

    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    height: calc(100% - 0.5rem);
  }
}
</style>
