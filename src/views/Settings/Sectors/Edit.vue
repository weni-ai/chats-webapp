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
          <unnnic-breadcrumb
            class="edit-sector__breadcrumb"
            :crumbs="queueBreadcrumb"
            @crumbClick="handleCrumbClick"
          />
          <h2 class="edit-sector__title">{{ queueToEdit.name }}</h2>
          <div style="margin-bottom: 24px">
            <unnnic-chat-text
              style="max-width: 100%; max-height: 100%"
              titleColor="neutral-dark"
              size="small"
              title="Mensagem automática"
              info="Defina uma resposta automática para ser enviada ao contato enquanto
            está aguardando atendimento, deixe em branco caso não queira
            nenhuma mensagem."
            >
              <template slot="actions">
                <unnnic-button-icon
                  v-if="!editContent"
                  type="secondary"
                  size="small"
                  icon="pencil-write-1"
                  @click="editDescription"
                />
              </template>
              <template slot="description">
                <div @focusout="saveEditDescription" style="word-break: break-all">
                  <span v-show="!editContent">{{ description }}</span>
                  <div v-show="editContent" @focusout="saveEditDescription">
                    <unnnic-text-area
                      @focus="focusTextEditor"
                      :maxLength="250"
                      size="sm"
                      placeholder="Por enquanto você não definiu uma mensagem automática, defina uma mensagem para seus contatos que estão aguardando"
                      v-model="content"
                      ref="textEditor"
                    />
                  </div>
                </div>
              </template>
            </unnnic-chat-text>
          </div>
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
                  (agentToRemoveUuid) => agentToRemoveUuid !== agent.uuid,
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

      <template #messages>
        <form-messages
          ref="formMessages"
          :quick-messages-shared="quickMessagesShared"
          :sector="sector"
          @update-is-quick-message-editing="handleIsQuickMessageEditing"
          @validate="isQuickMessagesFormValid = $event"
        />
      </template>

      <template #tags>
        <form-tags v-model="tags" @add="addTagToAddList" @remove="addTagToRemoveList" />
      </template>
    </sector-tabs>

    <section class="actions">
      <unnnic-button
        v-if="!!queueToEdit && this.currentTab === 'queues'"
        text="Excluir fila"
        icon-left="delete-1"
        type="tertiary"
        @click="openModalDeleteQueue(queueToEdit)"
      />
      <unnnic-button
        :text="$t('cancel')"
        type="tertiary"
        @click="cancel"
        v-if="this.isQuickMessageEditing"
      />
      <section class="buttons">
        <unnnic-button
          :text="$t('save')"
          type="secondary"
          @click="save"
          :disabled="isQuickMessageEditing && !isQuickMessagesFormValid"
          v-if="
            this.currentTab === 'sector' ||
            this.queueToEdit ||
            this.isQuickMessageEditing ||
            currentTab === 'tags'
          "
        />
      </section>
      <unnnic-button
        v-if="this.currentTab === 'messages' && !isQuickMessageEditing"
        :text="$t('quick_messages.new')"
        icon-left="add"
        type="secondary"
        @click="() => messagesHandler('create')"
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
          <unnnic-button type="tertiary" @click="closeModalDeleteQueue" :text="$t('cancel')" />
          <unnnic-button
            type="secondary"
            @click="deleteQueue(selectedQueue.uuid)"
            :text="$t('confirm')"
          />
        </template>
      </unnnic-modal>
    </section>
  </section>
</template>

<script>
import { mapActions, mapState } from 'vuex';

import { unnnicCallAlert } from '@weni/unnnic-system';

