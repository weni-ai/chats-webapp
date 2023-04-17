<template>
  <section class="general-metrics">
    <template>
      <unnnic-tool-tip
        enabled
        text="Quantidade de chats que já estão sendo atendidos por um agente"
        side="bottom"
        maxWidth="15rem"
      >
        <unnnic-card
          type="dash"
          :title="generalLabel"
          icon="indicator"
          scheme="aux-blue"
          :value="this.metrics.active_chats || 0"
          :percent="0"
          :inverted-percentage="false"
        />
      </unnnic-tool-tip>
      <unnnic-tool-tip
        enabled
        text="Quantidade de contatos aguardando o início do atendimento"
        side="bottom"
        maxWidth="15rem"
      >
        <unnnic-card
          type="dash"
          title="Aguardando atendimento"
          icon="synchronize-arrow-clock-4"
          scheme="feedback-blue"
          :value="this.rawData.queue_rooms || 0"
          :percent="0"
          :inverted-percentage="false"
        />
      </unnnic-tool-tip>
      <unnnic-tool-tip
        enabled
        text="Quantidade de transferências realizadas até agora"
        side="bottom"
        maxWidth="15rem"
      >
        <unnnic-card
          type="dash"
          title="Transferências"
          icon="synchronize-arrow-clock-4"
          scheme="aux-purple"
          :value="this.rawData.transfer_count || 0"
          :percent="0"
          :inverted-percentage="false"
        />
      </unnnic-tool-tip>
      <unnnic-tool-tip
        enabled
        text="Média de tempo que os contatos aguardam até serem atendidos"
        side="bottom"
        maxWidth="15rem"
      >
        <unnnic-card
          type="dash"
          title="Tempo de espera"
          icon="time-clock-circle-1"
          scheme="aux-orange"
          :value="timeToString(this.metrics.waiting_time)"
          :percent="0"
          :inverted-percentage="false"
        />
      </unnnic-tool-tip>
      <unnnic-tool-tip
        enabled
        text="Média de tempo que o contato aguarda para ser respondido"
        side="bottom"
        maxWidth="15rem"
      >
        <unnnic-card
          type="dash"
          title="Tempo de resposta"
          icon="messaging-we-chat-3"
          scheme="aux-purple"
          :value="timeToString(this.metrics.response_time)"
          :percent="0"
          :inverted-percentage="false"
        />
      </unnnic-tool-tip>
      <unnnic-tool-tip
        enabled
        text="Média de tempo que um atendimento completo demora"
        side="bottom"
        maxWidth="15rem"
      >
        <unnnic-card
          type="dash"
          title="Tempo de interação"
          icon="messages-bubble-1"
          scheme="aux-lemon"
          :value="timeToString(this.metrics.interact_time)"
          :percent="0"
          :inverted-percentage="false"
        />
      </unnnic-tool-tip>
    </template>
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
  widows: 50%;
  grid-template-columns: repeat(3, 1fr);
  gap: $unnnic-spacing-stack-sm;
}
</style>
