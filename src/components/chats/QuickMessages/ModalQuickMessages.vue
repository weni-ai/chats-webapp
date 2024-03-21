<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <main class="modal-quick-messages">
    <UnnnicModal
      class="modal-quick-messages__modal"
      :text="$t('quick_messages.title')"
      @close="$emit('close')"
    >
      <QuickMessagesList
        :withHandlers="false"
        :isEmpty.sync="isQuickMessagesEmpty"
        @select-quick-message="emitSelectQuickMessage"
      />
      <template #options>
        <UnnnicButton
          v-if="isQuickMessagesEmpty"
          iconLeft="add"
          :text="$t('quick_messages.new')"
          type="primary"
          size="large"
          @click="openHomeNewQuickMessage"
        />
      </template>
    </UnnnicModal>
  </main>
</template>

<script>
import QuickMessagesList from '@/components/chats/QuickMessages/QuickMessagesList.vue';

export default {
  name: 'ModalQuickMessages',

  components: {
    QuickMessagesList,
  },

  data() {
    return {
      isQuickMessagesEmpty: false,
    };
  },

  methods: {
    emitSelectQuickMessage(quickMessage) {
      this.$emit('select-quick-message', quickMessage);
    },
    openHomeNewQuickMessage() {
      this.$router.push({ name: 'home', query: { newQuickMessage: true } });
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
            padding: 0 $unnnic-spacing-sm;
          }
        }

        &-button {
          padding: $unnnic-spacing-sm;
          padding-top: $unnnic-spacing-md;
        }
      }
    }
  }
}
</style>
