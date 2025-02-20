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
            @remove-manager="toRemoveManagers.push($event)"
          />
        </template>
        <template #tab-panel-projects>
          <Projects
            v-model="editingProjectGroup"
            isEditing
            @remove-sector="toRemoveSectors.push($event)"
          />
        </template>
        <template #tab-panel-agents>
          <Agents
            v-model="editingProjectGroup"
            isEditing
            @remove-agent="toRemoveAgents.push($event)"
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
      toRemoveSectors: [],
      toRemoveManagers: [],
      toRemoveAgents: [],
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

    async finish() {
      await this.updateGroup();
      await this.updateManagers();
      await this.updateAgents();
      await this.updateSectors();
    },

    async updateGroup() {
      const updateGroupBody = {
        rooms_limit: this.editingProjectGroup.maxSimultaneousChatsByAgent,
      };

      await Group.update({
        groupUuid: this.projectGroup.uuid,
        body: updateGroupBody,
      });
    },

    async updateManagers() {
      const toRemoveManagersUuids = this.toRemoveManagers.map(
        (agent) => agent.uuid,
      );

      const toAddManagersUuids = this.editingProjectGroup.managers
        .filter((manager) => manager.new)
        .map((manager) => manager.uuid);

      await Promise.all(
        toRemoveManagersUuids.map((permissionUuid) =>
          Group.deleteAuthorization({ permissionUuid }),
        ),
      );

      await Promise.all(
        toAddManagersUuids.map((permissionUuid) =>
          Group.addAuthorization({
            groupSectorUuid: this.projectGroup.uuid,
            role: 1,
            permissionUuid,
          }),
        ),
      );
    },

    async updateSectors() {
      const toRemoveSectorsUuids = this.toRemoveSectors.map(
        (sector) => sector.uuid,
      );

      const toAddSectorsUuids = this.editingProjectGroup.sectors
        .filter((sector) => sector.new)
        .map((sector) => sector.uuid);

      await Promise.all(
        toRemoveSectorsUuids.map((sectorUuid) =>
          Group.removeSector({ groupUuid: this.projectGroup.uuid, sectorUuid }),
        ),
      );

      await Promise.all(
        toAddSectorsUuids.map((sectorUuid) =>
          Group.addSector({ groupUuid: this.projectGroup.uuid, sectorUuid }),
        ),
      );
    },

    async updateAgents() {
      const toRemoveAgentsUuids = this.toRemoveAgents.map(
        (agent) => agent.uuid,
      );

      const toAddAgentsUuids = this.editingProjectGroup.agents
        .filter((agent) => agent.new)
        .map((agent) => agent.uuid);

      await Promise.all(
        toRemoveAgentsUuids.map((permissionUuid) =>
          Group.deleteAuthorization({ permissionUuid }),
        ),
      );

      await Promise.all(
        toAddAgentsUuids.map((permissionUuid) =>
          Group.addAuthorization({
            groupSectorUuid: this.projectGroup.uuid,
            role: 2,
            permissionUuid,
          }),
        ),
      );
    },
  },
};
</script>

<style lang="scss" scoped></style>
