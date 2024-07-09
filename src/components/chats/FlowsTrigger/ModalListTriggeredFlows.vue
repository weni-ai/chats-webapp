<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <UnnnicModal
    class="modal-list-triggered-flows"
    :text="$t('flows_trigger.triggered_flows.title')"
    @close="$emit('close')"
  >
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
    >
      {{ $t('without_results') }}
    </p>

    <template #options>
      <TablePagination
        v-model="triggeredFlowsCurrentPage"
        :count="triggeredFlowsCount"
        :countPages="triggeredFlowsCountPages"
        :limit="triggeredFlowsLimit"
        :isLoading="isPagesLoading"
        @update:model-value="triggeredFlowsCurrentPage = $event"
      />
    </template>
  </UnnnicModal>
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

  data: () => ({
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
    triggeredFlowsCurrentPage() {
      this.getListFlowsStart(true);
    },
    filterDate: 'getListFlowsStart',
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

  :deep(.unnnic-modal-container-background) {
    width: 66%; // -> 8 / 12
    height: 90%;

    display: grid;
    grid-template-rows: auto 1fr auto;

    overflow: visible;

    & > * {
      background-color: $unnnic-color-neutral-white;
    }

    .unnnic-modal-container-background-body {
      border-radius: $unnnic-spacing-nano $unnnic-spacing-nano 0 0;

      &-description {
        display: grid;
        grid-template-rows: auto 1fr;

        overflow: visible;

        &-container {
          padding-bottom: 0;

          overflow: visible;
        }
      }
    }

    .unnnic-modal-container-background-button {
      padding-top: 0;
    }
  }
}
</style>
