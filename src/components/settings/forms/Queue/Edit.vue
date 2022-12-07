<template>
  <section v-if="queue" class="view-queue">
    <h2 class="name">{{ queue.name }}</h2>

    <section class="info-group">
      <p class="title">Adicionar novo Agente</p>

      <section class="controls">
        <unnnic-autocomplete
          v-model="agent.name"
          :data="[]"
          @choose="agent.name = $event"
          @keypress.enter="addAgent"
          label="Selecionar agente"
          placeholder="Pesquise pelo nome"
          iconLeft="search-1"
          iconRight="keyboard-return-1"
          open-with-focus
          highlight
          class="input"
        />
        <unnnic-button type="secondary" text="Adicionar agente" @click="addAgent" />
      </section>
    </section>

    <section v-if="queue.agents.length !== 0" class="info-group">
      <list-agents
        :title="`Agentes na fila ${queue.name}`"
        :agents="queue.agents"
        action-text="Remover"
        @select="agentToRemove = $event"
      />
    </section>

    <unnnic-modal
      :showModal="!!agentToRemove.name"
      modalIcon="alert-circle-1"
      scheme="feedback-red"
      :text="`Remover ${agentToRemove.name} de ${queue.name}`"
      description="Tem certeza que deseja remover o agente da fila?"
      @close="agentToRemove = {}"
    >
      <template #options>
        <unnnic-button type="terciary" @click="agentToRemove = {}" text="Cancelar" />
        <unnnic-button type="secondary" @click="removeAgent(agentToRemove)" text="Confirmar" />
      </template>
    </unnnic-modal>

    <unnnic-modal
      :showModal="isOpenRemoveAgentFeedbackModal"
      modalIcon="check-circle-1-1"
      scheme="feedback-green"
      text="Agente removido da fila"
      :description="`${agentToRemove.name} foi removido da fila Cartão de crédito`"
      @close="(isOpenRemoveAgentFeedbackModal = false), (agentToRemove = {})"
    >
      <template #options>
        <unnnic-button
          @click="(isOpenRemoveAgentFeedbackModal = false), (agentToRemove = {})"
          text="Fechar"
        />
      </template>
    </unnnic-modal>
  </section>
</template>

<script>
import ListAgents from '@/components/settings/lists/Agents';

export default {
  name: 'FormEditQueue',

  components: {
    ListAgents,
  },

  props: {
    value: {
      type: Object,
      default: () => ({}),
    },
  },

  data: () => ({
    agent: {
      name: '',
    },
    agentToRemove: {},
    isOpenRemoveAgentFeedbackModal: false,
  }),

  computed: {
    queue: {
      get() {
        return this.value;
      },
      set(queue) {
        this.$emit('input', queue);
      },
    },
  },

  methods: {
    addAgent() {
      const { name } = this.agent;
      const agent = {
        name,
        additionDate: Intl.DateTimeFormat('pt-BR', {
          dateStyle: 'short',
        }).format(new Date()),
      };

      this.queue = {
        ...this.queue,
        agents: [{ ...agent }, ...this.queue.agents],
      };

      this.agent.name = '';
    },
    removeAgent(agent) {
      this.queue = {
        ...this.queue,
        agents: this.queue.agents.filter((a) => a.name !== agent.name),
      };

      this.isOpenRemoveAgentFeedbackModal = true;
    },
  },
};
</script>

<style lang="scss" scoped>
.view-queue {
  .name {
    font-size: $unnnic-font-size-title-sm;
    color: $unnnic-color-neutral-dark;
    line-height: 1.75rem;
    margin-bottom: $unnnic-spacing-stack-sm;
  }

  .info-group {
    margin-bottom: $unnnic-spacing-stack-md;

    .title {
      font-size: $unnnic-font-size-body-lg;
      font-weight: $unnnic-font-weight-bold;
      color: $unnnic-color-neutral-dark;
      line-height: 1.5rem;
      margin-bottom: $unnnic-spacing-stack-sm;
    }

    .controls {
      display: flex;
      align-items: flex-end;
      gap: 1rem;

      .input {
        flex: 1 1;
      }
    }
  }
}
</style>
