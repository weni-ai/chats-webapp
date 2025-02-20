<template>
  <UnnnicDrawer
    ref="editProjectGroupDrawer"
    :modelValue="show"
    :title="editingProjectGroup.name"
    :primaryButtonText="$t('save')"
    :secondaryButtonText="$t('cancel')"
    size="xl"
    @primary-button-click="finish()"
    @secondary-button-click="$refs.editProjectGroupDrawer.close()"
    @close="closeDrawer"
  >
    <template #content>
      <UnnnicTab
        :tabs="tabsIds"
        :activeTab="activeTab?.id"
        @change="updateTab"
      >
        <template
          v-for="tab in tabs"
          #[`tab-head-${tab.id}`]
          :key="`tab-head-${tab.id}`"
        >
          {{ tab.name }}
        </template>

        <template #tab-panel-general>
          <General
            v-model="editingProjectGroup"
            isEditing
          />
        </template>
        <template #tab-panel-projects>
          <Projects
            v-model="editingProjectGroup"
            isEditing
          />
        </template>
        <template #tab-panel-agents>
          <Agents
            v-model="editingProjectGroup"
            isEditing
          />
        </template>
      </UnnnicTab>
    </template>
  </UnnnicDrawer>
</template>

<script>
import General from './Forms/General.vue';
import Projects from './Forms/Projects.vue';
import Agents from './Forms/Agents.vue';
import Group from '@/services/api/resources/settings/group';

export default {
  name: 'EditProjectGroupDrawer',
  components: {
    General,
    Projects,
    Agents,
  },
  props: {
    show: {
      type: Boolean,
      required: true,
    },
    projectGroup: {
      type: Object,
      required: true,
    },
  },
  emits: ['close'],
  data() {
    return {
      activeTab: { id: 'general' },
      editingProjectGroup: {
        uuid: '',
        name: '',
        managers: [],
        maxSimultaneousChatsByAgent: '',
        sectors: [],
        agents: [],
      },
    };
  },
  computed: {
    tabs() {
      return [
        { name: this.$t('config_chats.groups.general'), id: 'general' },
        { name: this.$t('config_chats.groups.projects'), id: 'projects' },
        { name: this.$t('config_chats.groups.agents'), id: 'agents' },
      ];
    },
    tabsIds() {
      return this.tabs.map((tab) => tab.id);
    },
  },
  async created() {
    const group = await Group.show(this.projectGroup.uuid);

    const authorizations = await Group.listAuthorization({
      groupSectorUuid: this.projectGroup.uuid,
    });

    this.editingProjectGroup = {
      ...group,
      maxSimultaneousChatsByAgent: String(group.rooms_limit),
      managers: authorizations.results.filter(
        (authorization) => authorization.role === 1,
      ),
      agents: authorizations.results.filter(
        (authorization) => authorization.role === 2,
      ),
    };
  },
  methods: {
    updateTab(newTab) {
      const newActiveTab = this.tabs.find((tab) =>
        [tab.name, tab.id].includes(newTab),
      );

      if (!newActiveTab) return;

      this.activeTab = newActiveTab;
    },
    closeDrawer(forceClose) {
      if (this.showDiscartQuestion && !forceClose) {
        this.showConfirmDiscartChangesModal = true;
      } else {
        this.$emit('close');
      }
    },
    finish() {},
  },
};
</script>

<style lang="scss" scoped></style>
