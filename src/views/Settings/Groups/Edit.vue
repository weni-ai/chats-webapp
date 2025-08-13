<template>
  <UnnnicDrawer
    ref="editProjectGroupDrawer"
    :modelValue="show"
    :title="editingProjectGroup.name"
    :primaryButtonText="$t('save')"
    :secondaryButtonText="$t('cancel')"
    :loadingPrimaryButton="isLoadingRequest"
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
            :queuesOptions="avaliableSectorQueues"
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

import Unnnic from '@weni/unnnic-system';

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
      avaliableSectorQueues: [],
      toRemoveSectors: [],
      toRemoveManagers: [],
      toRemoveAgents: [],
      isLoadingRequest: false,
      firstLoaded: false,
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

  watch: {
    'editingProjectGroup.sectors': {
      deep: true,
      async handler(sectors, oldSectors) {
        if (!this.firstLoaded) return;

        const sectorsUuids = sectors.map((sector) => sector.uuid);
        const oldSectorsUuids = oldSectors.map((sector) => sector.uuid);

        const toAddQueuesSector = sectorsUuids.filter(
          (sectorUuid) => !oldSectorsUuids.includes(sectorUuid),
        )[0];

        const toRemoveQueuesSector = oldSectorsUuids.filter(
          (sectorUuid) => !sectorsUuids.includes(sectorUuid),
        )[0];

        if (sectors.length) {
          await this.listSectorsQueues({
            toAddQueuesSector,
            toRemoveQueuesSector,
          });
        } else {
          this.avaliableSectorQueues = [];
          this.editingProjectGroup.agents.forEach((agent) => {
            agent.queues = [];
          });
        }
      },
    },
  },

  async mounted() {
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
      agents: authorizations.results
        .filter((authorization) => authorization.role === 2)
        .map((agent) => ({
          ...agent,
          queues: [],
        })),
    };
    this.$nextTick(async () => {
      await this.listSectorsQueues({});
      await this.loadAgentsQueuesPermissions();
      this.firstLoaded = true;
    });
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

    async listSectorsQueues({ toAddQueuesSector, toRemoveQueuesSector }) {
      const sectorsQueues = await Group.listSectorsQueues(
        this.editingProjectGroup.sectors.map((sector) => sector.uuid),
      );

      this.avaliableSectorQueues = Object.entries(sectorsQueues)
        .map(([sectorUuid, data]) => {
          return data.queues.map((queue) => ({
            sectorUuid,
            name: `${data.sector_name} | ${queue.queue_name}`,
            uuid: queue.uuid,
          }));
        })
        .flat();

      if (toAddQueuesSector) {
        this.editingProjectGroup.agents.forEach((agent) => {
          const sectorQueues = this.avaliableSectorQueues.filter(
            (queue) => queue.sectorUuid === toAddQueuesSector,
          );
          agent.queues = agent.queues.concat(sectorQueues);
        });
      }

      if (toRemoveQueuesSector) {
        this.editingProjectGroup.agents.forEach((agent) => {
          agent.queues = agent.queues.filter(
            (queue) => queue.sectorUuid !== toRemoveQueuesSector,
          );
        });
      }
    },

    async loadAgentsQueuesPermissions() {
      const agentsPermissions = await Group.listAgentsQueuesPermissions(
        this.editingProjectGroup.sectors.map((sector) => sector.uuid),
      );

      Object.keys(agentsPermissions).forEach((agentEmail) => {
        const findedAgent = this.editingProjectGroup.agents.find(
          (agent) => agent.user_email === agentEmail,
        );

        if (!findedAgent) return;

        const agentsQueuesPermissions = Object.entries(
          agentsPermissions[agentEmail],
        )
          .map(([, { permissions }]) => permissions || [])
          .flat();

        findedAgent.queues = this.avaliableSectorQueues.filter((queue) =>
          agentsQueuesPermissions.includes(queue.uuid),
        );
      });
    },

    async finish() {
      try {
        this.isLoadingRequest = true;
        await this.updateGroup();
        await this.updateManagers();
        await this.updateSectors();
        await this.updateAgents();
        Unnnic.unnnicCallAlert({
          props: {
            text: this.$t('config_chats.groups.update_success'),
            type: 'success',
          },
          seconds: 5,
        });
      } catch (error) {
        Unnnic.unnnicCallAlert({
          props: {
            text: this.$t('config_chats.groups.update_error'),
            type: 'error',
          },
          seconds: 5,
        });
        console.error(error);
      } finally {
        this.isLoadingRequest = false;
        this.closeDrawer(true);
      }
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

      const agentsWithoutQueuesUuids = this.editingProjectGroup.agents
        .filter((agent) => !agent.queues.length)
        .map((agent) => agent.uuid);

      await Promise.all(
        [...toRemoveAgentsUuids, ...agentsWithoutQueuesUuids].map(
          (permissionUuid) => Group.deleteAuthorization({ permissionUuid }),
        ),
      );

      await Promise.all(
        this.editingProjectGroup.agents
          .filter((agent) => agent.queues.length)
          .map((agent) => {
            const enabledQueuesUuids = agent.queues.map((queue) => queue.uuid);
            const disabledQueuesUuids = this.avaliableSectorQueues
              .filter((queue) => !enabledQueuesUuids.includes(queue.uuid))
              .map((queue) => queue.uuid);
            return Group.addAuthorization({
              groupSectorUuid: this.projectGroup.uuid,
              role: 2,
              permissionUuid: agent.new ? agent.uuid : agent.permission,
              enabledQueues: enabledQueuesUuids,
              disabledQueues: disabledQueuesUuids,
            });
          }),
      );
    },
  },
};
</script>

<style lang="scss" scoped></style>
