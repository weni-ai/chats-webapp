<template>
  <section class="form-queue">
    <p class="title">Adicionar nova Fila</p>

    <section class="controls">
      <unnnic-input
        v-model="name"
        label="Nome da fila"
        placeholder="Suporte nivel III"
        @keypress.enter="createQueue"
        class="input"
      />
      <unnnic-button type="secondary" text="Adicionar fila" @click="createQueue" />
    </section>

    <section v-if="!!queues.length">
      <list-sector-queues :queues="queues" :sector="sector" />
    </section>
  </section>
</template>

<script>
import ListSectorQueues from '@/components/settings/lists/ListSectorQueues';

export default {
  name: 'FormQueue',

  components: {
    ListSectorQueues,
  },

  props: {
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
    name: '',
  }),

  computed: {
    queues: {
      get() {
        return this.value;
      },
      set(queues) {
        this.$emit('input', queues);
      },
    },
  },

  methods: {
    createQueue() {
      const name = this.name.trim();
      if (!name) return;

      this.queues.push({
        name,
        createdAt: Intl.DateTimeFormat('pt-BR', {
          dateStyle: 'short',
        }).format(new Date()),
      });

      this.name = '';
    },
  },
};
</script>

<style lang="scss" scoped>
.form-queue {
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
    gap: 1.5rem;
    margin-bottom: 1.5rem;

    .input {
      flex: 1 1;
    }
  }
}
</style>
