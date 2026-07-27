<template>
  <UnnnicDialog
    v-model:open="isOpen"
    class="shipping-history-modal"
    data-testid="shipping-history-modal"
  >
    <UnnnicDialogContent size="large">
      <UnnnicDialogHeader>
        <UnnnicDialogTitle>
          {{ $t('mass_message.form.shipping_history') }}
        </UnnnicDialogTitle>
      </UnnnicDialogHeader>

      <section class="shipping-history-modal__content">
        <section class="shipping-history-modal__filters">
          <div class="shipping-history-modal__filter">
            <UnnnicLabel :label="$t('filter.by_date')" />
            <UnnnicInputDatePicker
              v-model="filterDate"
              class="shipping-history-modal__date-picker"
              position="left"
              :inputFormat="$t('date_format')"
              data-testid="shipping-history-date-picker"
            />
          </div>

          <UnnnicSelect
            v-model="filterSender"
            class="shipping-history-modal__filter"
            :options="senderOptions"
            :label="$t('mass_message.history.filter_by_sender')"
            :placeholder="$t('select')"
            returnObject
            clearable
            enableSearch
            :search="searchSender"
            data-testid="shipping-history-sender-select"
            @update:search="searchSender = $event"
          />

          <UnnnicSelect
            v-model="filterStatus"
            class="shipping-history-modal__filter"
            :options="statusOptions"
            :label="$t('mass_message.history.filter_by_status')"
            :placeholder="$t('select')"
            returnObject
            clearable
            data-testid="shipping-history-status-select"
          />
        </section>

        <div
          v-if="isTableLoading"
          class="shipping-history-modal__loading"
          data-testid="shipping-history-loading"
        >
          <UnnnicIconLoading />
        </div>

        <UnnnicTable
          v-else-if="historyItems.length > 0"
          :items="historyItems"
          class="shipping-history-modal__table"
          data-testid="shipping-history-table"
        >
          <template #header>
            <UnnnicTableRow :headers="tableHeaders" />
          </template>

          <template #item="{ item }">
            <UnnnicTableRow :headers="tableHeaders">
              <template #contact>
                {{ item.contact?.name }}
              </template>

              <template #queue>
                {{ item.queue?.name }}
              </template>

              <template #sentBy>
                {{ item.sent_by?.name }}
              </template>

              <template #date>
                {{ $d(new Date(item.date)) }}
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
      </section>

      <UnnnicDialogFooter class="shipping-history-modal__footer">
        <p class="shipping-history-modal__pagination-count">
          {{
            $t('pagination', {
              from: paginationFrom,
              to: paginationTo,
              total: historyCount,
            })
          }}
        </p>
        <UnnnicPagination
          v-if="historyCountPages > 0"
          :modelValue="currentPage"
          :max="historyCountPages"
          :show="historyLimit"
          data-testid="shipping-history-pagination"
          @update:model-value="handlePageChange"
        />
      </UnnnicDialogFooter>
    </UnnnicDialogContent>
  </UnnnicDialog>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import moment from 'moment';

import BulkMessageService from '@/services/api/resources/chats/bulkMessage';
import ProjectService from '@/services/api/resources/settings/project';

import i18n from '@/plugins/i18n';

defineOptions({
  name: 'ShippingHistoryModal',
});

const emit = defineEmits<{
  close: [void];
}>();

const { t } = i18n.global;

interface SelectOption {
  label: string;
  value: string;
}

interface ShippingHistoryItem {
  contact?: { name?: string };
  queue?: { name?: string };
  sent_by?: { name?: string };
  date: string;
  status: string;
}

const isOpen = ref(true);
const isTableLoading = ref(false);

const today = moment().format('YYYY-MM-DD');
const filterDate = ref({
  start: today,
  end: today,
});
const filterSender = ref<SelectOption | null>(null);
const filterStatus = ref<SelectOption | null>(null);
const searchSender = ref('');

const senderOptions = ref<SelectOption[]>([]);

const historyItems = ref<ShippingHistoryItem[]>([]);
const historyCount = ref(0);
const historyCountPages = ref(0);
const currentPage = ref(1);
const historyLimit = 5;

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

const tableHeaders = computed(() => [
  {
    id: 'contact',
    text: t('contact'),
    flex: 1,
  },
  {
    id: 'queue',
    text: t('queue'),
    flex: 1,
  },
  {
    id: 'sentBy',
    text: t('mass_message.history.sent_by'),
    flex: 1,
  },
  {
    id: 'date',
    text: t('date'),
    flex: 1,
  },
  {
    id: 'status',
    text: t('mass_message.history.status'),
    flex: 1,
  },
]);

const paginationFrom = computed(() =>
  historyCount.value === 0 ? 0 : (currentPage.value - 1) * historyLimit + 1,
);

const paginationTo = computed(() =>
  Math.min(currentPage.value * historyLimit, historyCount.value),
);

const statusLabel = (status: string): string => {
  if (status === 'FAILED') {
    return t('mass_message.history.status_failed');
  }
  return t('mass_message.history.status_sent');
};

const statusScheme = (status: string): string => {
  return status === 'FAILED' ? 'red' : 'green';
};

const fetchSenders = async () => {
  let page = 1;
  const limit = 100;
  let hasNext = true;
  const options: SelectOption[] = [];

  while (hasNext) {
    const offset = (page - 1) * limit;
    const { results, next } = await ProjectService.agents(offset, limit);

    results.forEach(
      (representative: {
        user: { first_name?: string; last_name?: string; email: string };
      }) => {
        const { user } = representative;
        const fullName =
          `${user.first_name || ''} ${user.last_name || ''}`.trim();
        options.push({
          label: fullName || user.email,
          value: user.email,
        });
      },
    );

    hasNext = !!next;
    page += 1;
  }

  senderOptions.value = options;
};

const getShippingHistory = async (paginate = false) => {
  isTableLoading.value = true;

  if (!paginate) {
    currentPage.value = 1;
  }

  const offset = (currentPage.value - 1) * historyLimit;

  try {
    const response = await BulkMessageService.getShippingHistory({
      offset,
      limit: historyLimit,
      start_date: filterDate.value.start,
      end_date: filterDate.value.end,
      sender: filterSender.value?.value,
      status: filterStatus.value?.value,
    });

    historyItems.value = response.results;
    historyCount.value = response.count;
    historyCountPages.value = Math.ceil(response.count / historyLimit);
  } catch (error) {
    console.error('Error getting shipping history', error);
    historyItems.value = [];
    historyCount.value = 0;
    historyCountPages.value = 0;
  } finally {
    isTableLoading.value = false;
  }
};

const handlePageChange = (page: number) => {
  currentPage.value = page;
  getShippingHistory(true);
};

watch(isOpen, (value) => {
  if (!value) emit('close');
});

watch(
  [filterDate, filterSender, filterStatus],
  () => {
    getShippingHistory();
  },
  { deep: true },
);

onMounted(() => {
  fetchSenders();
  getShippingHistory();
});
</script>

<style scoped lang="scss">
.shipping-history-modal {
  &__content {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-4;
    min-height: 0;
    overflow: visible;
    padding: $unnnic-space-6;
  }

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

  &__footer {
    justify-content: space-between;
    width: 100%;
  }

  &__pagination-count {
    font: $unnnic-font-body;
    color: $unnnic-color-fg-emphasized;
    margin: 0;
  }
}
</style>
