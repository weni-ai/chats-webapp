<template>
  <unnnic-modal text="Criar novo macro" close-icon @close="$emit('close')" :show-modal="open">
    <template #message>
      <section class="inputs">
        <div class="input">
          <span>Título</span>
          <unnnic-input />
        </div>

        <div class="input">
          <span>Mensagem</span>
          <unnnic-input />
        </div>
      </section>
    </template>

    <template #options>
      <unnnic-button type="terciary" @click="$emit('close')" text="Cancelar" />
      <unnnic-button @click="$emit('confirm')" text="Confirmar" />
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
  },

  components: {
    unnnicButton,
    unnnicInput,
    unnnicModal,
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
