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

  props: {
    options: {
      type: Array,
      default: () => [],
    },
  },

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
