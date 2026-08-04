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
        <Filters
          v-model:date="filterDate"
          v-model:sender="filterSender"
          v-model:status="filterStatus"
          :senderOptions="senderOptions"
        />

        <HistoryTable
          :items="historyItems"
          :loading="isTableLoading"
          :headers="tableHeaders"
        />
      </section>

      <Footer
        :currentPage="currentPage"
        :from="paginationFrom"
        :to="paginationTo"
        :total="historyCount"
        :max="historyCountPages"
        :show="historyLimit"
        @update:current-page="handlePageChange"
      />
    </UnnnicDialogContent>
  </UnnnicDialog>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import moment from 'moment';

import BulkMessageService from '@/services/api/resources/chats/bulkMessage';
import ProjectService from '@/services/api/resources/settings/project';

import i18n from '@/plugins/i18n';

import Filters from './Filters.vue';
import HistoryTable from './HistoryTable.vue';
import Footer from './Footer.vue';

import type {
  FilterDate,
  SelectOption,
  ShippingHistoryItem,
  TableHeader,
} from './types';

defineOptions({
  name: 'ShippingHistoryModal',
});

const emit = defineEmits<{
  close: [void];
}>();

const { t } = i18n.global;

const isOpen = ref(true);
const isTableLoading = ref(false);

const today = moment().format('YYYY-MM-DD');
const filterDate = ref<FilterDate>({
  start: today,
  end: today,
});
const filterSender = ref<SelectOption | null>(null);
const filterStatus = ref<SelectOption | null>(null);

const senderOptions = ref<SelectOption[]>([]);

const historyItems = ref<ShippingHistoryItem[]>([]);
const historyCount = ref(0);
const historyCountPages = ref(0);
const currentPage = ref(1);
const historyLimit = 5;

const tableHeaders = computed<TableHeader[]>(() => [
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
}
</style>
