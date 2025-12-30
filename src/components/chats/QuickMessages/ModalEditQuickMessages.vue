<template>
  <UnnnicModalDialog
    :modelValue="true"
    :title="title"
    showCloseIcon
    size="lg"
    :primaryButtonProps="{
      text: $t('save'),
      disabled: !validForm,
      loading: isLoading,
    }"
    :secondaryButtonProps="{ text: $t('cancel'), disabled: isLoading }"
    @primary-button-click="$emit('save')"
    @secondary-button-click="close()"
    @close="close()"
    @update:model-value="close()"
  >
    <MessageForm
      :modelValue="quickMessage"
      @update:model-value="$emit('update:quickMessage', $event)"
    />
  </UnnnicModalDialog>
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
  computed: {
    validForm() {
      return !!(
        this.quickMessage.shortcut?.trim() && this.quickMessage.text.trim()
      );
    },
  },
  methods: {
    save() {
      this.$emit('save', this.quickMessage);
    },
    close() {
      this.$emit('close');
    },
    updateQuickMessage(quickMessage) {
      this.$emit('update:quickMessage', quickMessage);
    },
  },
};
</script>
