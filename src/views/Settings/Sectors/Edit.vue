<template>
  <section class="edit-sector">
    <sector-tabs v-if="sector.uuid" v-model="currentTab" class="scrollable">
      <template #sector>
        <form-sector
          v-model="sector"
          is-editing
          @remove-manager="removeManager"
          :managers="projectManagers"
        />
      </template>

      <template #queues>
        <section v-if="!!queueToEdit" class="edit-sector__edit-queue">
          <h2 class="edit-sector__title">{{ queueToEdit.name }}</h2>
          <form-agent
            v-model="queueToEdit.agents"
            :sector="sector"
            :agents="projectAgents"
            @select="
              (agent) => {
                const alreadyInQueue = queueToEdit.currentAgents.some((a) => a.uuid === agent.uuid);

                if (!alreadyInQueue) {
                  queueToEdit.toAddAgents.push(agent.uuid);
                }
                queueToEdit.agents.push(agent);
                queueToEdit.toRemoveAgents = queueToEdit.toRemoveAgents.filter(
                  (agent) => agent.uuid !== agent.uuid,
                );
              }
            "
            @remove="
              (agentUuid) => {
                const alreadyInQueue = !!queueToEdit.currentAgents.find(
                  (a) => a.uuid === agentUuid,
                );

                if (alreadyInQueue) {
                  queueToEdit.toRemoveAgents.push(agentUuid);
                }
                queueToEdit.agents = queueToEdit.agents.filter((agent) => agent.uuid !== agentUuid);
                queueToEdit.toAddAgents = queueToEdit.toAddAgents.filter(
                  (agent) => agent !== agentUuid,
                );
              }
            "
          />
        </section>
        <form-queue
          v-else
          v-model="queue"
          :sector="sector"
          :queues="queues"
          @visualize="visualizeQueue"
          @add-queue="createQueue"
          label="Criar nova fila"
          is-editing
        />
      </template>

      <template #tags>
        <form-tags v-model="tags" @add="addTagToAddList" @remove="addTagToRemoveList" />
      </template>
    </sector-tabs>

    <section class="actions">
      <unnnic-button
        v-if="!!queueToEdit && this.currentTab === 'queues'"
        text="Excluir"
        icon-left="delete-1"
        type="terciary"
        @click="openModalDeleteQueue(queueToEdit)"
      />
      <unnnic-button
        text="Salvar"
        type="secondary"
        @click="save"
        v-if="this.currentTab === 'sector' || currentTab === 'tags'"
      />
      <unnnic-modal
        :showModal="openModal"
        modalIcon="alert-circle-1"
        scheme="feedback-red"
        :text="`Excluir a fila ${selectedQueue.name}`"
        :description="`A fila ${selectedQueue.name} será permanentemente excluída`"
        @close="closeModalDeleteQueue"
      >
        <template #options>
          <unnnic-button type="terciary" @click="closeModalDeleteQueue" text="Cancelar" />
          <unnnic-button
            type="secondary"
            @click="deleteQueue(selectedQueue.uuid)"
            text="Confirmar"
          />
        </template>
      </unnnic-modal>
    </section>
  </section>
</template>

<script>
import { unnnicCallAlert } from '@weni/unnnic-system';

import FormAgent from '@/components/settings/forms/Agent';
import FormSector from '@/components/settings/forms/Sector';
import FormQueue from '@/components/settings/forms/Queue';
import FormTags from '@/components/settings/forms/Tags';
import SectorTabs from '@/components/settings/SectorTabs';

import Sector from '@/services/api/resources/settings/sector';
import Queue from '@/services/api/resources/settings/queue';
import Project from '@/services/api/resources/settings/project';

