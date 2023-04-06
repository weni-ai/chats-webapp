<template>
  <section class="card-group-metrics">
    <p class="title">
      <unnnic-avatar-icon :icon="icon" size="xs" :scheme="scheme" />
      <span> {{ title }} </span>
    </p>

    <section class="card-group-metrics__metrics">
      <unnnic-card-information
        v-for="metric in metrics.sectors"
        :key="metric.name"
        :name="metric.name"
        :statuses="[
          {
            title: 'Chats ativos',
            icon: 'indicator',
            scheme: 'aux-blue',
            count: 0,
          },
          {
            title: 'Aguardando atendimento',
            icon: 'synchronize-arrow-clock-4',
            scheme: 'feedback-blue',
            count: 0,
          },
          {
            title: 'Transferências',
            icon: 'time-clock-circle-1',
            scheme: 'aux-purple',
            count: 0,
          },
          {
            title: 'Tempo de espera',
            icon: 'time-clock-circle-1',
            scheme: 'aux-orange',
            count: timeToString(metric.waiting_time) || 0,
          },
          {
            title: 'Tempo de resposta',
            icon: 'messaging-we-chat-3',
            scheme: 'aux-purple',
            count: timeToString(metric.response_time) || 0,
          },
          {
            title: 'Tempo de interação',
            icon: 'messages-bubble-1',
            scheme: 'aux-lemon',
            count: timeToString(metric.interact_time) || 0,
          },
          // {
          //   title: totalChatsLabel,
          //   icon: 'headphones-customer-support-human-1-1',
          //   scheme: 'aux-blue',
          //   count: metric.online_agents || 0,
          // },
        ]"
      />
    </section>
  </section>
</template>

<script>
export default {
  props: {
    icon: {
      type: String,
      default: '',
    },
    metrics: {
      type: Object,
      // default: () => [],
    },
    scheme: {
      type: String,
      default: 'aux-blue',
    },
    title: {
      type: String,
      default: '',
    },
    totalChatsLabel: {
      type: String,
      default: '',
    },
  },
  mounted() {
    // console.log(this.metrics.sectors);
  },
  methods: {
    timeToString(minutes) {
      function duas_casas(numero) {
        if (numero <= 9) {
          // eslint-disable-next-line no-param-reassign
          numero = `0${numero}`;
        }
        return numero;
      }
      const hora = duas_casas(Math.floor(minutes / 3600));
      const minuto = duas_casas(Math.floor((minutes % 3600) / 60));
      const segundo = duas_casas(Math.floor(minutes % 3600) % 60);
      const formatado = {
        hour: hora,
        minute: minuto,
        seconds: segundo,
      };
      if (formatado.hour === '00' && formatado.minute !== '00') {
        return `${formatado.minute}min ${formatado.seconds}s`;
      }
      if (formatado.hour === '00' && formatado.minute === '00') {
        return `${formatado.seconds}s`;
      }
      return `${hora}h${minuto}min ${segundo}s`;
    },
  },
};
</script>

<style lang="scss" scoped>
.card-group-metrics {
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

  &__metrics {
    display: grid;
    gap: $unnnic-spacing-stack-sm;

    &.columns-2 {
      grid-template-columns: 1fr 1fr;
    }

    &.columns-3 {
      grid-template-columns: 1fr 1fr 1fr;
    }
  }
}
</style>
