<template>
  <form @submit.prevent="$emit('submit')" class="form-sector">
    <section class="form-section">
      <h2 class="title">Adicionar novo setor</h2>
      <unnnic-input label="Nome do setor" placeholder="Suporte" />
    </section>

    <section class="form-section">
      <h2 class="title">Atribuir um gestor</h2>
      <unnnic-autocomplete
        label="Selecionar gestor"
        placeholder="Pesquise pelo nome"
        iconLeft="search-1"
      />
    </section>

    <section class="form-section">
      <h2 class="title">Definições da jornada de trabalho</h2>

      <section class="date-inputs">
        <unnnic-input label="Horário de início" placeholder="08:00" />
        <unnnic-input label="Horário de encerramento" placeholder="18:00" />
      </section>

      <unnnic-input
        label="Limite de quantidade de atendimentos simultâneos por agente"
        placeholder="4"
      />
    </section>

    <unnnic-button type="secondary" text="Salvar alterações" class="submit-button" />
  </form>
</template>

<script>
export default {
  name: 'FormSector',

  props: {
    value: {
      type: Object,
      default: () => ({}),
    },
  },

  computed: {
    sector: {
      get() {
        return this.value;
      },
      set(sector) {
        this.$emit('input', sector);
      },
    },
  },
};
</script>

<style lang="scss" scoped>
.form-sector {
  .form-section {
    & + .form-section {
      margin-top: 1.5rem;
    }

    .title {
      font-weight: $unnnic-font-weight-bold;
      color: $unnnic-color-neutral-dark;
      font-size: $unnnic-font-size-body-lg;
      line-height: 1.5rem;

      margin-bottom: 1rem;
    }

    .date-inputs {
      display: flex;
      gap: 1rem;

      & > * {
        flex: 1 1;
      }
    }
  }

  .submit-button {
    width: 100%;
    margin-top: 1rem;
  }
}
</style>
