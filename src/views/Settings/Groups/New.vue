<template>
  <UnnnicDrawer
    v-show="!showConfirmDiscartChangesModal"
    ref="newProjectGroupDrawer"
    :modelValue="show"
    :title="$t('config_chats.groups.new.title')"
    :primaryButtonText="activePageIndex === 2 ? $t('save') : $t('continue')"
    :secondaryButtonText="activePageIndex === 0 ? $t('cancel') : $t('back')"
    :disabledPrimaryButton="!isValid[activePageKey]"
    :loadingPrimaryButton="isLoadingCreate"
    size="xl"
    @primary-button-click="
      activePageIndex === 2 ? finish() : (activePageIndex = activePageIndex + 1)
    "
    @secondary-button-click="
      activePageIndex === 0
        ? $refs.newProjectGroupDrawer.close()
        : (activePageIndex = activePageIndex - 1)
    "
    @close="closeDrawer"
  >
    <template #content>
      <UnnnicNavigator
        :pages="newGroupsPages"
        :activePage="activePage"
      />
      <section class="form">
        <General
          v-show="activePage === $t('config_chats.groups.general')"
          v-model="group"
          @change-valid="updateIsValid('general', $event)"
        />
        <Projects
          v-show="activePage === $t('config_chats.groups.projects')"
          v-model="group"
          @change-valid="updateIsValid('projects', $event)"
        />
        <Agents
          v-show="activePage === $t('config_chats.groups.agents')"
          v-model="group"
          :queuesOptions="avaliableSectorQueues"
          @change-valid="updateIsValid('agents', $event)"
        />
      </section>
    </template>
  </UnnnicDrawer>

  <DiscartChangesModal
    v-if="showConfirmDiscartChangesModal"
    v-model="showConfirmDiscartChangesModal"
    :title="$t('config_chats.groups.discart.title')"
    :text="$t('config_chats.groups.discart.text')"
    data-testid="discart-changes-modal"
    @cancel="showConfirmDiscartChangesModal = false"
    @confirm="$emit('close')"
  />
</template>

<script>
import General from './Forms/General.vue';
import Projects from './Forms/Projects.vue';
import Agents from './Forms/Agents.vue';

import DiscartChangesModal from '@/views/Settings/DiscartChangesModal.vue';

import Group from '@/services/api/resources/settings/group';

import Unnnic from '@weni/unnnic-system';

import { mapState } from 'pinia';
import { useSettings } from '@/store/modules/settings';

