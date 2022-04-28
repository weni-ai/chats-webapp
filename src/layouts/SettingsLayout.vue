<template>
  <section class="settings-layout">
    <aside>
      <settings-options />
    </aside>

    <main>
      <slot />
    </main>
  </section>
</template>

<script>
import SettingsOptions from '@/components/layouts/SettingsOptions';

export default {
  name: 'SettingsLayout',

  components: {
    SettingsOptions,
  },
};
</script>

<style lang="scss" scoped>
.settings-layout {
  display: grid;
  grid-template-columns: 33.33% 1fr;
  grid-template-areas: 'options main';

  padding: {
    top: 1.5rem;
    right: 1rem;
    bottom: 1rem;
    left: 1.5rem;
  }
}
</style>
