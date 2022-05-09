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
      />
    </section>
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
    addAgent() {},
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
