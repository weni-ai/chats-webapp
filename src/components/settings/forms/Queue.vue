<template>
  <section
    v-if="!loadingInfo"
    class="sector-queues-form"
  >
    <UnnnicInput
      v-if="!isEditing"
      v-model="queue.name"
      :label="$t('queues.queue_name')"
      :placeholder="$t('queues.queue_name_placeholder')"
      data-testid="queue-name-input"
      class="input"
    />
    <UnnnicChatText
      class="sector-queues-form__automatic-message"
      titleColor="neutral-dark"
      size="small"
      :title="$t('automatic_message.title')"
      :info="$t('automatic_message.info')"
    >
      <template #actions>
        <UnnnicButton
          v-if="!editingAutomaticMessage"
          class="sector-queues-form__automatic-message-button"
          type="secondary"
          iconCenter="edit"
          data-testid="edit-automatic-message-button"
          size="small"
          @click="handlerEditAutomaticMessage()"
        />
      </template>
      <template #description>
        <UnnnicTextArea
          v-if="editingAutomaticMessage"
          ref="textEditor"
          v-model="queue.default_message"
          class="sector-queues-form__automatic-message-textarea"
          :maxLength="250"
          size="sm"
          :placeholder="$t('automatic_message.placeholder')"
          data-testid="automatic-message-textarea"
          @focus="focusTextEditor"
          @focusout="editingAutomaticMessage = false"
        />

        <p
          v-else
          data-testid="queue-default-message"
        >
          {{ queue.default_message || $t('automatic_message.placeholder') }}
        </p>
      </template>
    </UnnnicChatText>

    <AgentsForm
      v-model="queue.currentAgents"
      :sector="sector"
      :agents="agentsOptions"
      @remove="handlerRemoveAgent($event)"
      @select="handlerAddAgent($event)"
    />
  </section>
</template>

<script>
import AgentsForm from './Agent.vue';

import Queue from '@/services/api/resources/settings/queue';
import Project from '@/services/api/resources/settings/project';

export default {
  name: 'FormQueue',
  components: { AgentsForm },
  props: {
    modelValue: {
      type: Object,
      required: true,
    },
    sector: { type: Object, required: true },
  },

  emits: ['update:modelValue', 'update-queue-agents-count'],

  data() {
    return {
      editingAutomaticMessage: false,
      loadingInfo: false,
      agentsOptions: [],
    };
  },

  computed: {
    isEditing() {
      return !!this.queue.uuid;
    },
    queue: {
      get() {
        return this.modelValue;
      },
      set(value) {
        this.$emit('update:modelValue', value);
      },
    },
  },

  async mounted() {
    this.loadingInfo = true;
    if (this.isEditing) {
      this.queue = {
        ...(await Queue.getQueueInformation(this.queue.uuid)),
        agents: this.queue.agents,
      };

      await this.listQueueAgents();
    } else {
      this.queue = { ...this.queue, default_message: '', currentAgents: [] };
    }

    this.listProjectAgents();

    this.loadingInfo = false;
  },
  methods: {
    handlerEditAutomaticMessage() {
      this.editingAutomaticMessage = true;
      this.focusTextEditor();
    },
    focusTextEditor() {
      this.$nextTick(() => {
        this.$refs.textEditor?.focus();
      });
    },
    async listProjectAgents() {
      this.agentsOptions = (await Project.agents()).results;
    },
    async listQueueAgents() {
      const response = await Queue.agents(this.queue.uuid, 0, 9999);
      this.queue.currentAgents = response.results;
    },
    async handlerRemoveAgent(agentUuid) {
      if (this.isEditing) await Queue.removeAgent(agentUuid);
      this.queue.currentAgents = this.queue.currentAgents.filter(
        (agent) => agent.uuid !== agentUuid,
      );

      this.queue.agents--;
      this.$emit('update-queue-agents-count', this.queue);
    },

    async handlerAddAgent(agent) {
      const { currentAgents } = this.queue;

      const alreadyInQueue = currentAgents.some((a) => a.uuid === agent.uuid);

      if (!alreadyInQueue & this.isEditing) {
        const { data } = await Queue.addAgent(this.queue.uuid, agent.uuid);

        this.queue.currentAgents.push({
          ...agent,
          uuid: data.uuid,
        });
        this.queue.agents++;
        this.$emit('update-queue-agents-count', this.queue);
      } else {
        this.queue.currentAgents.push(agent);
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.sector-queues-form {
  display: grid;

  &__automatic-message {
    max-width: 100% !important;
    max-height: 100% !important;

    &-button {
      :deep(.unnnic-icon-size--sm) {
        font-size: $unnnic-font-size-title-sm;
      }
    }
    &-textarea {
      word-break: break-all;
    }
  }

  :deep(.unnnic-form__label) {
    margin-top: 0;
  }
}
</style>
