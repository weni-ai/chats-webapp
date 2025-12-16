<template>
  <UnnnicModalDialog
    :modelValue="true"
    :title="$t('quick_messages.delete_your_quick_message')"
    :primaryButtonProps="{
      text: $t('delete'),
      loading: isLoading,
    }"
    type="warning"
    showCloseIcon
    :secondaryButtonProps="{ text: $t('cancel'), disabled: isLoading }"
    @primary-button-click="$emit('confirm')"
    @secondary-button-click="close()"
    @close="close()"
    @update:model-value="close()"
  >
    <p>
      {{
        $t('quick_messages.delete_description', {
          shortcut: '/' + quickMessage.shortcut,
        })
      }}
    </p>
  </UnnnicModalDialog>
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
  methods: {
    close() {
      this.$emit('close');
    },
  },
};
</script>