export default {
  name: 'EditSector',

  components: {
    FormAgent,
    FormQueue,
    FormSector,
    FormTags,
    SectorTabs,
  },

  props: {
    uuid: [String, Number],
    tab: {
      type: String,
      default: '',
    },
  },

  async beforeMount() {
    if (['sector', 'queues', 'tags'].includes(this.tab)) this.currentTab = this.tab;

    this.getSector();
    this.getManagers();
    this.listProjectManagers();
  },

  data: () => ({
    currentTab: '',
    openModal: false,
    sector: {
      uuid: '',
      name: '',
      workingDay: {
        start: '',
        end: '',
        dayOfWeek: 'week-days',
      },
      managers: [],
      maxSimultaneousChatsByAgent: '',
    },
    queue: {
      name: '',
    },
    queueToEdit: null,
    removedManagers: [],
    queues: [],
    agents: [],
    projectAgents: [],
    projectManagers: [],
    tags: [],
    currentTags: [],
    toAddTags: [],
    toRemoveTags: [],
    selectedQueue: [],
  }),

  methods: {
    async listProjectManagers() {
      const managers = (await Project.managers()).results.concat((await Project.admins()).results);
      this.projectManagers = managers;
    },
    async createQueue({ name }) {
      const sectorUuid = this.sector.uuid;
      await Queue.create({ name, sectorUuid });
      await this.getQueues();
      const lastQueue = this.queues[this.queues.length - 1];
      this.visualizeQueue(lastQueue);
    },
    async visualizeQueue(queue) {
      let agents = [];
      if (queue.uuid) {
        agents = await Queue.agents(queue.uuid);
        agents = agents.results;
      }
      await this.getProjectAgents();
      this.queueToEdit = queue;
      this.queueToEdit.agents = [...agents];
      this.queueToEdit.currentAgents = [...agents];
      this.queueToEdit.toAddAgents = [];
      this.queueToEdit.toRemoveAgents = [];
    },
    async deleteQueue(queueUuid) {
      await Queue.delete(queueUuid);
      this.queues = this.queues.filter((queue) => queue.uuid !== queueUuid);
      this.queueToEdit = null;
      this.closeModalDeleteQueue();
    },
    async openModalDeleteQueue(queue) {
      this.selectedQueue = queue;
      this.openModal = true;
    },
    async closeModalDeleteQueue() {
      this.openModal = false;
    },
    async getSector() {
      const { name, rooms_limit, uuid, work_end, work_start } = await Sector.find(this.uuid);
      this.sector = {
        ...this.sector,
        uuid,
        name,
        workingDay: { start: this.normalizeTime(work_start), end: this.normalizeTime(work_end) },
        maxSimultaneousChatsByAgent: rooms_limit.toString(),
      };
    },
    normalizeTime(time) {
      const timeFormat = /^(?<time>(\d\d):(\d\d))/;
      return time.match(timeFormat)?.groups?.time || time;
    },
    async getProjectAgents() {
      const agents = await Project.agents();
      this.projectAgents = agents.results;
    },
    async getManagers() {
      const managers = await Sector.managers(this.uuid);
      this.sector.managers = managers.results.map((manager) => ({ ...manager, removed: false }));
    },
    async getQueues() {
      const queues = await Queue.list(this.sector.uuid);
      this.queues = queues.results;
    },
    async getTags() {
      const tags = await Sector.tags(this.sector.uuid);
      this.tags = tags.results;
      this.currentTags = [...tags.results];
    },
    async save() {
      if (this.currentTab === 'sector') await this.saveSector();
      if (this.currentTab === 'queues' && this.queueToEdit) await this.saveQueue();
      if (this.currentTab === 'tags') await this.saveTags();

      // this.$router.push({ name: 'sectors' });
    },

    async removeManager(managerUuid) {
      await Sector.removeManager(managerUuid);
      this.removeManagerFromTheList(managerUuid);
    },
    async saveSector() {
      const { uuid, name, workingDay, maxSimultaneousChatsByAgent } = this.sector;
      const sector = {
        name,
        work_start: workingDay.start,
        work_end: workingDay.end,
        rooms_limit: maxSimultaneousChatsByAgent,
      };

      await Sector.update(uuid, sector);
      this.showSuccessfullyUpdateSnackbar();
    },
    async saveQueue() {
      const { uuid, toAddAgents, toRemoveAgents } = this.queueToEdit;

      await Promise.all([
        ...toAddAgents.map((agentUuid) => this.addAgentToQueue(agentUuid, uuid)),
        ...toRemoveAgents.map(this.removeAgentFromQueue),
      ]);

      this.queueToEdit = null;
      this.showSuccessfullyUpdateSnackbar();
      this.getQueues();
    },
    async saveTags() {
      const toAddTags = this.toAddTags.map((tag) => Sector.addTag(this.sector.uuid, tag.name));
      const toRemoveTags = this.toRemoveTags.map((tagUuid) => Sector.removeTag(tagUuid));
      await Promise.all([...toAddTags, ...toRemoveTags]);
      this.showSuccessfullyUpdateSnackbar();
    },
    async addAgentToQueue(agentUuid, queueUuid) {
      await Queue.addAgent(queueUuid, agentUuid);
    },
    async removeAgentFromQueue(agentUuid) {
      await Queue.removeAgent(agentUuid);
    },
    showSuccessfullyUpdateSnackbar() {
      unnnicCallAlert({
        props: {
          title: 'Alterações salvas',
          icon: 'check-circle-1-1-1',
          scheme: 'feedback-green',
          closeText: this.$t('close'),
        },
        seconds: 5,
      });
    },
    async handleTabChange(currentTab) {
      if (currentTab === 'sector') return;
      if (currentTab === 'queues' && this.queues.length === 0) await this.getQueues();
      if (currentTab === 'tags' && this.tags.length === 0) await this.getTags();
      this.queueToEdit = null;
    },
    removeManagerFromTheList(managerUuid) {
      const manager = this.sector.managers.find((manager) => manager.uuid === managerUuid);
      if (!manager) return;

      this.removedManagers.push(manager);
      this.sector.managers = this.sector.managers.filter((manager) => manager.uuid !== managerUuid);
    },
    updateQueryParams(currentTab) {
      const query = {};
      if (['sector', 'queues', 'tags'].includes(currentTab)) {
        query.tab = currentTab;
      }

      this.$router.replace({
        name: 'sectors.edit',
        query,
      });
    },
    addTagToRemoveList(tagUuid) {
      if (this.currentTags.some((tag) => tag.uuid === tagUuid)) {
        this.toRemoveTags.push(tagUuid);
      }
      this.tags = this.tags.filter((tag) => tag.uuid !== tagUuid);
      this.toAddTags = this.toAddTags.filter((tag) => tag.uuid !== tagUuid);
    },
    addTagToAddList(tagName) {
      const tag = {
        name: tagName,
        uuid: Date.now().toString(),
      };
      this.toAddTags.push(tag);
      this.tags.push(tag);
    },
  },

  watch: {
    currentTab(current) {
      if (this.$route.query.tab !== current) this.updateQueryParams(current);

      this.handleTabChange(current);
    },
  },
};
</script>

<style lang="scss" scoped>
.edit-sector {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding-bottom: 1rem;

  .scrollable {
    height: 100%;
    overflow-y: auto;
    padding-right: 1rem;
    // margin-right: 0.5rem;
  }

  .actions {
    display: flex;
    gap: 1rem;
    margin-top: auto;
    margin-right: 1.5rem;
    padding-top: 1.5rem;

    & > * {
      width: 100%;
    }
  }

  &__edit-queue {
    height: 100%;
  }

  &__title {
    font-size: $unnnic-font-size-title-sm;
    font-weight: $unnnic-font-weight-bold;
    color: $unnnic-color-neutral-dark;
    margin-bottom: $unnnic-spacing-inline-md;
  }
}
</style>
