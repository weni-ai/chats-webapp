<template>
  <section class="card-group-metrics">
    <p class="title">
      <UnnnicAvatarIcon
        :icon="icon"
        size="xs"
        :scheme="scheme"
      />
      <span> {{ title }} </span>
    </p>

    <section class="card-group-metrics__metrics">
      <UnnnicCardInformation
        v-for="metric in metrics.sectors"
        :key="metric.name"
        :name="metric.name"
        :statuses="[
          {
            title: 'Em andamento',
            icon: 'mark_chat_unread',
            scheme: 'aux-green-500',
            count: metric.active_rooms || 0,
          },
          {
            title: 'Aguardando atendimento',
            icon: 'pending',
            scheme: 'aux-blue-500',
            count: metric.active_chats || 0,
          },
          {
            title: 'Encerrados',
            icon: 'check_circle',
            scheme: 'aux-purple-500',
            count: metric.closed_rooms || 0,
          },
          {
            title: 'Tempo de espera',
            icon: 'chronic',
            scheme: 'aux-orange-500',
            count: timeToString(metric.waiting_time) || 0,
          },
          {
            title: 'Tempo de resposta',
            icon: 'acute',
            scheme: 'aux-red-500',
            count: timeToString(metric.response_time) || 0,
          },
          {
            title: 'Tempo de interação',
            icon: 'history_toggle_off',
            scheme: 'aux-yellow-500',
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

    :deep(.unnnic-card-container) {
      .statuses {
        // !important at grid-template-columns is needed here because the
        // unnnicCardInformation base uses inline styles
        grid-template-columns: repeat(3, minmax(90px, 1fr)) !important;
        gap: $unnnic-spacing-ant;
      }
    }
  }
}
</style>
