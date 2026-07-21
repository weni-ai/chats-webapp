<template>
  <section class="bulk-message-form">
    <header class="bulk-message-form__header">
      <p class="bulk-message-form__title">
        {{ $t('mass_message.form.title') }}
      </p>
      <!-- TODO: Implement history check -->
      <UnnnicToolTip
        enabled
        :text="$t('mass_message.form.no_shipping_history')"
      >
        <UnnnicButton
          iconLeft="history"
          :text="$t('mass_message.form.shipping_history')"
          type="secondary"
          size="small"
          disabled
          @click="handleShippingHistory"
        />
      </UnnnicToolTip>
    </header>
    <main class="bulk-message-form__main"></main>
    <!-- TODO: Implement button count and validations -->
    <footer class="bulk-message-form__footer">
      <UnnnicButton
        class="bulk-message-form__footer-button"
        :text="$t('cancel')"
        type="tertiary"
        @click="emit('close')"
      />
      <UnnnicButton
        class="bulk-message-form__footer-button"
        :text="$t('mass_message.form.send', { count: 0 })"
        :disabled="!validForm"
        @click="handleSend"
      />
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';

defineOptions({
  name: 'BulkMessage',
});

const emit = defineEmits<{
  close: [void];
}>();

const validForm = computed(() => {
  // TODO: Implement form validation

  return false;
});

const handleShippingHistory = () => {
  console.log('TODO:handleShippingHistory');
};

const handleSend = () => {
  console.log('TODO: handleSend');
};
</script>
<style scoped lang="scss">
.bulk-message-form {
  display: flex;
  flex-direction: column;
  height: 100%;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: $unnnic-space-2;
    background-color: $unnnic-color-bg-base;
    border-bottom: 1px solid $unnnic-color-border-base;
    height: 57px; // same size as the status bar
  }

  &__title {
    font: $unnnic-font-display-3;
    color: $unnnic-color-fg-emphasized;
  }

  &__main {
    flex: 1 0 0;
    padding: $unnnic-space-2;
  }

  &__footer {
    display: flex;
    align-items: center;

    padding: $unnnic-space-2;
    gap: $unnnic-space-2;
    background-color: $unnnic-color-bg-base;
    border-top: 1px solid $unnnic-color-border-base;
    height: 55px; // same size as view options

    &-button {
      width: 100%;
    }
  }
}
</style>
