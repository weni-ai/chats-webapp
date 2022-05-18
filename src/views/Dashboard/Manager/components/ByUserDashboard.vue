<template>
  <main class="metrics">
    <section>
      <general-metrics :metrics="generalMetrics" />
    </section>

    <section class="details">
      <section class="metric">
        <p class="title">
          <unnnic-avatar-icon icon="hierarchy-3-2" size="xs" />
          <span> Filas </span>
        </p>

        <section class="queues">
          <unnnic-card-project
            v-for="queue in queues"
            :key="queue.id"
            :name="queue.name"
            :statuses="queue.statuses"
          />
        </section>
      </section>

      <section class="metric">
        <p class="title">
          <unnnic-avatar-icon icon="indicator" size="xs" scheme="feedback-green" />
          <span> Chats ativos </span>
        </p>

        <section class="active-chats-list">
          <header>
            <span>Contato</span>
            <span>Tempo de interação</span>
          </header>

          <section v-for="agent in activeChats" :key="agent.id" class="agent">
            <span>{{ agent.name }}</span>
            <span class="interaction-time">{{ agent.interactionTime }}</span>
          </section>
        </section>
      </section>
    </section>
  </main>
</template>

<script>
import GeneralMetrics from '../../components/GeneralMetrics';

export default {
  name: 'ManagerGeneralDashboard',

  components: {
    GeneralMetrics,
  },

  mounted() {
    this.initRealtimeSimulation();
  },

  destroyed() {
    clearInterval(this.realtimeSimulationController);
  },

  data: () => ({
    generalMetrics: [
      {
        title: 'Chats ativos',
        icon: 'indicator',
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

    realtimeSimulationController: null,
  }),

  computed: {
    queues() {
      const { queues } = this.$store.state.settings.sectors[0];

      return queues.map((queue) => ({
        id: queue.id,
        name: queue.name,
        statuses: this.getRandomMetrics(),
      }));
    },
    activeChats() {
      return [
        {
          id: 1,
          name: 'Luana Esteves Lopez',
          interactionTime: this.timeToString(this.getRandomTime(10, 59)),
        },
        {
          id: 2,
          name: 'Vinícius Xavier',
          interactionTime: this.timeToString(this.getRandomTime(10, 59)),
        },
        {
          id: 3,
          name: 'José Luis Filho',
          interactionTime: this.timeToString(this.getRandomTime(10, 59)),
        },
      ];
    },
  },

  methods: {
    initRealtimeSimulation() {
      this.realtimeSimulationController = setInterval(this.updateRandomMetric, 5000);
    },
    updateRandomMetric() {
      const randomMetricIndex = Math.floor(Math.random() * this.generalMetrics.length);
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
.metrics {
  display: flex;
  flex-direction: column;
  gap: $unnnic-spacing-stack-sm;

  .details {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: $unnnic-spacing-stack-sm;

    & > :first-child {
      grid-column: span 2;
    }

    .metric {
      background: $unnnic-color-background-snow;
      padding: $unnnic-spacing-inset-sm;
      border-radius: $unnnic-border-radius-sm;

      .title {
        display: flex;
        align-items: center;
        gap: $unnnic-spacing-stack-xs;
        font-size: $unnnic-font-size-title-sm;
        color: $unnnic-color-neutral-darkest;
        margin-bottom: $unnnic-spacing-inline-sm;
      }

      .queues {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: $unnnic-spacing-stack-sm;
      }

      .active-chats-list {
        & > * {
          display: grid;
          grid-template-columns: 1fr 1fr;
          padding: $unnnic-spacing-inset-sm;

          color: $unnnic-color-neutral-cloudy;
          font-size: $unnnic-font-size-body-gt;

          .interaction-time {
            text-align: center;
          }
        }

        header {
          background: $unnnic-color-background-carpet;
          color: $unnnic-color-neutral-cloudy;
          border-radius: $unnnic-border-radius-sm;
        }
      }
    }
  }
}
</style>