import FormAgent from '@/components/settings/forms/Agent';
import FormSector from '@/components/settings/forms/Sector';
import FormQueue from '@/components/settings/forms/Queue';
import FormMessages from '@/components/settings/forms/Messages';
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
    FormMessages,
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
    if (['sector', 'queues', 'messages', 'tags'].includes(this.tab)) this.currentTab = this.tab;

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
      can_trigger_flows: '',
      can_edit_custom_fields: '',
      sign_messages: '',
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
    queueBreadcrumb: [
      {
        name: 'Filas',
      },
      {
        name: '',
      },
    ],
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
    page: 0,
    pageAgents: 0,
    hasNextAgents: false,
    agentsList: [],
    description:
      'Por enquanto você não definiu uma mensagem automática, defina uma mensagem para seus contatos que estão aguardando',
    editContent: false,
    content: '',
    isQuickMessageEditing: false,
    isQuickMessagesFormValid: false,
  }),

  computed: {
    ...mapState({
      quickMessagesShared: (state) => state.chats.quickMessagesShared.quickMessagesShared,
    }),
  },

  methods: {
    ...mapActions({
      setCopilotActive: 'config/setCopilotActive',
      setCopilotCustomRulesActive: 'config/setCopilotCustomRulesActive',
      setCopilotCustomRules: 'config/setCopilotCustomRules',
    }),

    resetTabsData() {
      this.queueToEdit = null;
      this.isQuickMessageEditing = false;
      this.pageAgents = 0;
      this.$refs.formMessages?.resetQuickMessageToUpdate();
    },
    focusTextEditor() {
      this.$nextTick(() => {
        this.$refs.textEditor?.focus();
      });
    },
    handleIsQuickMessageEditing(boolean) {
      this.isQuickMessageEditing = boolean;
    },
    async messagesHandler(action) {
      const { uuid } = this;
      const { formMessages } = this.$refs;

      const actions = {
        create: () => {
          formMessages.create();
          this.isQuickMessageEditing = true;
        },
        save: () => {
          formMessages.save({ uuid });
          this.isQuickMessageEditing = false;
        },
      };

      if (actions[action]) {
        actions[action]();
      } else {
        console.error('Invalid action.');
      }
    },
    async listProjectManagers() {
      const managers = (await Project.managers()).results.concat((await Project.admins()).results);
      this.projectManagers = managers;
    },
    async createQueue({ name, default_message }) {
      try {
        const sectorUuid = this.sector.uuid;
        this.createdQueue = await Queue.create({ name, sectorUuid, default_message });
        this.visualizeQueue(this.createdQueue);
      } catch (error) {
        console.log(error, 'error');
      }
    },

    async visualizeQueue(queue) {
      this.loading = true;
      try {
        let agents = [];
        if (queue.uuid) {
          const response = await Queue.agents(queue.uuid, this.pageAgents * 100, 100);
          this.pageAgents += 1;
          this.agentsList = response.results;
          agents = this.agentsList;
          this.hasNextAgents = response.next;
          this.loading = false;
          this.searchDefaultMessage(queue.uuid);
        }
        await this.getProjectAgents();
        this.queueToEdit = queue;
        this.queueToEdit.agents = [...agents];
        this.queueToEdit.currentAgents = [...agents];
        this.queueToEdit.toAddAgents = [];
        this.queueToEdit.toRemoveAgents = [];
        this.queueBreadcrumb.at(-1).name = this.queueToEdit.name;
        this.searchDefaultMessage(queue.uuid);
      } finally {
        this.loading = false;
      }
      if (this.hasNextAgents) {
        this.visualizeQueue(this.queueToEdit);
      }
    },
    async deleteQueue(queueUuid) {
      await Queue.delete(queueUuid);
      this.queues = this.queues.filter((queue) => queue.uuid !== queueUuid);
      this.openModalDelete = true;
    },
    async openModalDeleteQueue(queue) {
      this.selectedQueue = queue;
      this.openModal = true;
    },
    async closeModalDeleteQueue() {
      this.openModal = false;
    },
    async getSector() {
      const {
        name,
        can_trigger_flows,
        can_edit_custom_fields,
        config,
        sign_messages,
        rooms_limit,
        uuid,
        work_end,
        work_start,
      } = await Sector.find(this.uuid);
      this.sector = {
        ...this.sector,
        uuid,
        name,
        can_trigger_flows,
        can_edit_custom_fields,
        config,
        sign_messages,
        workingDay: { start: this.normalizeTime(work_start), end: this.normalizeTime(work_end) },
        maxSimultaneousChatsByAgent: rooms_limit.toString(),
      };
      this.setCopilotActive(this.sector.config.can_use_chat_completion);
      this.setCopilotCustomRulesActive(this.sector.config.can_input_context);
      this.setCopilotCustomRules(this.sector.config.completion_context);
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
      this.loading = true;
      let hasNext = false;
      try {
        const queues = await Queue.list(this.sector.uuid, this.page * 10, 10);
        this.page += 1;
        this.queues = this.queues.concat(queues.results);

        hasNext = queues.next;

        this.loading = false;
      } finally {
        this.loading = false;
      }
      if (hasNext) {
        this.getQueues();
      }
    },
    async getTags() {
      const tags = await Sector.tags(this.sector.uuid);
      this.tags = tags.results;
      this.currentTags = [...tags.results];
    },

    async cancel() {
      this.resetTabsData();
    },

    async save() {
      if (this.currentTab === 'sector') await this.saveSector();
      if (this.currentTab === 'queues' && this.queueToEdit) await this.saveQueue();
      if (this.currentTab === 'messages') await this.messagesHandler('save');
      if (this.currentTab === 'tags') await this.saveTags();

      if (['queues', 'messages'].includes(this.currentTab)) {
        this.resetTabsData();
        return;
      }

      this.$router.push({ name: 'sectors' });
    },

    async removeManager(managerUuid) {
      await Sector.removeManager(managerUuid);
      this.removeManagerFromTheList(managerUuid);
    },
    async saveSector() {
      const {
        uuid,
        name,
        can_trigger_flows,
        can_edit_custom_fields,
        sign_messages,
        workingDay,
        maxSimultaneousChatsByAgent,
      } = this.sector;

      const sector = {
        name,
        can_trigger_flows,
        can_edit_custom_fields,
        sign_messages,
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
          text: 'Alterações salvas',
          type: 'success',
        },
        seconds: 5,
      });
    },
    async handleTabChange(currentTab) {
      if (currentTab === 'sector') return;
      if (currentTab === 'queues' && this.queues.length === 0) await this.getQueues();
      if (currentTab === 'tags' && this.tags.length === 0) await this.getTags();

      this.resetTabsData();
    },
    removeManagerFromTheList(managerUuid) {
      const manager = this.sector.managers.find((manager) => manager.uuid === managerUuid);
      if (!manager) return;

      this.removedManagers.push(manager);
      this.sector.managers = this.sector.managers.filter((manager) => manager.uuid !== managerUuid);
    },
    updateQueryParams(currentTab) {
      const query = {};
      if (['sector', 'queues', 'messages', 'tags'].includes(currentTab)) {
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

    editDescription() {
      if (this.queueInfo.default_message) this.content = this.queueInfo.default_message;
      this.editContent = true;
      this.focusTextEditor();
    },

    async searchDefaultMessage(uuid) {
      try {
        this.queueInfo = await Queue.getQueueInformation(uuid);
        if (![null, undefined, ''].includes(this.queueInfo.default_message)) {
          this.description = this.queueInfo.default_message;
        } else {
          this.description =
            'Por enquanto você não definiu uma mensagem automática, defina uma mensagem para seus contatos que estão aguardando';
        }
      } catch (error) {
        console.log(error);
      }
    },

    async saveEditDescription() {
      const saveQueue = {
        uuid: this.queueInfo.uuid,
        default_message: this.content,
      };
      try {
        await Queue.editQueue(saveQueue);
        this.description = this.content;
        this.editContent = false;
        this.searchDefaultMessage(this.queueInfo.uuid);
        this.getQueues();
        unnnicCallAlert({
          props: {
            text: 'Atualizações salvas',
            type: 'success',
          },
          seconds: 5,
        });
      } catch (error) {
        console.log(error);
      }
    },

    cancelEditDescription() {
      this.editContent = false;
      if (!this.queueToEdit.default_message) this.queueToEdit.default_message = '';
    },

    handleCrumbClick(queueCrumb) {
      if (queueCrumb.name === this.queueToEdit.name) return;

      this.queueToEdit = null;
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

  .scrollable {
    height: 100%;
    overflow-y: auto;
    padding-right: $unnnic-spacing-sm;
  }

  .actions {
    display: flex;
    gap: $unnnic-spacing-sm;
    margin-top: auto;
    margin-right: $unnnic-spacing-sm;
    padding-top: $unnnic-spacing-sm;

    & > * {
      width: 100%;
    }
  }

  .buttons {
    display: flex;
    flex-direction: column;
    gap: $unnnic-spacing-sm;
  }

  &__breadcrumb {
    margin: $unnnic-spacing-inline-sm 0;

    ::v-deep .unnnic-breadcrumb__container {
      align-items: center;

      &__divider {
        display: flex;

        svg {
          top: 0;
        }
      }
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
