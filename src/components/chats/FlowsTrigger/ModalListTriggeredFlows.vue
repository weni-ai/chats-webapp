<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <unnnic-modal
    class="modal-list-triggered-flows"
    :text="$t('flows_trigger.triggered_flows.title')"
    @close="$emit('close')"
  >
    <section class="modal-list-triggered-flows__handlers">
      <div class="modal-list-triggered-flows__handlers__input">
        <unnnic-label :label="$t('filter.by_date')" />
        <unnnic-input-date-picker
          class="modal-list-triggered-flows__handlers__date-picker"
          v-model="filterDate"
          position="right"
          :inputFormat="$t('date_format')"
        />
      </div>
    </section>

    <triggered-flows-loading v-if="isTableLoading" />
    <unnnic-table
      v-if="!isTableLoading && triggeredFlows.length > 0"
      :items="triggeredFlows"
      class="modal-list-triggered-flows__table"
    >
      <template #header>
        <unnnic-table-row :headers="tableHeaders" />
      </template>

      <template #item="{ item }">
        <unnnic-table-row :headers="tableHeaders">
          <template #contactName>
            {{ item.contact_data?.name }}
          </template>

          <template #triggeredFlow> {{ item.name }} </template>

          <template #agent>{{ item.user }}</template>

          <template #date>{{ $d(new Date(item.created_on)) }}</template>

          <template #time>{{ getTime(item.created_on) }}</template>
        </unnnic-table-row>
      </template>
    </unnnic-table>
    <p
      v-if="!isTableLoading && triggeredFlows.length === 0"
      class="modal-list-triggered-flows__table__no-results"
    >
      {{ $t('without_results') }}
    </p>

    <div slot="options">
      <table-pagination
        v-model="triggeredFlowsCurrentPage"
        :count="triggeredFlowsCount"
        :countPages="triggeredFlowsCountPages"
        :limit="triggeredFlowsLimit"
        :is-loading="isPagesLoading"
      />
    </div>
  </unnnic-modal>
</template>

<script>
import moment from 'moment';

import TriggeredFlowsLoading from '@/views/loadings/TriggeredFlowsLoading';
import TablePagination from '@/components/TablePagination';

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

  async mounted() {
    this.triggeredFlows = await FlowsTrigger.listFlowsStart();
  },

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

  methods: {
    getTime(date) {
      return moment(date).format('HH:mm');
    },
  },
};
</script>

<style lang="scss" scoped>
.modal-list-triggered-flows {
  &__handlers {
    margin-bottom: $unnnic-spacing-sm;

    display: flex;
    justify-content: flex-end;

    &__input {
      display: grid;
      justify-items: start;
    }

    &__date-picker {
      display: grid;
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

    & > * {
      background-color: $unnnic-color-neutral-white;
    }

    .unnnic-modal-container-background-body-description {
      display: flex;
      flex-direction: column;

      overflow: visible;
    }
    .unnnic-modal-container-background-body-description-container {
      padding-bottom: 0;
      overflow: visible hidden;
    }

    .unnnic-modal-container-background-button {
      padding-top: 0;
    }
  }
}
</style>
