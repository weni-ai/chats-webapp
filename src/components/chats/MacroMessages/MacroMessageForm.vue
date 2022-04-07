<template>
  <section class="macro-message-form">
    <unnnic-input
      :value="macroMessage.title"
      @input="macroMessage = { ...macroMessage, title: $event }"
      size="sm"
      placeholder="Defina um título para sua resposta pronta"
    >
      <template #label>
        <span class="label"> Título </span>
      </template>
    </unnnic-input>

    <unnnic-input
      :value="macroMessage.shortcut"
      @input="macroMessage = { ...macroMessage, shortcut: $event }"
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
      :value="macroMessage.message"
      @input="macroMessage = { ...macroMessage, message: $event }"
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
  name: 'MacroMessageForm',

  props: {
    value: {
      type: Object,
      default: null,
    },
  },

  computed: {
    macroMessage: {
      get() {
        return this.value || {};
      },
      set(macroMessage) {
        this.$emit('input', macroMessage);
      },
    },
  },

  methods: {
    cancel() {
      this.$emit('cancel');
    },
    submit() {
      this.$emit('submit', this.macroMessage);
    },
  },
};
</script>

<style lang="scss" scoped>
.macro-message-form {
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
