<template>
  <main
    class="agent-history-metrics"
    data-testid="agent-history-dashboard"
  >
    <section data-testid="general-metrics-section">
      <GeneralMetrics
        :metrics="generalMetrics"
        data-testid="general-metrics"
      />
    </section>

    <section
      class="agent-history-metrics__metrics"
      data-testid="metrics-section"
    >
      <CardGroupMetrics
        :metrics="queues"
        :title="`${agentName} ${$t('in_queues')}`"
        icon="hierarchy-3-2"
        columns="3"
        data-testid="card-group-metrics"
      />
    </section>
  </main>
</template>

<script>
import { mapState } from 'pinia';

import CardGroupMetrics from '../../CardGroupMetrics.vue';
import GeneralMetrics from '../../GeneralMetrics.vue';

import { useSettings } from '@/store/modules/settings';

export default {
  name: 'HistoryMetricsByAgent',

  components: {
    CardGroupMetrics,
    GeneralMetrics,
  },

  props: {
    agentName: {
      type: String,
      default: '',
    },
  },

  data() {
    return {
      generalMetrics: [
        {
          title: this.$t('number_chats'),
          icon: 'indicator',
          scheme: 'aux-blue',
          value: 434,
          percent: -5,
          invertedPercentage: true,
        },
        {
          title: this.$t('wait_time'),
          icon: 'time-clock-circle-1',
          type: 'time',
          scheme: 'aux-orange',
          value: {
            minutes: 3,
            seconds: 2,
          },
          percent: -5,
          invertedPercentage: true,
          tooltip: this.$t('wait_time_tooltip'),
        },
        {
          title: this.$t('response_time'),
          icon: 'messaging-we-chat-3',
          scheme: 'aux-purple',
          type: 'time',
          value: {
            minutes: 4,
            seconds: 24,
          },
          percent: 5,
          invertedPercentage: true,
          tooltip: this.$t('average_response_time'),
        },
        {
          title: this.$t('interaction_time'),
          icon: 'messages-bubble-1',
          scheme: 'aux-lemon',
          type: 'time',
          value: {
            minutes: 46,
            seconds: 12,
          },
          percent: -5,
          invertedPercentage: true,
        },
      ],
    };
  },
  computed: {
    ...mapState(useSettings, ['sectors']),
    queues() {
      const { queues } = this.sectors[0];

      return queues.map((queue) => ({
        id: queue.id,
        name: queue.name,
        statuses: this.getRandomMetrics(),
      }));
    },
  },

  methods: {
    getRandomMetrics() {
      const metrics = [
        {
          title: this.$t('wait_time'),
          icon: 'time-clock-circle-1',
          scheme: 'aux-orange',
          count: this.timeToString(this.getRandomTime(1, 5)),
        },
        {
          title: this.$t('response_time'),
          icon: 'messaging-we-chat-3',
          scheme: 'aux-purple',
          count: this.timeToString(this.getRandomTime(2, 3)),
        },
        {
          title: this.$t('interaction_time'),
          tooltip: this.$t('average_interaction_time'),
          icon: 'messages-bubble-1',
          scheme: 'aux-lemon',
          count: this.timeToString(this.getRandomTime(2, 3)),
        },
        {
          title: this.$t('agents_online'),
          icon: 'headphones-customer-support-human-1-1',
          scheme: 'aux-blue',
          count: Math.round(Math.random() * (5 - 3) + 3), // random number between 3 and 5
        },
      ];

      return metrics;
    },
    getRandomTime(min, max) {
      const minutes = Math.random() * (max - min) + min;
      const seconds = Math.random() * 59;

      return {
        minutes: Math.round(minutes),
        seconds: Math.round(seconds),
      };
    },
    timeToString({ minutes, seconds }) {
      return `${minutes}min ${seconds}s`;
    },
  },
};
</script>

<style lang="scss" scoped>
.agent-history-metrics {
  display: flex;
  flex-direction: column;
  gap: $unnnic-spacing-stack-sm;
}
</style>
