<template>
  <section class="form-agent">
    <p class="title">Adicionar novos agentes</p>

    <section class="controls">
      <unnnic-autocomplete
        v-model="agentName"
        :data="[]"
        @choose="agentName = $event"
        @keypress.enter="addAgent"
        label="Selecionar agente"
        placeholder="Pesquise pelo nome"
        iconLeft="search-1"
        open-with-focus
        highlight
        class="input"
      />
      <unnnic-button type="secondary" text="Adicionar" @click="addAgent" />
    </section>

    <section v-if="!!agents.length" class="agents">
      <p class="title">Agentes em Suporte</p>

      <unnnic-table :items="agents">
        <template #header>
          <unnnic-table-row :headers="tableHeaders" />
        </template>

        <template #item="{ item }">
          <unnnic-table-row :headers="tableHeaders">
            <template #name>
              {{ item.name }}
            </template>

            <template #additionDate>{{ item.additionDate }}</template>

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
  name: 'FormAgent',

  props: {
    value: {
      type: Array,
      default: () => [],
    },
  },

  data: () => ({
    agentName: '',
    tableHeaders: [
      {
        id: 'name',
        text: 'Nome',
        flex: 3,
      },
      {
        id: 'additionDate',
        text: 'Data de adição',
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
    addAgent() {
      const name = this.agentName.trim();
      if (!name) return;

      this.agents.push({
        name,
        createdAt: Intl.DateTimeFormat('pt-BR', {
          dateStyle: 'short',
        }).format(new Date()),
      });

      this.agentName = '';
    },
  },
};
</script>

<style lang="scss" scoped>
.form-agent {
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

  .agents {
    .visualize-button {
      width: 100%;
    }
  }
}
</style>
