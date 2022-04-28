<template>
  <section class="settings-layout">
    <aside>
      <settings-options class="options" />
    </aside>

    <section>
      <section v-if="breadcrumb" class="breadcrumb">
        <unnnic-breadcrumb :crumbs="breadcrumb" @crumbClick="$router.push($event.path)" />
      </section>
      <router-view />
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
    breadcrumb() {
      return this.$route.meta.breadcrumb;
    },
  },
};
</script>

<style lang="scss" scoped>
.settings-layout {
  display: grid;
  grid-template-columns: 33.33% 1fr;
  grid-template-areas: 'options main';

  height: 100%;

  padding: {
    top: 1.5rem;
    right: 1rem;
    bottom: 1.5rem;
    left: 1.5rem;
  }

  .options {
    height: 100%;
    margin-right: 1rem;
    border-right: solid 1px $unnnic-color-neutral-soft;
  }

  .breadcrumb {
    margin-bottom: 0.5rem;
  }
}
</style>
