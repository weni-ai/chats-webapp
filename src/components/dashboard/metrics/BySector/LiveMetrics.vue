<template>
  <main class="by-sector-dashboard">
    <section>
      <GeneralMetrics :metrics="generalMetrics" />
    </section>

    <section class="by-sector-dashboard__metrics">
      <CardGroupMetrics
        :metrics="queues"
        title="Filas"
        icon="hierarchy-3-2"
      />
      <TableMetrics
        :headers="tableHeaders"
        :items="activeChats"
        title="Agentes online"
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

  data: () => ({
    generalMetrics: [
      {
        title: 'Chats ativos',
        icon: 'indicator',
        scheme: 'aux-blue',
        tooltip: 'Quantidade de chats em andamento',
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
        text: 'Agente',
        value: 'name',
      },
      {
        text: 'Chats ativos',
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
          tooltip: 'É o tempo médio de duração de um chat',
          icon: 'messages-bubble-1',
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
