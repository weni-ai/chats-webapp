<template>
  <main
    class="by-agent-dashboard"
    data-testid="by-agent-dashboard"
  >
    <section data-testid="general-metrics-section">
      <GeneralMetrics
        :metrics="generalMetrics"
        data-testid="general-metrics"
      />
    </section>

    <section
      class="by-agent-dashboard__metrics"
      data-testid="metrics-section"
    >
      <CardGroupMetrics
        :metrics="queues"
        :title="$t('queues.title')"
        icon="hierarchy-3-2"
        data-testid="card-group-metrics"
      />
      <TableMetrics
        :headers="tableHeaders"
        :items="activeChats"
        :title="$t('active_chats')"
        icon="indicator"
        data-testid="table-metrics"
      />
    </section>
  </main>
</template>

<script>
// import DashboardManagerApi from '@/services/api/resources/dashboard/dashboardManager';
import { mapState } from 'pinia';
import { useSettings } from '@/store/modules/settings';
import CardGroupMetrics from '../../CardGroupMetrics.vue';
import GeneralMetrics from '../../GeneralMetrics.vue';
import TableMetrics from '../../TableMetrics.vue';

export default {
  name: 'LiveMetricsByAgent',

  components: {
    CardGroupMetrics,
    GeneralMetrics,
    TableMetrics,
  },
  props: {
    agents: {
      type: {},
      default: {},
    },
  },

  data() {
    return {
      generalMetrics: [
        {
          title: this.$t('active_chats'),
          icon: 'indicator',
          tooltip: this.$t('average_interaction_time'),
          scheme: 'aux-blue',
          value: 5,
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
          tooltip: this.$t('average_interaction_time'),
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
      tableHeaders: [
        {
          text: this.$t('contact'),
          value: 'contact',
        },
        {
          text: this.$t('interaction_time'),
          value: 'interactionTime',
        },
      ],

      activeChats: [
        {
          id: 1,
          contact: 'John Doe',
          interactionTime: '5min 30s',
        },
        {
          id: 2,
          contact: 'Jane Smith',
          interactionTime: '3min 15s',
        },
        {
          id: 3,
          contact: 'Mike Johnson',
          interactionTime: '7min 45s',
        },
      ],

      realtimeSimulationController: null,
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
  mounted() {
    // this.initRealtimeSimulation();
    console.log(this.agents, `agent`);
  },

  unmounted() {
    clearInterval(this.realtimeSimulationController);
  },

  methods: {
    initRealtimeSimulation() {
      this.realtimeSimulationController = setInterval(
        this.updateRandomMetric,
        5000,
      );
    },
    updateRandomMetric() {
      const randomMetricIndex = Math.floor(
        Math.random() * this.generalMetrics.length,
      );
      const metric = this.generalMetrics[randomMetricIndex];

      if (Math.random() > 0.2) {
        const propToChange = Math.random() > 0.3 ? 'value' : 'percent';
        const value = Math.random() > 0.5 ? +1 : -1;

        if (propToChange === 'value') {
          if (metric.type === 'time') {
            metric.value.seconds += value;
            if (metric.value.seconds < 0 || metric.value.seconds > 59) {
              metric.value.seconds = 0;
            }
          } else {
            metric.value += value;
            if (metric.value < 1) {
              metric.value = 1;
            }
          }
        } else {
          metric.percent += value;
        }

        this.generalMetrics[randomMetricIndex] = metric;
      }
    },

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
          icon: 'messages-bubble-1',
          tooltip: this.$t('average_interaction_time'),
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
.by-agent-dashboard {
  display: flex;
  flex-direction: column;
  gap: $unnnic-spacing-stack-sm;

  &__metrics {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: $unnnic-spacing-stack-sm;

    & > :first-child {
      grid-column: span 2;
    }
  }
}
</style>
