<template>
  <section class="form-queue">
    <p class="title">Adicionar nova Fila</p>

    <section class="controls">
      <unnnic-input
        v-model="queueName"
        label="Nome da fila"
        placeholder="Suporte nivel III"
        @keypress.enter="createQueue"
        class="input"
      />
      <unnnic-button type="secondary" text="Adicionar fila" @click="createQueue" />
    </section>

    <section v-if="!!queues.length" class="queues">
      <p class="title">Filas em Suporte</p>

      <unnnic-table :items="queues">
        <template #header>
          <unnnic-table-row :headers="tableHeaders" />
        </template>

        <template #item="{ item }">
          <unnnic-table-row :headers="tableHeaders">
            <template #name>
              {{ item.name }}
            </template>

            <template #createdAt>{{ item.createdAt }}</template>

            <template #visualize>
              <unnnic-button
                text="Detalhes"
                type="secondary"
                size="small"
                class="visualize-button"
              />
            </template>
          </unnnic-table-row>
        </template>
      </unnnic-table>
    </section>
  </section>
</template>

<script>
export default {
  name: 'FormQueue',

  props: {
    value: {
      type: Array,
      default: () => [],
    },
  },

  data: () => ({
    queueName: '',
    tableHeaders: [
      {
        id: 'name',
        text: 'Nome',
        flex: 3,
      },
      {
        id: 'createdAt',
        text: 'Data de criação',
        flex: 3,
      },
      {
        id: 'visualize',
        text: 'Visualizar',
        flex: 2,
      },
    ],
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
      const name = this.queueName.trim();
      if (!name) return;

      this.queues.push({
        name,
        createdAt: Intl.DateTimeFormat('pt-BR', {
          dateStyle: 'short',
        }).format(new Date()),
      });

      this.queueName = '';
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

  .queues {
    .visualize-button {
      width: 100%;
    }
  }
}
</style>
