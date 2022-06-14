<template>
  <section class="quick-message-form">
    <unnnic-input
      :value="quickMessage.title"
      @input="quickMessage = { ...quickMessage, title: $event }"
      size="sm"
      label="Título"
      placeholder="Defina um título para sua resposta pronta"
    />

    <unnnic-input
      :value="quickMessage.shortcut"
      @input="quickMessage = { ...quickMessage, shortcut: $event }"
      size="sm"
      placeholder="Adicione uma palavra de atalho"
    >
      <template #label>
        <span class="label">
          Atalho
          <unnnic-tool-tip
            enabled
            text="Defina uma palavra chave para usar como atalho"
            side="right"
          >
            <unnnic-icon-svg scheme="neutral-clean" icon="information-circle-4" size="sm" />
          </unnnic-tool-tip>
        </span>
      </template>
    </unnnic-input>

    <unnnic-text-area
      :value="quickMessage.message"
      @input="quickMessage = { ...quickMessage, message: $event }"
      label="Mensagem"
      placeholder="Insira o conteúdo da mensagem que deseja cadastrar"
    />

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
  gap: $unnnic-spacing-stack-sm;

  .label {
    display: flex;
    align-items: center;
    gap: $unnnic-spacing-stack-nano;
  }

  .actions {
    display: flex;
    align-items: center;
    margin-top: auto;
    gap: $unnnic-spacing-stack-sm;

    .button {
      flex: 1 1;
    }
  }
}
</style>
