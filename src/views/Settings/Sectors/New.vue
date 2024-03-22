<template>
  <section class="new-sector">
    <div class="new-sector__indicator">
      <unnnic-indicator :current-step="step" :number-of-steps="3" :titles="stepsTitles" />
    </div>
    <div class="new-sector__divider" />

    <section class="scrollable">
      <section class="new-sector__form">
        <form-sector
          v-show="step === Steps.General"
          v-model="sector"
          :managers="projectManagers"
          @validate="isSectorFormValid = $event"
          @remove-manager="removeManager"
        />

        <form-queue
          v-show="step === Steps.Queues"
          v-model="sector.queue"
          label="Adicionar nova Fila"
          show-info-icon
          :sector="sector"
          @validate="isQueuesFormValid = $event"
        />
        <form-agent
          v-show="step === Steps.Queues"
          v-model="sector.agents"
          :sector="sector"
          :agents="projectAgents"
          @select="addAgent"
          @remove="removeAgent"
          @validate="isAgentsFormValid = $event"
        />
        <form-tags
          v-show="step === Steps.Tags"
          v-model="sector.tags"
          @add="addTag"
          @remove="removeTag"
        />
      </section>
    </section>

    <div class="actions">
      <unnnic-button
        v-if="step !== Steps.Tags"
        :text="$t('sector.save')"
        iconRight="arrow-right-1-1"
        type="secondary"
        :disabled="!isActiveFormValid"
        @click="nextStep"
      />
      <unnnic-button
        v-else
        :disabled="!isActiveFormValid"
        type="secondary"
        text="Salvar"
        @click="nextStep"
      />
    </div>
  </section>
</template>

<script>
import FormAgent from '@/components/settings/forms/Agent';
import FormQueue from '@/components/settings/forms/Queue';
import FormSector from '@/components/settings/forms/Sector';
import FormTags from '@/components/settings/forms/Tags';

import Sector from '@/services/api/resources/settings/sector';
import Queue from '@/services/api/resources/settings/queue';
import Project from '@/services/api/resources/settings/project';

const Steps = Object.freeze({
  General: 1,
  Queues: 2,
  Tags: 3,
});

export default {
  name: 'NewSector',

  components: {
    FormAgent,
    FormQueue,
    FormSector,
    FormTags,
  },

  beforeMount() {
    this.listProjectManagers();
    this.listProjectAgents();
  },

  data() {
    return {
      sector: {
        uuid: '',
        name: '',
        can_trigger_flows: false,
        can_edit_custom_fields: false,
        sign_messages: false,
        managers: [],
        workingDay: {
          start: '',
          end: '',
        },
        agents: [],
        queue: {
          uuid: '',
        },
        tags: [],
        maxSimultaneousChatsByAgent: '',
      },
      projectManagers: [],
      projectAgents: [],
      isSectorFormValid: false,
      isQueuesFormValid: false,
      isAgentsFormValid: false,
      isOpenSectorConfirmationDialog: false,
      Steps,
      step: Steps.General,
      stepsTitles: [this.$t('sector.geral'), this.$t('sector.queues'), this.$t('sector.tags')],
    };
  },

  computed: {
    isActiveFormValid() {
      if (!this.step) return false;

      const steps = {
        [Steps.General]: this.isSectorFormValid,
        [Steps.Queues]: this.isQueuesFormValid && this.isAgentsFormValid,
        [Steps.Tags]: this.sector.tags.length > 0,
      };

      return steps[this.step];
    },
  },

  methods: {
    async listProjectManagers() {
      const managers = (await Project.managers()).results.concat((await Project.admins()).results);
      this.projectManagers = managers;
    },
    async listProjectAgents() {
      const agents = (await Project.agents()).results.concat((await Project.admins()).results);
      const uniqueAgents = [...new Map(agents.map((agent) => [agent.uuid, agent])).values()];

      this.projectAgents = uniqueAgents;
    },
    async nextStep() {
      const steps = {
        [Steps.General]: this.handleGeneralNextStep,
        [Steps.Queues]: this.handleQueueNextStep,
        [Steps.Tags]: this.handleTagsNextStep,
      };

      await steps[this.step]?.();
    },
    async handleGeneralNextStep() {
      const sector = await this.createSector();
      this.sector.uuid = sector.uuid;
      await this.addManagers();
      this.step = Steps.Queues;
    },
    async addManagers() {
      await Promise.all(this.sector.managers.map(this.addManager));
    },
    async handleQueueNextStep() {
      const queue = await this.createQueue();
      this.sector.queue = queue;
      await Promise.all(this.sector.agents.map(this.addAgentToQueue));
      this.step = Steps.Tags;
    },
    async handleTagsNextStep() {
      await this.createTags();
      this.$router.push({
        name: 'sectors',
      });
    },
    async addAgentToQueue(agent) {
      await Queue.addAgent(this.sector.queue.uuid, agent.uuid);
    },
    async createSector() {
      const {
        name,
        can_trigger_flows,
        can_edit_custom_fields,
        sign_messages,
        maxSimultaneousChatsByAgent,
        workingDay,
      } = this.sector;
      const props = {
        name,
        can_trigger_flows: can_trigger_flows !== '',
        can_edit_custom_fields: can_edit_custom_fields !== '',
        sign_messages: sign_messages !== '',
        rooms_limit: Number(maxSimultaneousChatsByAgent),
        work_start: workingDay.start,
        work_end: workingDay.end,
      };
      const sector = await Sector.create(props);
      return sector;
    },
    async createQueue() {
      const queue = await Queue.create({
        name: this.sector.queue.name,
        sectorUuid: this.sector.uuid,
        default_message: this.sector.queue.default_message,
      });
      return queue;
    },
    async createTags() {
      const { tags } = this.sector;
      await Promise.all(
        tags.map((tag) => {
          return Sector.addTag(this.sector.uuid, tag.name);
        }),
      );
    },
    async addTag(tagName) {
      this.sector.tags.push({
        uuid: Date.now().toString(),
        name: tagName,
      });
    },
    async removeTag(tagUuid) {
      this.sector.tags = this.sector.tags.filter((tag) => tag.uuid !== tagUuid);
    },
    async addManager(manager) {
      await Sector.addManager(this.sector.uuid, manager.uuid);
    },
    removeManager(managerUuid) {
      const managers = this.sector.managers.filter((manager) => manager.uuid !== managerUuid);
      this.sector = {
        ...this.sector,
        managers,
      };
    },
    async addAgent(agent) {
      this.sector.agents.push(agent);
    },
    removeAgent(agentUuid) {
      this.sector.agents = this.sector.agents.filter((agent) => agent.uuid !== agentUuid);
    },
  },
};
</script>

<style lang="scss" scoped>
.new-sector {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding-bottom: 1rem;

  .scrollable {
    overflow-y: auto;
    height: 100%;
    padding-right: 1rem;
  }

  &__indicator {
    padding: 0 calc(2 * $unnnic-spacing-inset-nano);
    position: static;
  }

  &__divider {
    border-top: solid 1px $unnnic-color-neutral-soft;
    margin-top: calc(2 * $unnnic-spacing-inline-md);
  }

  &__form {
    margin-top: $unnnic-spacing-inline-md;
  }

  .actions {
    margin-top: auto;
    margin-right: 1.5rem;
    padding-top: 1.5rem;

    & > * {
      width: 100%;
    }
  }
}
</style>