export default {
  name: 'NewProjectGroupDrawer',
  components: {
    General,
    Projects,
    Agents,
    DiscartChangesModal,
  },
  props: {
    show: {
      type: Boolean,
      required: true,
    },
  },
  emits: ['close'],
  data() {
    return {
      group: {
        uuid: '',
        name: '',
        managers: [],
        maxSimultaneousChatsByAgent: '',
        sectors: [],
        agents: [],
      },
      avaliableSectorQueues: [],
      activePageIndex: 0,
      newGroupsPages: [
        this.$t('config_chats.groups.general'),
        this.$t('config_chats.groups.projects'),
        this.$t('config_chats.groups.agents'),
      ],
      isValid: {
        general: false,
        projects: false,
        agents: false,
      },
      showConfirmDiscartChangesModal: false,
      isLoadingCreate: false,
    };
  },
  computed: {
    ...mapState(useSettings, ['groups']),
    activePage() {
      return this.newGroupsPages[this.activePageIndex];
    },
    activePageKey() {
      const mapper = {
        0: 'general',
        1: 'projects',
        2: 'agents',
      };
      return mapper[this.activePageIndex];
    },
    showDiscartQuestion() {
      const { name, managers, maxSimultaneousChatsByAgent, sectors, agents } =
        this.group;

      return !!(
        name ||
        sectors.length ||
        agents.length ||
        Number(maxSimultaneousChatsByAgent || 0) ||
        managers.length
      );
    },
  },
  watch: {
    'group.sectors': {
      deep: true,
      handler(sectors, oldSectors) {
        const sectorsUuids = sectors.map((sector) => sector.uuid);
        const oldSectorsUuids = oldSectors.map((sector) => sector.uuid);

        const toAddQueuesSector = sectorsUuids.filter(
          (sectorUuid) => !oldSectorsUuids.includes(sectorUuid),
        )[0];

        const toRemoveQueuesSector = oldSectorsUuids.filter(
          (sectorUuid) => !sectorsUuids.includes(sectorUuid),
        )[0];

        if (sectors.length) {
          this.listSectorsQueues({ toAddQueuesSector, toRemoveQueuesSector });
        } else {
          this.avaliableSectorQueues = [];
          this.group.agents.forEach((agent) => {
            agent.queues = [];
          });
        }
      },
    },
  },
  mounted() {
    this.listenConnect();
  },
  methods: {
    listenConnect() {
      window.addEventListener('message', (message) => {
        const { event } = message.data;
        if (event === 'close') this.$refs.newProjectGroupDrawer?.close();
      });
    },
    updateIsValid(key, value) {
      this.isValid[key] = value;
    },
    closeDrawer(forceClose) {
      if (this.showDiscartQuestion && !forceClose) {
        this.showConfirmDiscartChangesModal = true;
      } else {
        this.$emit('close');
      }
    },
    async listSectorsQueues({ toAddQueuesSector, toRemoveQueuesSector }) {
      const sectorsUuids = this.group.sectors.map((sector) => sector.uuid);

      const sectorsQueues = await Group.listSectorsQueues(sectorsUuids);

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
        this.group.agents.forEach((agent) => {
          const sectorQueues = this.avaliableSectorQueues.filter(
            (queue) => queue.sectorUuid === toAddQueuesSector,
          );
          agent.queues = agent.queues.concat(sectorQueues);
        });
      }

      if (toRemoveQueuesSector) {
        this.group.agents.forEach((agent) => {
          agent.queues = agent.queues.filter(
            (queue) => queue.sectorUuid !== toRemoveQueuesSector,
          );
        });
      }
    },
    async finish() {
      try {
        this.isLoadingCreate = true;
        const createGroupBody = {
          name: this.group.name,
          rooms_limit: this.group.maxSimultaneousChatsByAgent,
        };

        const createdGroup = await Group.create(createGroupBody);

        this.group.uuid = createdGroup.uuid;

        await this.$nextTick();

        this.groups.unshift(this.group);

        await Promise.all(
          this.group.managers.map((manager) =>
            Group.addAuthorization({
              groupSectorUuid: this.group.uuid,
              permissionUuid: manager.uuid,
              role: 1,
            }),
          ),
        );

        await Promise.all(
          this.group.sectors.map((sector) =>
            Group.addSector({
              groupUuid: this.group.uuid,
              sectorUuid: sector.uuid,
            }),
          ),
        );

        await Promise.all(
          this.group.agents.map((agent) =>
            Group.addAuthorization({
              groupSectorUuid: this.group.uuid,
              permissionUuid: agent.uuid,
              role: 2,
              enabledQueues: agent.queues.map((queue) => queue.uuid),
            }),
          ),
        );

        Unnnic.unnnicCallAlert({
          props: {
            text: this.$t('config_chats.groups.create_success', {
              groupName: this.group.name,
            }),
            type: 'success',
          },
          seconds: 5,
        });
      } catch (error) {
        Unnnic.unnnicCallAlert({
          props: {
            text: this.$t('config_chats.groups.create_error'),
            type: 'error',
          },
          seconds: 5,
        });

        console.log(error);
      } finally {
        this.isLoadingCreate = false;
        this.closeDrawer(true);
      }
    },
  },
};
</script>

<style lang="scss" scoped>
:deep(.unnnic-navigator-pages__page) {
  max-width: 100%;
}
</style>
