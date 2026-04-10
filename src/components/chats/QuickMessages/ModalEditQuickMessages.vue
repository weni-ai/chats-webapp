<template>
  <UnnnicDialog
    v-model:open="isOpen"
    class="modal-edit-quick-messages"
  >
    <UnnnicDialogContent size="large">
      <UnnnicDialogHeader>
        <UnnnicDialogTitle>
          {{ title }}
        </UnnnicDialogTitle>
      </UnnnicDialogHeader>
      <section class="modal-edit-quick-messages__content">
        <MessageForm
          :modelValue="quickMessage"
          @update:model-value="$emit('update:quickMessage', $event)"
        />
      </section>
      <UnnnicDialogFooter>
        <UnnnicButton
          :text="$t('cancel')"
          type="tertiary"
          :disabled="isLoading"
          @click="close"
        />
        <UnnnicButton
          :text="$t('save')"
          type="primary"
          :disabled="!validForm"
          :loading="isLoading"
          @click="$emit('save')"
        />
      </UnnnicDialogFooter>
    </UnnnicDialogContent>
  </UnnnicDialog>
</template>

<script>
import MessageForm from '@/components/settings/forms/Messages.vue';

export default {
  name: 'ModalEditQuickMessages',
  components: {
    MessageForm,
  },
  props: {
    quickMessage: {
      type: Object,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    isLoading: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['close', 'update:quickMessage', 'save'],
  data() {
    return {
      isOpen: true,
    };
  },
  computed: {
    validForm() {
      return !!(
        this.quickMessage.shortcut?.trim() && this.quickMessage.text.trim()
      );
    },
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
.modal-edit-quick-messages {
  &__content {
    padding: $unnnic-space-6;
  }
}
</style>
