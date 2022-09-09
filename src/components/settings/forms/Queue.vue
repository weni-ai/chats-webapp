<template>
  <section class="form-queue">
    <p v-if="!showInfoIcon" class="form-queue__description">{{ infoText }}</p>
    <p class="title">
      {{ label }}
      <unnnic-tool-tip v-if="showInfoIcon" enabled side="right" :text="infoText">
        <unnnic-icon-svg icon="information-circle-4" scheme="neutral-soft" size="sm" />
      </unnnic-tool-tip>
    </p>

    <section class="controls">
      <unnnic-input
        v-model="queue.name"
        label="Nome da fila"
        placeholder="Exemplo: Pagamentos"
        class="input"
      />
      <unnnic-button v-if="isEditing" text="Salvar" type="secondary" @click="addQueue" />
    </section>

    <section v-if="isEditing" class="form-queue__queues">
      <sector-queues-list :sector="sector.name" :queues="queues" @visualize="visualize" />
    </section>
  </section>
</template>

<script>
import SectorQueuesList from '@/components/settings/lists/ListSectorQueues';

export default {
  name: 'FormQueue',

  components: {
    SectorQueuesList,
  },

  props: {
    isEditing: {
      type: Boolean,
      default: false,
    },
    queues: {
      type: Array,
      default: () => [],
    },
    label: {
      type: String,
      default: '',
    },
    sector: {
      type: Object,
      default: () => ({}),
    },
    showInfoIcon: {
      type: Boolean,
      default: false,
    },
    value: {
      type: Object,
      default: () => ({}),
    },
  },

  data: () => ({
    infoText:
      'As filas servem para organizar os tipos de atendimento dentro de um setor, através das filas é possível criar grupos de atendimento, crie pelo menos uma fila para gerenciar uma equipe de agentes.',
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
    visualize(queue) {
      this.$emit('visualize', queue);
    },
    addQueue() {
      this.$emit('add-queue', this.queue);
    },
    validate() {
      return !!this.queue.name;
    },
  },

  watch: {
    queue: {
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
.form-queue {
  &__description {
    font-size: $unnnic-font-size-body-md;
    color: $unnnic-color-neutral-cloudy;
    margin: $unnnic-spacing-inline-xs 0 $unnnic-spacing-inline-md;
  }

  .title {
    font-weight: $unnnic-font-weight-bold;
    color: $unnnic-color-neutral-dark;
    font-size: $unnnic-font-size-body-lg;
    line-height: 1.5rem;

    margin-bottom: 1rem;
  }

  .controls {
    display: flex;
    align-items: flex-end;
    gap: $unnnic-spacing-stack-sm;
    margin-bottom: 1.5rem;

    .input {
      flex: 1 1;
    }
  }
}
</style>
