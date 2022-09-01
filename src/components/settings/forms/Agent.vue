<template>
  <section class="form-agent">
    <section class="section">
      <p class="title">Adicionar agentes</p>

      <section class="controls">
        <unnnic-autocomplete
          v-model="agent.name"
          :data="projectAgents"
          @choose="agent.name = $event"
          label="Selecionar agente"
          placeholder="Pesquise pelo nome ou email"
          iconLeft="search-1"
          iconRight="keyboard-return-1"
          open-with-focus
          highlight
          class="input"
        />
        <unnnic-button type="secondary" text="Selecionar" />
      </section>
    </section>

    <section v-if="!!agents.length">
      <list-agents :agents="agents" :title="`Agentes no setor ${sector}`" />
    </section>
  </section>
</template>

<script>
import ListAgents from '@/components/settings/lists/Agents';

export default {
  name: 'FormAgent',

  components: {
    ListAgents,
  },

  props: {
    queues: {
      type: Array,
      default: () => [],
    },
    sector: {
      type: String,
      default: '',
    },
    value: {
      type: Array,
      default: () => [],
    },
  },

  data: () => ({
    agent: {
      name: '',
      queues: [],
    },
    projectAgents: [
      'Mariano Matos',
      'Carla Meyer',
      'Katia Saldanha',
      'Vinícius Brum',
      'Raine Paula',
    ],
    queue: '',
    isOpenAgentConfirmationDialog: false,
  }),

  computed: {
    agents: {
      get() {
        return this.value;
      },
      set(agents) {
        this.$emit('input', agents);
      },
    },
  },

  methods: {
    validate() {
      return this.agents.length > 0;
    },
  },

  watch: {
    agents: {
      deep: true,
      immediate: true,
      handler() {
        this.$emit('validate', this.validate());
      },
    },
  },
};
</script>

<style lang="scss" scoped>
.form-agent {
  .section {
    margin-bottom: 1.5rem;
  }

  .title {
    font-weight: $unnnic-font-weight-bold;
    color: $unnnic-color-neutral-dark;
    font-size: $unnnic-font-size-body-lg;
    line-height: 1.5rem;

    margin-bottom: 0.5rem;
  }

  .controls {
    display: flex;
    align-items: flex-end;
    gap: 1rem;

    .input {
      flex: 1 1;
    }
  }

  .agent-queues {
    margin-top: 1rem;
    display: grid;
    gap: 0.5rem 1rem;
    grid-template-columns: 1fr 1fr;

    & > * {
      padding: 0.25rem 0.5rem;
      margin: 0 0.5rem;
      background: $unnnic-color-background-carpet;
      color: $unnnic-color-neutral-dark;
      font-size: 0.875rem;
      line-height: 1.375rem;
    }
  }

  .new-agent-button {
    width: 100%;
    margin-bottom: 1.5rem;
  }
}
</style>
