<template>
  <section class="mobile-select-org-project">
    <header
      class="mobile-select-org-project__header"
      @click="removeProject"
      @keypress.enter="removeProject"
    >
      <img
        :src="weniChatsLogo"
        alt="Weni Chats"
      />
    </header>

    <main class="mobile-select-org-project__main">
      <ProjectSelector
        v-model:page="route"
        v-model:organizationUuid="organizationUuid"
        v-model:organizationsItems="organizations"
        v-model:projectsItems="projects"
        v-model:projectUuid="projectUuid"
        class="main__orgs-projects"
        :env="appEnviroment"
        :authorization="`Bearer ${userToken}`"
      >
        <template #subtitle>{{ orgAndProjectSubtitle }}</template>
      </ProjectSelector>

      <UnnnicButton
        class="main__logout"
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
import { mapActions, mapState } from 'pinia';
import { useConfig } from '@/store/modules/config';

import ProjectSelector from '@/components/chats/Mobile/ProjectSelector.vue';

import Keycloak from '@/services/keycloak';

import weniChatsLogo from '@/assets/weni-chats-logo.svg';

import env from '@/utils/env';

export default {
  name: 'MobileSelectOrgProject',
  components: { ProjectSelector },
  data() {
    return {
      weniChatsLogo,
      appEnviroment: env('CHATS_ENVIRONMENT'),
      route: 'orgs',
      organizationUuid: '',
      organizations: [],
      projectUuid: '',
      projects: [],

      skipSteps: this.$route.params.from !== 'home',
    };
  },

  computed: {
    ...mapState(useConfig, {
      userToken: (store) => store.token,
    }),

    orgAndProjectSubtitle() {
      return this.$t(
        `${this.organizationUuid ? 'select_project' : 'select_org'}.choose_one`,
      );
    },
  },
  watch: {
    projectUuid(newProjectUuid) {
      this.setProjectUuid(newProjectUuid || '');
      if (newProjectUuid) {
        const app = this.$root;
        if (app.ws) {
          app.wsReconnect();
        } else {
          app.wsConnect();
        }
        this.$router.push({ name: 'home' });
      }
    },
    organizations(newOrganizations) {
      if (this.skipSteps && newOrganizations.length === 1) {
        this.organizationUuid = newOrganizations[0].uuid;
      }
    },
    projects(newProjects) {
      if (this.skipSteps && newProjects.length === 1) {
        this.projectUuid = newProjects[0].uuid;
      }
    },
  },
  methods: {
    ...mapActions(useConfig, ['setProjectUuid']),
    logout() {
      Keycloak.keycloak.logout();
    },
    removeProject() {
      if (this.route !== 'orgs') {
        this.route = 'orgs';
        this.projectUuid = '';
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.mobile-select-org-project {
  height: 100%;

  display: flex;
  flex-direction: column;

  overflow: hidden;

  &__header {
    padding: $unnnic-spacing-md;

    display: flex;
    justify-content: center;

    background-color: $unnnic-color-neutral-lightest;
  }

  &__main {
    padding: $unnnic-spacing-md $unnnic-spacing-ant;

    height: 100%;

    display: grid;
    grid-template-rows: 1fr auto;
    gap: $unnnic-spacing-md;

    overflow: hidden;

    .main__orgs-projects {
      display: flex;
      flex-direction: column;

      overflow: hidden;

      :deep(.organizations-list),
      :deep(.projects-list) {
        margin: -$unnnic-spacing-ant;
        padding: $unnnic-spacing-ant;

        height: 100%;

        overflow: scroll;
      }
    }
  }
}

:deep(.unnnic-button).main__logout {
  min-width: 100%;

  * {
    color: $unnnic-color-aux-red-500;
  }
}
</style>
