<template>
  <section
    class="quick-message-bulk-form"
    data-testid="quick-message-bulk-form"
  >
    <main class="quick-message-bulk-form__main">
      <p class="quick-message-bulk-form__main-title">
        {{ $t('quick_messages.send_in_bulk') }}
      </p>

      <UnnnicMultiSelect
        class="quick-message-bulk-form__contacts"
        data-testid="quick-message-bulk-contacts-select"
        :options="contactsOptions"
        :modelValue="selectedContacts"
        :label="$t('quick_messages.bulk.contacts.label')"
        :message="$t('quick_messages.bulk.contacts.helper')"
        @update:model-value="updateSelectedContacts"
      />

      <UnnnicCheckbox
        v-model="agreeToSend"
        data-testid="quick-message-bulk-confirmation-checkbox"
        :label="$t('quick_messages.bulk.confirmation.checkbox_label')"
      />
    </main>

    <footer class="quick-message-bulk-form__footer">
      <UnnnicButton
        class="quick-message-bulk-form__footer-button"
        data-testid="quick-message-bulk-cancel-button"
        :text="$t('cancel')"
        type="tertiary"
        :disabled="isSending"
        @click="emit('close')"
      />
      <UnnnicButton
        class="quick-message-bulk-form__footer-button"
        data-testid="quick-message-bulk-send-button"
        :text="
          $t('quick_messages.bulk.send', {
            count: selectedContactsCount,
          })
        "
        :disabled="!canSend"
        :loading="isSending"
        @click="handleSend"
      />
    </footer>

    <ModalProgressBar
      v-if="isSending || !!sendingUuid"
      data-testid="quick-message-bulk-progress-modal"
      :modelValue="percentageSent"
      :title="
        $t('quick_messages.bulk.sending', {
          count: totalToSend || selectedContactsCount,
        })
      "
    />
  </section>
</template>

<script setup>
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';

import { useRooms } from '@/store/modules/chats/rooms';
import { useBulkQuickMessageSend } from '@/store/modules/chats/bulkQuickMessageSend';
import { useRoomCounters } from '@/store/modules/chats/roomCounters';

import ModalProgressBar from '@/components/chats/BulkMessage/ModalProgressBar.vue';
import QuickMessageService from '@/services/api/resources/chats/quickMessage';

import i18n from '@/plugins/i18n';

defineOptions({
  name: 'QuickMessageBulkForm',
});

const props = defineProps({
  quickMessage: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['close']);

const { t } = i18n.global;
const roomsStore = useRooms();
const { agentRooms } = storeToRefs(roomsStore);
const roomCountersStore = useRoomCounters();
const { counts: roomsCounts } = storeToRefs(roomCountersStore);

const bulkQuickMessageSendStore = useBulkQuickMessageSend();
const { isSending, sendingUuid, percentageSent, totalToSend } = storeToRefs(
  bulkQuickMessageSendStore,
);

const selectedContacts = ref(['all']);
const agreeToSend = ref(false);

const contactsOptions = computed(() => {
  const allOption = {
    label: t('quick_messages.bulk.contacts.all'),
    value: 'all',
  };

  const roomOptions = agentRooms.value.map((room) => ({
    label: room.contact.name || room.uuid,
    value: room.contact.uuid,
    disabled: selectedContacts.value.includes('all'),
  }));

  return [allOption, ...roomOptions];
});

const selectedContactsCount = computed(() => {
  if (selectedContacts.value.includes('all')) {
    return roomsCounts.value.ongoing;
  }

  return selectedContacts.value.length;
});

const canSend = computed(() => {
  return (
    agreeToSend.value && selectedContactsCount.value > 0 && !isSending.value
  );
});

const updateSelectedContacts = (contacts) => {
  selectedContacts.value = contacts.includes('all') ? ['all'] : contacts;
};

const handleSend = async () => {
  if (!canSend.value || !props.quickMessage?.text) return;

  const contacts = selectedContacts.value.includes('all')
    ? null
    : selectedContacts.value;

  try {
    isSending.value = true;
    const { status, uuid } = await QuickMessageService.sendBulk({
      text: props.quickMessage.text,
      contacts,
    });

    if (status === 'PROCESSING') {
      bulkQuickMessageSendStore.sendingUuid = uuid;
    } else {
      isSending.value = false;
    }
  } catch (error) {
    console.error('Error sending quick message in bulk', error);
    isSending.value = false;
  }
};
</script>

<style lang="scss" scoped>
.quick-message-bulk-form {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;

  &__main {
    flex: 1 0 0;
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-4;
    padding: $unnnic-space-2;
    overflow-y: auto;

    &-title {
      color: $unnnic-color-fg-emphasized;
      font: $unnnic-font-display-4;
    }
  }

  &__footer {
    display: flex;
    align-items: center;
    padding: $unnnic-space-2;
    gap: $unnnic-space-2;
    background-color: $unnnic-color-bg-base;
    border-top: 1px solid $unnnic-color-border-base;
    flex-shrink: 0;

    &-button {
      width: 100%;
    }
  }
}
</style>
