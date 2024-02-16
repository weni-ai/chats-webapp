<template>
  <section class="mobile-select-org-project">
    <header></header>

    <main class="mobile-select-org-project__main">
      <unnnic-connect-project-selector
        :env="appEnviroment"
        :authorization="`Bearer ${userToken}`"
        :page.sync="route"
        :project-uuid.sync="projectUuid"
      />

      <unnnic-button
        class="mobile-select-org-project__logout"
        iconCenter="logout"
        type="tertiary"
        size="large"
        :text="$t('logout')"
      />
    </main>
  </section>
</template>

<script>
import env from '@/utils/env';
import { mapActions, mapState } from 'vuex';

export default {
  name: 'MobileSelectOrgProject',
  data() {
    return {
      appEnviroment: env('VUE_APP_CHATS_ENVIRONMENT'),
      route: 'orgs',
      projectUuid: '',
    };
  },
  computed: {
    ...mapState({
      userToken: (state) => state.config.token,
    }),
  },
  methods: {
    ...mapActions('config', ['setProject']),
  },
  watch: {
    projectUuid(newProjectUuid) {
      if (newProjectUuid) {
        this.setProject(newProjectUuid);
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.mobile-select-org-project {
  &__main {
    padding: $unnnic-spacing-ant;
  }
}

:deep(.unnnic-button).mobile-select-org-project__logout {
  width: 100%;

  * {
    color: $unnnic-color-aux-red-500;
  }
}
</style>
