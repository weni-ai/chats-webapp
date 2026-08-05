<template>
  <UnnnicDialog
    v-model:open="isOpen"
    data-testid="disable-bond-flows-modal"
  >
    <UnnnicDialogContent size="medium">
      <UnnnicDialogHeader type="attention">
        <UnnnicDialogTitle>
          {{ $t('attention') }}
        </UnnnicDialogTitle>
        <UnnnicDialogClose @click="close" />
      </UnnnicDialogHeader>

      <section class="disable-bond-flows-modal__body">
        <p
          class="disable-bond-flows-modal__text"
          data-testid="disable-bond-flows-description"
        >
          {{
            $t('config_chats.queues.bond_flows_queue.disable_modal.description')
          }}
        </p>
      </section>

      <UnnnicDialogFooter>
        <UnnnicButton
          type="tertiary"
          :text="$t('cancel')"
          data-testid="disable-bond-flows-cancel-btn"
          @click="close"
        />
        <UnnnicButton
          type="attention"
          :text="
            $t('config_chats.queues.bond_flows_queue.disable_modal.confirm')
          "
          data-testid="disable-bond-flows-confirm-btn"
          @click="confirm"
        />
      </UnnnicDialogFooter>
    </UnnnicDialogContent>
  </UnnnicDialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';

defineOptions({
  name: 'DisableBondFlowsModal',
});

const props = withDefaults(
  defineProps<{
    modelValue?: boolean;
  }>(),
  {
    modelValue: false,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  confirm: [];
}>();

const isOpen = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const close = (): void => {
  isOpen.value = false;
};

const confirm = (): void => {
  emit('confirm');
  close();
};
</script>

<style lang="scss" scoped>
.disable-bond-flows-modal {
  &__body {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-2;
    padding: $unnnic-space-6;
  }

  &__text {
    color: $unnnic-color-fg-base;
    font: $unnnic-text-body;
  }
}
</style>
