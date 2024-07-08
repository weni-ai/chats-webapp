<template>
  <section
    v-if="queue"
    class="view-queue"
  >
    <h2 class="name">{{ queue.name }}</h2>

    <section class="info-group">
      <p class="title">Adicionar novo Agente</p>

      <section class="controls">
        <UnnnicAutocomplete
          v-model="agent.name"
          :data="[]"
          label="Selecionar agente"
          placeholder="Pesquise pelo nome"
          iconLeft="search-1"
          iconRight="keyboard-return-1"
          openWithFocus
          highlight
          class="input"
          @choose="agent.name = $event"
          @keypress.enter="addAgent"
        />
        <UnnnicButton
          type="secondary"
          text="Adicionar agente"
          @click="addAgent"
        />
      </section>
    </section>

    <section
      v-if="queue.agents.length !== 0"
      class="info-group"
    >
      <ListAgents
        :title="`Agentes na fila ${queue.name}`"
        :agents="queue.agents"
        actionText="Remover"
        @select="agentToRemove = $event"
      />
    </section>

    <UnnnicModal
      :showModal="!!agentToRemove.name"
      modalIcon="alert-circle-1"
      scheme="feedback-red"
      :text="`Remover ${agentToRemove.name} de ${queue.name}`"
      description="Tem certeza que deseja remover o agente da fila?"
      @close="agentToRemove = {}"
    >
      <template #options>
        <UnnnicButton
          type="tertiary"
          text="Cancelar"
          @click="agentToRemove = {}"
        />
        <UnnnicButton
          type="secondary"
          text="Confirmar"
          @click="removeAgent(agentToRemove)"
        />
      </template>
    </UnnnicModal>

    <UnnnicModal
      :showModal="isOpenRemoveAgentFeedbackModal"
      modalIcon="check-circle-1-1"
      scheme="feedback-green"
      text="Agente removido da fila"
      :description="`${agentToRemove.name} foi removido da fila Cartão de crédito`"
      @close="(isOpenRemoveAgentFeedbackModal = false), (agentToRemove = {})"
    >
      <template #options>
        <UnnnicButton
          text="Fechar"
          @click="
            (isOpenRemoveAgentFeedbackModal = false), (agentToRemove = {})
          "
        />
      </template>
    </UnnnicModal>
  </section>
</template>

<script>
import ListAgents from '@/components/settings/lists/Agents.vue';

export default {
  name: 'FormEditQueue',

  components: {
    ListAgents,
  },

  props: {
    modelValue: {
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
        return this.modelValue;
      },
      set(queue) {
        this.$emit('update:modelValue', queue);
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
