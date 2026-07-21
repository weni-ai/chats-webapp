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
    <main class="bulk-message-form__main">
      <section class="bulk-message-form__recipients">
        <UnnnicLabel
          class="bulk-message-form__recipients-label"
          :label="$t('mass_message.form.recipients.title')"
          :tooltip="{ text: $t('mass_message.form.recipients.title_tooltip') }"
        />

        <UnnnicCheckboxGroup
          :label="$t('mass_message.form.recipients.select_the_contacts_status')"
        >
          <section class="bulk-message-form__recipients-status">
            <UnnnicCheckbox
              :label="$t('mass_message.form.recipients.contacts_in_service')"
              :modelValue="selectedContactsStatus.includes('ongoing')"
              @update:model-value="
                handleSelectedContactsStatusUpdate('ongoing')
              "
            />
            <UnnnicCheckbox
              :label="
                $t('mass_message.form.recipients.contacts_waiting_for_service')
              "
              :modelValue="selectedContactsStatus.includes('waiting')"
              @update:model-value="
                handleSelectedContactsStatusUpdate('waiting')
              "
            />
          </section>
        </UnnnicCheckboxGroup>

        <SelectFilters
          :queues="selectedQueues"
          :representatives="selectedRepresentatives"
          @update:queues="selectedQueues = $event"
          @update:representatives="selectedRepresentatives = $event"
        />
      </section>
    </main>
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
import { computed, ref } from 'vue';
import { watchDebounced } from '@vueuse/core';

import SelectFilters from './SelectFilters.vue';

defineOptions({
  name: 'BulkMessage',
});

const emit = defineEmits<{
  close: [void];
}>();

const selectedContactsStatus = ref<string[]>(['ongoing', 'waiting']);
const selectedQueues = ref<string[]>(['all']);
const selectedRepresentatives = ref<string[]>(['all']);

const filtersForm = computed(() => ({
  status: selectedContactsStatus.value,
  queues: selectedQueues.value,
  agents: selectedRepresentatives.value,
}));

watchDebounced(
  filtersForm,
  (newFilters) => {
    console.log('TODO: handle filters form change');
  },
  { debounce: 2000, deep: true },
);

const validForm = computed(() => {
  // TODO: Implement form validation

  return false;
});

const handleShippingHistory = () => {
  console.log('TODO:handleShippingHistory');
};

const handleSelectedContactsStatusUpdate = (status: string) => {
  if (selectedContactsStatus.value.includes(status)) {
    selectedContactsStatus.value = selectedContactsStatus.value.filter(
      (s) => s !== status,
    );
  } else {
    selectedContactsStatus.value.push(status);
  }
};

const handleSend = () => {
  console.log('TODO: handleSend');
};

const getContactsCount = () => {};
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
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-6;
    padding: $unnnic-space-2;
    overflow-y: auto;
  }

  &__recipients {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-4;

    &-label {
      :deep(.unnnic-label__label) {
        font: $unnnic-font-display-4;
      }
    }

    &-status {
      display: grid;
      grid-template-columns: 1fr 1fr;
      flex: 1;
      gap: $unnnic-space-6;
    }
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
