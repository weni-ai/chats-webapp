<template>
  <section class="general-metrics">
    <UnnnicToolTip
      enabled
      :text="
        generalLabel === `Em andamento`
          ? `Quantidade de chats que já estão sendo atendidos por um agente`
          : `Quantidade de chats que foram atendidos por um agente `
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
      />
    </UnnnicToolTip>
    <UnnnicToolTip
      enabled
      text="Quantidade de contatos aguardando o início do atendimento"
      side="bottom"
      maxWidth="15rem"
    >
      <UnnnicCard
        type="dash"
        title="Aguardando atendimento"
        icon="pending"
        scheme="aux-blue-500"
        :value="rawData.raw_data?.[0].queue_rooms || 0"
        :percent="0"
        :invertedPercentage="false"
      />
    </UnnnicToolTip>
    <UnnnicToolTip
      enabled
      text="Quantidade de chats encerrados"
      side="bottom"
      maxWidth="15rem"
    >
      <UnnnicCard
        type="dash"
        title="Encerrados"
        icon="check_circle"
        scheme="aux-purple-500"
        :value="rawData.raw_data?.[0].closed_rooms || 0"
        :percent="0"
        :invertedPercentage="false"
      />
    </UnnnicToolTip>
    <UnnnicToolTip
      enabled
      text="Média de tempo que os contatos aguardam até serem atendidos"
      side="bottom"
      maxWidth="15rem"
    >
      <UnnnicCard
        type="dash"
        title="Tempo de espera"
        icon="chronic"
        scheme="aux-orange-500"
        :value="timeToString(metrics.rooms_data?.[0].waiting_time)"
        :percent="0"
        :invertedPercentage="false"
      />
    </UnnnicToolTip>
    <UnnnicToolTip
      enabled
      text="Média de tempo que o contato aguarda para ser respondido"
      side="bottom"
      maxWidth="15rem"
    >
      <UnnnicCard
        type="dash"
        title="Tempo de resposta"
        icon="acute"
        scheme="aux-red-500"
        :value="timeToString(metrics.rooms_data?.[0].response_time)"
        :percent="0"
        :invertedPercentage="false"
      />
    </UnnnicToolTip>
    <UnnnicToolTip
      enabled
      text="Média de tempo que um atendimento completo demora"
      side="bottom"
      maxWidth="15rem"
    >
      <UnnnicCard
        type="dash"
        title="Tempo de interação"
        icon="history_toggle_off"
        scheme="aux-yellow-500"
        :value="timeToString(metrics.rooms_data?.[0].interact_time)"
        :percent="0"
        :invertedPercentage="false"
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
