<template>
  <main class="by-agent-dashboard">
    <section>
      <GeneralMetrics :metrics="generalMetrics" />
    </section>

    <section class="by-agent-dashboard__metrics">
      <CardGroupMetrics
        :metrics="queues"
        title="Filas"
        icon="hierarchy-3-2"
      />
      <TableMetrics
        :headers="tableHeaders"
        :items="activeChats"
        title="Chats ativos"
        icon="indicator"
      />
    </section>
  </main>
</template>

<script>
// import DashboardManagerApi from '@/services/api/resources/dashboard/dashboardManager';
import CardGroupMetrics from '../../CardGroupMetrics';
import GeneralMetrics from '../../GeneralMetrics';
import TableMetrics from '../../TableMetrics';
import { mapState } from 'pinia';
import { useSettings } from '@/store/modules/settings';

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
  mounted() {
    // this.initRealtimeSimulation();
    console.log(this.agents, `agent`);
  },

  destroyed() {
    clearInterval(this.realtimeSimulationController);
  },

  data: () => ({
    generalMetrics: [
      {
        title: 'Chats ativos',
        icon: 'indicator',
        tooltip: 'É o tempo médio de duração de um chat',
        scheme: 'aux-blue',
        value: 5,
        percent: -5,
        invertedPercentage: true,
      },
      {
        title: 'Tempo de espera',
        icon: 'time-clock-circle-1',
        type: 'time',
        scheme: 'aux-orange',
        value: {
          minutes: 3,
          seconds: 2,
        },
        percent: -5,
        invertedPercentage: true,
        tooltip: 'É tempo médio que o contato aguarda para ser atendido',
      },
      {
        title: 'Tempo de resposta',
        icon: 'messaging-we-chat-3',
        scheme: 'aux-purple',
        type: 'time',
        value: {
          minutes: 4,
          seconds: 24,
        },
        percent: 5,
        invertedPercentage: true,
        tooltip: 'É o tempo médio de resposta ao contato',
      },
      {
        title: 'Tempo de interação',
        tooltip: 'É o tempo médio de duração de um chat',
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
        text: 'Contato',
        value: 'contact',
      },
      {
        text: 'Tempo de interação',
        value: 'interactionTime',
      },
    ],

    realtimeSimulationController: null,
  }),

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
          title: 'Tempo de espera',
          icon: 'time-clock-circle-1',
          scheme: 'aux-orange',
          count: this.timeToString(this.getRandomTime(1, 5)),
        },
        {
          title: 'Tempo de resposta',
          icon: 'messaging-we-chat-3',
          scheme: 'aux-purple',
          count: this.timeToString(this.getRandomTime(2, 3)),
        },
        {
          title: 'Tempo de interação',
          icon: 'messages-bubble-1',
          tooltip: 'É o tempo médio de duração de um chat',
          scheme: 'aux-lemon',
          count: this.timeToString(this.getRandomTime(2, 3)),
        },
        {
          title: 'Agentes online',
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
