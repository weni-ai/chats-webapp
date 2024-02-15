<template>
  <unnnic-connect-project-selector
    :env="appEnviroment"
    :authorization="`Bearer ${userToken}`"
    :page.sync="route"
    :project-uuid.sync="projectUuid"
  />
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

<style lang="scss" scoped></style>
