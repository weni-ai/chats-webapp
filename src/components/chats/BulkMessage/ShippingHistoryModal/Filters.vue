<template>
  <section class="shipping-history-modal__filters">
    <div class="shipping-history-modal__filter">
      <UnnnicLabel :label="$t('filter.by_date')" />
      <UnnnicInputDatePicker
        :modelValue="date"
        class="shipping-history-modal__date-picker"
        position="left"
        :inputFormat="$t('date_format')"
        data-testid="shipping-history-date-picker"
        @update:model-value="emit('update:date', $event)"
      />
    </div>

    <UnnnicSelect
      :modelValue="sender"
      class="shipping-history-modal__filter"
      :options="senderOptions"
      :label="$t('mass_message.history.filter_by_sender')"
      :placeholder="$t('select')"
      returnObject
      clearable
      enableSearch
      :search="searchSender"
      data-testid="shipping-history-sender-select"
      @update:model-value="emit('update:sender', $event)"
      @update:search="searchSender = $event"
    />

    <UnnnicSelect
      :modelValue="status"
      class="shipping-history-modal__filter"
      :options="statusOptions"
      :label="$t('mass_message.history.filter_by_status')"
      :placeholder="$t('select')"
      returnObject
      clearable
      data-testid="shipping-history-status-select"
      @update:model-value="emit('update:status', $event)"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

import i18n from '@/plugins/i18n';

import type { FilterDate, SelectOption } from './types';

defineOptions({
  name: 'ShippingHistoryFilters',
});

defineProps<{
  date: FilterDate;
  sender: SelectOption | null;
  status: SelectOption | null;
  senderOptions: SelectOption[];
}>();

const emit = defineEmits<{
  'update:date': [FilterDate];
  'update:sender': [SelectOption | null];
  'update:status': [SelectOption | null];
}>();

const { t } = i18n.global;

const searchSender = ref('');

const statusOptions = computed<SelectOption[]>(() => [
  {
    label: t('mass_message.history.status_sent'),
    value: 'SUCCESS',
  },
  {
    label: t('mass_message.history.status_failed'),
    value: 'FAILED',
  },
]);
</script>

<style scoped lang="scss">
.shipping-history-modal {
  &__filters {
    display: flex;
    gap: $unnnic-space-4;
    align-items: flex-start;
    width: 100%;
  }

  &__filter {
    flex: 1;
    min-width: 0;
  }

  &__date-picker.dropdown {
    display: grid;
    width: 100%;

    :deep(.input) {
      min-width: 0;
      width: 100%;
    }
  }
}
</style>
