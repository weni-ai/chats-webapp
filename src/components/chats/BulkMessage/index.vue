<template>
  <section class="bulk-message-form">
    <header class="bulk-message-form__header">
      <p class="bulk-message-form__title">
        {{ $t('mass_message.form.title') }}
      </p>
      <UnnnicToolTip
        :enabled="!hasShippingHistory"
        :text="$t('mass_message.form.no_shipping_history')"
      >
        <UnnnicButton
          iconLeft="history"
          :text="$t('mass_message.form.shipping_history')"
          type="secondary"
          size="small"
          :disabled="!hasShippingHistory"
          @click="handleShippingHistory"
        />
      </UnnnicToolTip>
    </header>
    <main class="bulk-message-form__main">
      <LastMessages
        v-if="lastMessages.length > 0"
        :messages="lastMessages"
      />
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
      <section class="bulk-message-form__message">
        <p class="bulk-message-form__message-title">
          {{ $t('mass_message.form.message.title') }}
        </p>
        <UnnnicTextArea
          v-model="message"
          :label="$t('mass_message.form.message.input_label')"
          :placeholder="$t('mass_message.form.message.input_placeholder')"
          :message="$t('mass_message.form.message.input_helper')"
          :maxLength="1000"
        />
      </section>
      <section
        v-if="validForm"
        class="bulk-message-form__confirmation"
      >
        <UnnnicCheckboxGroup
          :label="$t('mass_message.form.confirmation.title')"
        >
          <UnnnicCheckbox
            v-model="agreeToSend"
            :label="$t('mass_message.form.confirmation.checkbox_label')"
          />
        </UnnnicCheckboxGroup>
      </section>
    </main>
    <footer class="bulk-message-form__footer">
      <UnnnicButton
        class="bulk-message-form__footer-button"
        :text="$t('cancel')"
        type="tertiary"
        :disabled="isSending"
        @click="emit('close')"
      />
      <UnnnicButton
        class="bulk-message-form__footer-button"
        :text="$t('mass_message.form.send', { count: contactsCount })"
        :disabled="!validForm || !agreeToSend"
        :loading="isSending"
        @click="handleSend"
      />
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { watchDebounced } from '@vueuse/core';
import { UnnnicCallAlert } from '@weni/unnnic-system';

import { useBulkMessageSend } from '@/store/modules/chats/bulkMessageSend';

import ContactsStatus from './ContactsStatus.vue';
import SelectFilters from './SelectFilters.vue';
import LastMessages from './LastMessages.vue';

import BulkMessageService from '@/services/api/resources/chats/bulkMessage';

import i18n from '@/plugins/i18n';
import { storeToRefs } from 'pinia';

interface MessageSent {
  uuid: string;
  text: string;
  sent_at: string;
}

defineOptions({
  name: 'BulkMessage',
});

const emit = defineEmits<{
  close: [void];
}>();

const { t } = i18n.global;

const bulkMessageSendStore = useBulkMessageSend();
const { isSending } = storeToRefs(bulkMessageSendStore);

const selectedContactsStatus = ref<string[]>(['ongoing', 'waiting']);
const selectedQueues = ref<string[]>(['all']);
const selectedRepresentatives = ref<string[]>(['all']);
const message = ref<string>('');
const agreeToSend = ref<boolean>(false);
const lastMessages = ref<Array<MessageSent>>([]);
const hasShippingHistory = ref<boolean>(false);

const filtersForm = computed(() => ({
  status: selectedContactsStatus.value,
  queues: selectedQueues.value,
  agents: selectedRepresentatives.value,
}));

const contactsCount = ref<number>(0);

const validForm = computed(() => {
  return message.value.trim().length > 0 && contactsCount.value > 0;
});

const handleShippingHistory = () => {
  console.log('TODO:handleShippingHistory');
};

const handleSend = async () => {
  try {
    isSending.value = true;
    const { status, uuid } = await BulkMessageService.sendMessage({
      text: message.value,
      status: selectedContactsStatus.value,
      queues: selectedQueues.value,
      agents: selectedRepresentatives.value,
    });
    if (status === 'PROCESSING') {
      bulkMessageSendStore.sendingUuid = uuid;
    }
  } catch (error) {
    console.error('Error sending message', error);
  } finally {
    isSending.value = false;
  }
};

const getContactsCount = async () => {
  try {
    const { count } = await BulkMessageService.countRooms(filtersForm.value);
    contactsCount.value = count;
  } catch (error) {
    console.error('Error getting contacts count', error);
  }
};

const getLastSentMessages = async () => {
  try {
    const messages = await BulkMessageService.getLastSentMessages();
    lastMessages.value = messages;
  } catch (error) {
    console.error('Error getting last sent messages', error);
  }
};

const checkIfHasShippingHistory = async () => {
  try {
    const hasHistory = await BulkMessageService.checkIfHasShippingHistory();
    hasShippingHistory.value = hasHistory;
  } catch (error) {
    console.error('Error checking if has shipping history', error);
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

watch(validForm, () => {
  if (!validForm.value) {
    agreeToSend.value = false;
  }
});

onMounted(() => {
  getContactsCount();
  getLastSentMessages();
  checkIfHasShippingHistory();
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
        color: $unnnic-color-fg-emphasized;
      }
    }
  }

  &__message {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-4;

    &-title {
      font: $unnnic-font-display-4;
      color: $unnnic-color-fg-emphasized;
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
