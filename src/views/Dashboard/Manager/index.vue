<template>
  <dashboard-layout :filters.sync="filters" :metrics="generalMetrics">
    <template #header>
      {{ filters === 'Juliano' ? 'Juliano da Silva' : 'Construtora Stéfani' }}
    </template>

    <main class="metrics">
      <section v-if="filters === 'Juliano'" class="details">
        <section class="metric">
          <p class="title">
            <unnnic-avatar-icon icon="hierarchy-3-2" size="xs" />
            <span> Filas </span>
          </p>

          <section class="sectors">
            <unnnic-card-project
              v-for="queue in queues"
              :key="queue.id"
              :name="queue.name"
              :statuses="getRandomMetrics()"
            />
          </section>
        </section>

        <section class="metric">
          <p class="title">
            <unnnic-avatar-icon icon="indicator" size="xs" scheme="feedback-green" />
            <span> Agentes online </span>
          </p>

          <section class="online-agents-list">
            <header>
              <span>Contato</span>
              <span class="active-chats">Tempo de interação</span>
            </header>

            <section class="agent">
              <span>Luana Esteves Lopez</span>
              <span class="active-chats">11min 34s</span>
            </section>
            <section class="agent">
              <span>Vinícius Xavier</span>
              <span class="active-chats">32min 4s</span>
            </section>
            <section class="agent">
              <span>José Luis Filho</span>
              <span class="active-chats">54min 3s</span>
            </section>
          </section>
        </section>
      </section>

      <section v-else class="details">
        <section class="metric">
          <p class="title">
            <unnnic-avatar-icon icon="hierarchy-3-2" size="xs" />
            <span> Setores </span>
          </p>

          <section class="sectors">
            <unnnic-card-project
              v-for="sector in sectors"
              :key="sector.id"
              :name="sector.name"
              :statuses="getRandomMetrics()"
            />
          </section>
        </section>

        <section class="metric">
          <p class="title">
            <unnnic-avatar-icon icon="indicator" size="xs" scheme="feedback-green" />
            <span> Agentes online </span>
          </p>

          <section class="online-agents-list">
            <header>
              <span>Agente</span>
              <span class="active-chats">Chats ativos</span>
            </header>

            <section v-for="agent in onlineAgents" :key="agent.id" class="agent">
              <span>{{ agent.name }}</span>
              <span class="active-chats">{{ agent.activeChats }}</span>
            </section>
          </section>
        </section>
      </section>
    </main>
  </dashboard-layout>
</template>

<script>
import DashboardLayout from '@/layouts/DashboardLayout';

export default {
  name: 'DashboardView',

  components: {
    DashboardLayout,
  },

  data: () => ({
    filters: '',

    generalMetrics: [
      {
        title: 'Chats ativos',
        icon: 'indicator',
        scheme: 'aux-blue',
        value: 13,
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

    onlineAgents: [
      {
        id: 1,
        name: 'Fabrício Correia',
        activeChats: 3,
      },
      {
        id: 2,
        name: 'Daniela Maciel',
        activeChats: 4,
      },
      {
        id: 3,
        name: 'Maurício de Souza',
        activeChats: 2,
      },
      {
        id: 4,
        name: 'Fátima Albuquerque',
        activeChats: 3,
      },
    ],
  }),

  computed: {
    sectors() {
      return this.$store.state.settings.sectors;
    },
    queues() {
      return this.sectors ? this.sectors[0].queues : [];
    },
  },

  methods: {
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
  padding: {
    top: 0;
    right: $unnnic-spacing-inset-sm;
    bottom: $unnnic-spacing-inset-sm;
    left: 0;
  }

  display: flex;
  flex-direction: column;
  gap: $unnnic-spacing-stack-sm;

  .general {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: $unnnic-spacing-stack-sm;
  }

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

      .sectors {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: $unnnic-spacing-stack-sm;
      }

      .online-agents-list {
        & > * {
          display: grid;
          grid-template-columns: 3fr 1fr;
          padding: $unnnic-spacing-inset-sm;

          color: $unnnic-color-neutral-cloudy;
          font-size: $unnnic-font-size-body-gt;

          .active-chats {
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
