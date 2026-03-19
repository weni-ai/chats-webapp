<template>
  <UnnnicDialog
    v-model:open="isOpen"
    class="modal-list-triggered-flows"
    data-testid="modal-list-triggered-flows"
  >
    <UnnnicDialogContent size="large">
      <UnnnicDialogHeader>
        <UnnnicDialogTitle>
          {{ $t('flows_trigger.triggered_flows.title') }}
        </UnnnicDialogTitle>
      </UnnnicDialogHeader>
      <section class="modal-list-triggered-flows__content">
        <section class="modal-list-triggered-flows__handlers">
          <div class="modal-list-triggered-flows__handlers__input">
            <UnnnicLabel :label="$t('filter.by_date')" />
            <UnnnicInputDatePicker
              v-model="filterDate"
              class="modal-list-triggered-flows__handlers__date-picker"
              position="left"
              :inputFormat="$t('date_format')"
            />
          </div>
        </section>

        <TriggeredFlowsLoading v-if="isTableLoading" />
        <UnnnicTable
          v-if="!isTableLoading && triggeredFlows.length > 0"
          :items="triggeredFlows"
          class="modal-list-triggered-flows__table"
          data-testid="modal-list-triggered-flows-table"
        >
          <template #header>
            <UnnnicTableRow :headers="tableHeaders" />
          </template>

          <template #item="{ item }">
            <UnnnicTableRow :headers="tableHeaders">
              <template #contactName>
                {{ item.contact_data?.name }}
              </template>

              <template #triggeredFlow> {{ item.name }} </template>

              <template #agent>{{ item.user }}</template>

              <template #date>{{ $d(new Date(item.created_on)) }}</template>

              <template #time>{{ getTime(item.created_on) }}</template>
            </UnnnicTableRow>
          </template>
        </UnnnicTable>
        <p
          v-if="!isTableLoading && triggeredFlows.length === 0"
          class="modal-list-triggered-flows__table__no-results"
          data-testid="no-results-text"
        >
          {{ $t('without_results') }}
        </p>
      </section>
      <UnnnicDialogFooter>
        <TablePagination
          v-model="triggeredFlowsCurrentPage"
          :count="triggeredFlowsCount"
          :countPages="triggeredFlowsCountPages"
          :limit="triggeredFlowsLimit"
          :isLoading="isPagesLoading"
          data-testid="modal-list-triggered-flows-table-pagination"
          @update:model-value="triggeredFlowsCurrentPage = $event"
        />
      </UnnnicDialogFooter>
    </UnnnicDialogContent>
  </UnnnicDialog>
</template>

<script>
import moment from 'moment';

import TriggeredFlowsLoading from '@/views/loadings/FlowsTrigger/TriggeredFlowsLoading.vue';
import TablePagination from '@/components/TablePagination.vue';

import FlowsTrigger from '@/services/api/resources/chats/flowsTrigger.js';

export default {
  name: 'ModalListTriggeredFlows',

  components: {
    TriggeredFlowsLoading,
    TablePagination,
  },
  emits: ['close'],

  data: () => ({
    isOpen: true,
    isTableLoading: false,
    isPagesLoading: false,

    filterDate: {
      start: moment().subtract(1, 'day').format('YYYY-MM-DD'),
      end: moment().format('YYYY-MM-DD'),
    },

    triggeredFlows: [],
    triggeredFlowsCount: 0,
    triggeredFlowsCountPages: 0,
    triggeredFlowsCurrentPage: 1,
    triggeredFlowsLimit: 5,
  }),

  computed: {
    tableHeaders() {
      return [
        {
          id: 'contactName',
          text: this.$t('contact'),
          flex: 1,
        },
        {
          id: 'triggeredFlow',
          text: this.$t('flows_trigger.triggered_flows.single'),
          flex: 1,
        },
        {
          id: 'agent',
          text: this.$t('agent'),
          flex: 1,
        },
        {
          id: 'date',
          text: this.$t('date'),
          flex: 1,
        },
        {
          id: 'time',
          text: this.$t('flows_trigger.triggered_flows.trigger_time'),
          flex: 1,
        },
      ];
    },
  },
  watch: {
    isOpen(value) {
      if (!value) this.$emit('close');
    },
    triggeredFlowsCurrentPage() {
      this.getListFlowsStart(true);
    },
    filterDate: {
      deep: true,
      handler() {
        this.getListFlowsStart();
      },
    },
  },

  async mounted() {
    this.getListFlowsStart();
  },

  methods: {
    getTime(date) {
      return moment(date).format('HH:mm');
    },
    async getListFlowsStart(paginate) {
      this.isTableLoading = true;
      this.isPagesLoading = true;

      const { triggeredFlowsCurrentPage, triggeredFlowsLimit, filterDate } =
        this;

      if (paginate !== true) {
        this.triggeredFlowsCurrentPage = 1;
      }

      const offset = (triggeredFlowsCurrentPage - 1) * triggeredFlowsLimit;

      try {
        const response = await FlowsTrigger.listFlowsStart({
          offset,
          limit: triggeredFlowsLimit,
          created_on_after: filterDate.start,
          created_on_before: filterDate.end,
        });
        this.triggeredFlows = response.results;
        this.triggeredFlowsCount = response.count;
        this.triggeredFlowsCountPages = Math.ceil(
          response.count / triggeredFlowsLimit,
        );
      } catch (error) {
        console.log(error);
      }

      this.isTableLoading = false;
      this.isPagesLoading = false;
    },
  },
};
</script>

<style lang="scss" scoped>
.modal-list-triggered-flows {
  &__handlers {
    margin-bottom: $unnnic-spacing-sm;

    display: flex;
    justify-content: flex-start;

    &__input {
      display: grid;
      justify-items: start;
    }

    &__date-picker.dropdown {
      display: grid;
      :deep(.input) {
        min-width: 230px;
      }
    }
  }

  &__content {
    display: grid;
    grid-template-rows: auto 1fr;
    min-height: 0;
    overflow: visible;
    padding: $unnnic-space-6;
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
}
</style>
