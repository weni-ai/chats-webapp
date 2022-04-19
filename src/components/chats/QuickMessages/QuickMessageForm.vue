<template>
  <section class="quick-message-form">
    <unnnic-input
      :value="quickMessage.title"
      @input="quickMessage = { ...quickMessage, title: $event }"
      size="sm"
      placeholder="Defina um título para sua resposta pronta"
    >
      <template #label>
        <span class="label"> Título </span>
      </template>
    </unnnic-input>

    <unnnic-input
      :value="quickMessage.shortcut"
      @input="quickMessage = { ...quickMessage, shortcut: $event }"
      size="sm"
      placeholder="Adicione uma palavra de atalho"
    >
      <template #label>
        <span class="label">
          Atalho
          <unnnic-icon-svg scheme="neutral-clean" icon="information-circle-4" size="sm" />
        </span>
      </template>
    </unnnic-input>

    <unnnic-input
      :value="quickMessage.message"
      @input="quickMessage = { ...quickMessage, message: $event }"
      size="sm"
      placeholder="Insira o conteúdo da mensagem que deseja cadastrar"
    >
      <template #label>
        <span class="label"> Mensagem </span>
      </template>
    </unnnic-input>

    <div class="actions">
      <unnnic-button
        class="button"
        text="Cancelar"
        type="secondary"
        size="small"
        @click="$emit('cancel')"
      />
      <unnnic-button class="button" text="Salvar" size="small" @click="submit" />
    </div>
  </section>
</template>

<script>
export default {
  name: 'QuickMessageForm',

  props: {
    value: {
      type: Object,
      default: null,
    },
  },

  computed: {
    quickMessage: {
      get() {
        return this.value || {};
      },
      set(quickMessage) {
        this.$emit('input', quickMessage);
      },
    },
  },

  methods: {
    cancel() {
      this.$emit('cancel');
    },
    submit() {
      this.$emit('submit', this.quickMessage);
    },
  },
};
</script>

<style lang="scss" scoped>
.quick-message-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;

  .label {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-weight: $unnnic-font-weight-black;
  }

  .actions {
    display: flex;
    align-items: center;
    margin-top: auto;
    gap: 1rem;

    .button {
      flex: 1 1;
    }
  }
}
</style>
