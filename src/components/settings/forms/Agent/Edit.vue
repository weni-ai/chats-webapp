<template>
  <section
    v-if="agent"
    class="edit-agent"
  >
    <h2 class="name">{{ agent.name }}</h2>

    <section class="info-group">
      <section class="info-group">
        <p class="title">Selecionar filas para o agente</p>

        <section class="controls">
          <UnnnicAutocomplete
            v-model="queueName"
            :data="filteredQueues"
            @keypress.enter="addQueue"
            label="Selecionar fila"
            placeholder="Pesquise pelo nome da fila"
            iconLeft="search-1"
            iconRight="keyboard-return-1"
            openWithFocus
            highlight
            class="input"
          />
          <UnnnicButton
            type="secondary"
            text="Adicionar fila"
            @click="addQueue"
          />
        </section>
      </section>
    </section>

    <section
      v-if="selectedQueues.length !== 0"
      class="info-group"
    >
      <ListQueues
        title="Filas relacionadas ao agente"
        :agents="selectedQueues"
        actionText="Remover"
        @select="queueToRemove = $event"
      />
    </section>

    <UnnnicModal
      :showModal="!!queueToRemove.name"
      modalIcon="alert-circle-1"
      scheme="feedback-red"
      :text="`Remover ${agent.name} de ${queueToRemove.name}`"
      description="Tem certeza que deseja remover o agente da fila?"
      @close="queueToRemove = {}"
    >
      <template #options>
        <UnnnicButton
          type="tertiary"
          @click="queueToRemove = {}"
          text="Cancelar"
        />
        <UnnnicButton
          type="secondary"
          @click="removeQueue(queueToRemove)"
          text="Confirmar"
        />
      </template>
    </UnnnicModal>

    <UnnnicModal
      :showModal="isOpenRemoveQueueFeedbackModal"
      modalIcon="check-circle-1-1"
      scheme="feedback-green"
      text="Agente removido da fila"
      :description="`${agent.name} foi removido da fila Cartão de crédito`"
      @close="isOpenRemoveQueueFeedbackModal = false"
    >
      <template #options>
        <UnnnicButton
          @click="isOpenRemoveQueueFeedbackModal = false"
          text="Fechar"
        />
      </template>
    </UnnnicModal>
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
    queueToRemove: {},
    queueName: '',
    isOpenRemoveQueueFeedbackModal: false,
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
      this.selectedQueues = this.selectedQueues.filter(
        (q) => q.name !== queue.name,
      );

      this.queueToRemove = {};
      this.isOpenRemoveQueueFeedbackModal = true;
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
