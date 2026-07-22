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

        <ContactsStatus
          :status="selectedContactsStatus"
          @update:status="selectedContactsStatus = $event"
        />

        <SelectFilters
          :queues="selectedQueues"
          :representatives="selectedRepresentatives"
          @update:queues="selectedQueues = $event"
          @update:representatives="selectedRepresentatives = $event"
        />

        <UnnnicDisclaimer
          v-if="contactsCount > 0"
          :description="
            $t('mass_message.form.contacts_count_disclaimer', {
              count: contactsCount,
            })
          "
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
        :text="$t('mass_message.form.send', { count: contactsCount })"
        :disabled="!validForm"
        @click="handleSend"
      />
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { watchDebounced } from '@vueuse/core';
import { UnnnicCallAlert, UnnnicDisclaimer } from '@weni/unnnic-system';

import ContactsStatus from './ContactsStatus.vue';
import SelectFilters from './SelectFilters.vue';

import BulkMessageService from '@/services/api/resources/chats/bulkMessage';

import i18n from '@/plugins/i18n';

defineOptions({
  name: 'BulkMessage',
});

const emit = defineEmits<{
  close: [void];
}>();

const { t } = i18n.global;

const selectedContactsStatus = ref<string[]>(['ongoing', 'waiting']);
const selectedQueues = ref<string[]>(['all']);
const selectedRepresentatives = ref<string[]>(['all']);

const filtersForm = computed(() => ({
  status: selectedContactsStatus.value,
  queues: selectedQueues.value,
  agents: selectedRepresentatives.value,
}));

const contactsCount = ref<number>(0);

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

const getContactsCount = async () => {
  try {
    const { count } = await BulkMessageService.countRooms(filtersForm.value);
    contactsCount.value = count;
  } catch (error) {
    console.error('Error getting contacts count', error);
  }
};

watchDebounced(
  filtersForm,
  () => {
    getContactsCount();
  },
  { debounce: 1500, deep: true },
);

watch(contactsCount, () => {
  if (contactsCount.value === 0) {
    UnnnicCallAlert({
      props: {
        text: t('mass_message.form.no_contacts_filtered_alert'),
        type: 'error',
      },
    });
  }
});

onMounted(() => {
  getContactsCount();
});
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
