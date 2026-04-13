<template>
  <UnnnicDialog
    v-model:open="isOpen"
    class="modal-delete-quick-message"
  >
    <UnnnicDialogContent>
      <UnnnicDialogHeader type="warning">
        <UnnnicDialogTitle>
          {{ $t('quick_messages.delete_your_quick_message') }}
        </UnnnicDialogTitle>
      </UnnnicDialogHeader>
      <section class="modal-delete-quick-message__content">
        <p>
          {{
            $t('quick_messages.delete_description', {
              shortcut: '/' + quickMessage.shortcut,
            })
          }}
        </p>
      </section>
      <UnnnicDialogFooter>
        <UnnnicButton
          :text="$t('cancel')"
          type="tertiary"
          :disabled="isLoading"
          @click="close"
        />
        <UnnnicButton
          :text="$t('delete')"
          type="warning"
          :loading="isLoading"
          @click="$emit('confirm')"
        />
      </UnnnicDialogFooter>
    </UnnnicDialogContent>
  </UnnnicDialog>
</template>

<script>
export default {
  name: 'ModalDeleteQuickMessage',
  props: {
    quickMessage: {
      type: Object,
      required: true,
    },
    isLoading: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['close', 'confirm'],
  data() {
    return {
      isOpen: true,
    };
  },
  watch: {
    isOpen(value) {
      if (!value) {
        this.$emit('close');
      }
    },
  },
  methods: {
    close() {
      this.isOpen = false;
    },
  },
};
</script>

<style lang="scss" scoped>
.modal-delete-quick-message {
  &__content {
    padding: $unnnic-space-6;
    color: $unnnic-color-fg-base;
  }
}
</style>
