<template>
  <section class="mobile-closed-chats">
    <unnnic-chats-header
      :title="$t('chats.closed_chats.project_history')"
      :subtitle="project.name"
      avatarIcon="history"
      size="small"
    />
    <closed-chats-rooms-table :project="project" />
  </section>
</template>

<script>
import ProjectApi from '@/services/api/resources/settings/project';

import ClosedChatsRoomsTable from '@/views/chats/ClosedChats/RoomsTable';

export default {
  name: 'MobileClosedChats',

  components: {
    ClosedChatsRoomsTable,
  },

  data() {
    return {
      isLoadingHeader: false,

      project: null,
    };
  },

  async created() {
    this.getProjectInfo();
  },

  methods: {
    async getProjectInfo() {
      const project = await ProjectApi.getInfo();
      this.project = project.data;
      this.isLoadingHeader = false;
    },

    emitClose() {
      this.$emit('close');
    },
  },
};
</script>

<style lang="scss" scoped>
.mobile-closed-chats {
  display: flex;
  flex-direction: column;

  height: 100%;

  background-color: $unnnic-color-background-lightest;
}
</style>
