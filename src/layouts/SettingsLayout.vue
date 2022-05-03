<template>
  <section class="settings-layout">
    <aside>
      <settings-options class="options" />
    </aside>

    <section id="view">
      <section v-if="breadcrumb" class="breadcrumb">
        <unnnic-breadcrumb :crumbs="breadcrumb" @crumbClick="$router.push($event.path)" />
      </section>

      <section class="content">
        <router-view />
      </section>
    </section>
  </section>
</template>

<script>
import SettingsOptions from '@/components/layouts/SettingsOptions';

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

      const { name, getter, solver } = breadcrumb;

      if (name) return breadcrumb;

      if (getter && solver)
        return {
          name: solver(this.getters[getter]),
        };

      return null;
    },
  },
};
</script>

<style lang="scss" scoped>
.settings-layout {
  display: grid;
  grid-template-columns: 33.33% 1fr;
  grid-template-areas: 'options main';

  $height: calc(100vh - 5.5rem);
  height: $height;
  max-height: $height;

  padding: {
    top: 1.5rem;
    right: 0;
    bottom: 1.5rem;
    left: 1.5rem;
  }

  .options {
    height: 100%;
    margin-right: 1rem;
    border-right: solid 1px $unnnic-color-neutral-soft;
  }

  #view {
    display: flex;
    flex-direction: column;

    max-height: 100%;

    overflow-y: auto;
    padding-right: 1rem;
    margin-right: 0.5rem;

    .breadcrumb {
      margin-bottom: 0.5rem;
    }

    .content {
      flex: 1 1;
      max-height: 100%;
    }
  }
}
</style>
