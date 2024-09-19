<template>
  <main class="by-sector-dashboard">
    <section>
      <GeneralMetrics :metrics="generalMetrics" />
    </section>

    <section class="by-sector-dashboard__metrics">
      <CardGroupMetrics
        :metrics="queues"
        :title="$t('queues.title')"
        icon="hierarchy-3-2"
      />
      <TableMetrics
        :headers="tableHeaders"
        :items="activeChats"
        :title="$t('agents_online')"
        icon="indicator"
      />
    </section>
  </main>
</template>

<script>
import { mapState } from 'pinia';
import { useSettings } from '@/store/modules/settings';
import CardGroupMetrics from '../../CardGroupMetrics.vue';
import GeneralMetrics from '../../GeneralMetrics.vue';
import TableMetrics from '../../TableMetrics.vue';

export default {
  name: 'LiveMetricsBySector',

  components: {
    CardGroupMetrics,
    GeneralMetrics,
    TableMetrics,
  },

  data() {
    return {
      generalMetrics: [
        {
          title: this.$t('active_chats'),
          icon: 'indicator',
          scheme: 'aux-blue',
          tooltip: this.$t('active_chats_tooltip'),
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
          text: this.$t('agent'),
          value: 'name',
        },
        {
          text: this.$t('active_chats'),
          value: 'activeChats',
        },
      ],
      activeChats: [
        {
          id: 1,
          name: 'Fabricio Correiaaaaaaaaaaaa',
          activeChats: 3,
        },
        {
          id: 2,
          name: 'Daniela Maciel',
          activeChats: 4,
        },
        {
          id: 3,
          name: 'Juliano Mello',
          activeChats: 4,
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
    this.initRealtimeSimulation();
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
          tooltip: 'É o tempo médio de duração de um chat',
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
.by-sector-dashboard {
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
