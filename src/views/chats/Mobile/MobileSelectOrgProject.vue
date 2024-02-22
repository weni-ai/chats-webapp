<template>
  <section class="mobile-select-org-project">
    <header class="mobile-select-org-project__header">
      <img :src="weniChatsLogo" alt="Weni Chats" />
    </header>

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
        @click="logout"
      />
    </main>
  </section>
</template>

<script>
import { mapActions, mapState } from 'vuex';

import Keycloak from '@/services/keycloak';

import weniChatsLogo from '@/assets/weni-chats-logo.svg';

import env from '@/utils/env';

export default {
  name: 'MobileSelectOrgProject',
  data() {
    return {
      weniChatsLogo,
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
    logout() {
      Keycloak.keycloak.logout();
    },
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
  &__header {
    padding: $unnnic-spacing-md;

    display: flex;
    justify-content: center;

    background-color: $unnnic-color-neutral-lightest;
  }

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
