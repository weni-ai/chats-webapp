<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <main class="modal-quick-messages">
    <unnnic-modal
      class="modal-quick-messages__modal"
      :text="$t('quick_messages.title')"
      @close="$emit('close')"
    >
      <quick-messages-list @select-quick-message="emitSelectQuickMessage" />
    </unnnic-modal>
  </main>
</template>

<script>
import QuickMessagesList from '@/components/chats/QuickMessages/QuickMessagesList.vue';

export default {
  name: 'ModalQuickMessages',

  components: {
    QuickMessagesList,
  },

  methods: {
    emitSelectQuickMessage(quickMessage) {
      this.$emit('select-quick-message', quickMessage);
    },
  },
};
</script>

<style lang="scss" scoped>
$messageManagerHeight: 46px;
$messageManagerMargin: $unnnic-spacing-ant;
$modalBorderRadius: $unnnic-border-radius-md + $unnnic-border-radius-lg;

.modal-quick-messages {
  position: relative;
  top: 0;

  height: calc(100vh - $messageManagerHeight - $messageManagerMargin);
  width: 100vw;

  overflow: hidden;

  &__modal.unnnic-modal {
    position: absolute;

    :deep(.unnnic-modal-container) {
      .unnnic-modal-container-background {
        border-radius: $modalBorderRadius $modalBorderRadius 0 0;

        display: grid;
        grid-template-rows: auto 1fr;

        max-height: 60vh;

        &-body-description {
          padding: 0;

          &-container {
            padding-bottom: 0;
          }
        }
      }
    }
  }
}
</style>
