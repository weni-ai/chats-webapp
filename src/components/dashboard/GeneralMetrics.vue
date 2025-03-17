<template>
  <section class="general-metrics">
    <UnnnicToolTip
      enabled
      :text="
        generalLabel === $t('in_progress')
          ? $t('in_progress_tooltip')
          : $t('in_progress_tooltip_filtered')
      "
      side="bottom"
      maxWidth="15rem"
    >
      <UnnnicCard
        type="dash"
        :title="generalLabel"
        icon="mark_chat_unread"
        scheme="aux-green-500"
        :value="rawData.raw_data?.[0].active_rooms || 0"
        :percent="0"
        :invertedPercentage="false"
        data-testid="general-metric-card"
      />
    </UnnnicToolTip>
    <UnnnicToolTip
      enabled
      :text="$t('wait_assistance_tooltip')"
      side="bottom"
      maxWidth="15rem"
    >
      <UnnnicCard
        type="dash"
        :title="$t('chats.waiting_assistance')"
        icon="pending"
        scheme="aux-blue-500"
        :value="rawData.raw_data?.[0].queue_rooms || 0"
        :percent="0"
        :invertedPercentage="false"
        data-testid="general-metric-card"
      />
    </UnnnicToolTip>
    <UnnnicToolTip
      enabled
      :text="$t('qtd_closed_tooltip')"
      side="bottom"
      maxWidth="15rem"
    >
      <UnnnicCard
        type="dash"
        :title="$t('closed')"
        icon="check_circle"
        scheme="aux-purple-500"
        :value="rawData.raw_data?.[0].closed_rooms || 0"
        :percent="0"
        :invertedPercentage="false"
        data-testid="general-metric-card"
      />
    </UnnnicToolTip>
    <UnnnicToolTip
      enabled
      :text="$t('average_time_to_assistance_tooltip')"
      side="bottom"
      maxWidth="15rem"
    >
      <UnnnicCard
        type="dash"
        :title="$t('wait_time')"
        icon="chronic"
        scheme="aux-orange-500"
        :value="timeToString(metrics.rooms_data?.[0].waiting_time)"
        :percent="0"
        :invertedPercentage="false"
        data-testid="general-metric-card"
      />
    </UnnnicToolTip>
    <UnnnicToolTip
      enabled
      :text="$t('average_time_to_response_tooltip')"
      side="bottom"
      maxWidth="15rem"
    >
      <UnnnicCard
        type="dash"
        :title="$t('response_time')"
        icon="acute"
        scheme="aux-red-500"
        :value="timeToString(metrics.rooms_data?.[0].response_time)"
        :percent="0"
        :invertedPercentage="false"
        data-testid="general-metric-card"
      />
    </UnnnicToolTip>
    <UnnnicToolTip
      enabled
      :text="$t('average_time_to_complete_assistence_tooltip')"
      side="bottom"
      maxWidth="15rem"
    >
      <UnnnicCard
        type="dash"
        :title="$t('interaction_time')"
        icon="history_toggle_off"
        scheme="aux-yellow-500"
        :value="timeToString(metrics.rooms_data?.[0].interact_time)"
        :percent="0"
        :invertedPercentage="false"
        data-testid="general-metric-card"
      />
    </UnnnicToolTip>
  </section>
</template>

<script>
export default {
  props: {
    metrics: {
      type: Object,
      default: () => {},
    },
    rawData: {
      type: Object,
      default: () => {},
    },
    generalLabel: {
      type: String,
      default: '',
    },
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
      const segundo = duas_casas(Math.floor((minutes % 3600) % 60));
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
      if (hora || minuto || segundo) {
        return `${hora}h${minuto}min ${segundo}s`;
      }
      return 0;
    },
  },
};
</script>

<style lang="scss" scoped>
.general-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $unnnic-spacing-stack-sm;

  height: min-content;
}
</style>
