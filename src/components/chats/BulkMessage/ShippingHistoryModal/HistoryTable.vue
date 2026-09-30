<template>
  <div
    v-if="loading"
    class="shipping-history-modal__loading"
    data-testid="shipping-history-loading"
  >
    <UnnnicIconLoading />
  </div>

  <UnnnicTable
    v-else-if="items.length > 0"
    :items="items"
    class="shipping-history-modal__table"
    data-testid="shipping-history-table"
  >
    <template #header>
      <UnnnicTableRow :headers="headers" />
    </template>

    <template #item="{ item }">
      <UnnnicTableRow :headers="headers">
        <template #contact>
          <p :title="item.contact?.name">{{ item.contact?.name }}</p>
        </template>

        <template #queue>
          <p :title="item.queue?.name">{{ item.queue?.name }}</p>
        </template>

        <template #sentBy>
          <p :title="item.sent_by?.name">{{ item.sent_by?.name }}</p>
        </template>

        <template #date>
          {{ $d(new Date(item.date)) }}
        </template>

        <template #message>
          <p :title="item.message">{{ item.message }}</p>
        </template>

        <template #status>
          <UnnnicTag
            :text="statusLabel(item.status)"
            :scheme="statusScheme(item.status)"
            size="small"
          />
        </template>
      </UnnnicTableRow>
    </template>
  </UnnnicTable>

  <p
    v-else
    class="shipping-history-modal__no-results"
    data-testid="shipping-history-no-results"
  >
    {{ $t('without_results') }}
  </p>
</template>

<script setup lang="ts">
import { statusLabel, statusScheme } from './status';
import type { ShippingHistoryItem, TableHeader } from './types';

defineOptions({
  name: 'ShippingHistoryTable',
});

defineProps<{
  items: ShippingHistoryItem[];
  loading: boolean;
  headers: TableHeader[];
}>();
</script>

<style scoped lang="scss">
.shipping-history-modal {
  &__loading {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 200px;
  }

  &__table {
    overflow: auto hidden;

    .header {
      text-align: start;
    }

    .table-row {
      text-align: start;

      :deep(.col) {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }

  &__no-results {
    font: $unnnic-font-body;
    font-style: italic;
    color: $unnnic-color-fg-base;
    margin: 0;
  }
}
</style>
