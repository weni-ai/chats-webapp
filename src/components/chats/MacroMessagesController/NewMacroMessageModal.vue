<template>
  <unnnic-modal
    :text="newMacroMessage.id ? 'Editar Macro' : 'Criar novo macro'"
    close-icon
    @close="$emit('close'), clearInputs()"
    :show-modal="open"
  >
    <template #message>
      <section class="inputs">
        <div class="input">
          <span>Título</span>
          <unnnic-input v-model="newMacroMessage.title" size="sm" />
        </div>

        <div class="input">
          <span>Mensagem</span>
          <unnnic-input v-model="newMacroMessage.message" size="sm" />
        </div>
      </section>
    </template>

    <template #options>
      <unnnic-button type="terciary" @click="$emit('close'), clearInputs()" text="Cancelar" />
      <unnnic-button @click="$emit('confirm', newMacroMessage), clearInputs()" text="Confirmar" />
    </template>
  </unnnic-modal>
</template>

<script>
import { unnnicModal, unnnicInput, unnnicButton } from '@weni/unnnic-system';

export default {
  name: 'NewMacroMessageModal',

  props: {
    open: {
      type: Boolean,
      default: false,
    },

    macroMessage: {
      type: Object,
      default: null,
    },
  },

  components: {
    unnnicButton,
    unnnicInput,
    unnnicModal,
  },

  data: () => ({
    newMacroMessage: {
      title: '',
      message: '',
    },
  }),

  methods: {
    clearInputs() {
      this.newMacroMessage = {
        title: '',
        message: '',
      };
    },
  },

  watch: {
    macroMessage(newValue) {
      if (newValue) {
        this.newMacroMessage = {
          ...newValue,
        };
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.input {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  text-align: start;

  & + .input {
    margin-top: 1rem;
  }

  span {
    color: $unnnic-color-neutral-dark;
    font-weight: $unnnic-font-weight-black;
  }
}
</style>
