<template>
  <section v-if="agent" class="edit-agent">
    <h2 class="name">{{ agent.name }}</h2>

    <section class="info-group">
      <section class="info-group">
        <p class="title">Selecionar filas para o agente</p>

        <section class="controls">
          <unnnic-autocomplete
            v-model="queueName"
            :data="filteredQueues"
            @keypress.enter="addQueue"
            label="Selecionar fila"
            placeholder="Pesquise pelo nome da fila"
            iconLeft="search-1"
            iconRight="keyboard-return-1"
            open-with-focus
            highlight
            class="input"
          />
          <unnnic-button type="secondary" text="Adicionar fila" @click="addQueue" />
        </section>
      </section>
    </section>

    <section v-if="selectedQueues.length !== 0" class="info-group">
      <list-queues
        title="Filas relacionadas ao agente"
        :agents="selectedQueues"
        action-text="Remover"
        @select="removeQueue($event)"
      />
    </section>
  </section>
</template>

<script>
import ListQueues from '@/components/settings/lists/Agents';

export default {
  name: 'FormEditAgent',

  components: {
    ListQueues,
  },

  props: {
    queues: {
      type: Array,
      default: () => [],
    },
    value: {
      type: Object,
      default: () => ({}),
    },
  },

  data: () => ({
    queue: null,
    queueName: '',
    selectedQueues: [
      { name: 'Cartão de crédito', additionDate: '25/03/2022' },
      { name: 'Fila 2', additionDate: '25/03/2022' },
    ],
  }),

  computed: {
    agent: {
      get() {
        return this.value;
      },
      set(agent) {
        this.$emit('input', agent);
      },
    },
    filteredQueues() {
      const selectedQueues = this.selectedQueues.map((q) => q.name);

      return this.queues.filter((q) => !selectedQueues.includes(q));
    },
  },

  methods: {
    addQueue() {
      this.selectedQueues.unshift({
        name: this.queueName,
        additionDate: Intl.DateTimeFormat('pt-BR', {
          dateStyle: 'short',
        }).format(new Date()),
      });

      this.queueName = '';
    },
    removeQueue(queue) {
      this.selectedQueues = this.selectedQueues.filter((q) => q.name !== queue.name);
    },
  },
};
</script>

<style lang="scss" scoped>
.edit-agent {
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
