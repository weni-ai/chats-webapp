<template>
  <section class="general-metrics">
    <template>
      <unnnic-tool-tip enabled text="Quantidade de chats em andamento" side="right">
        <unnnic-card
          type="dash"
          title="Chats ativos"
          icon="indicator"
          scheme="aux-blue"
          :value="this.metrics.active_chats"
          :percent="0"
          :inverted-percentage="false"
        />
      </unnnic-tool-tip>
      <unnnic-tool-tip
        enabled
        text="É tempo médio que o contato aguarda para ser atendido"
        side="right"
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
      <unnnic-tool-tip enabled text="É o tempo médio de resposta ao contato" side="right">
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
      <unnnic-tool-tip enabled text="É o tempo médio de duração de um chat" side="left">
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
  },

  mounted() {
    // console.log(this.metrics, 'metrics');
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
      const hora = duas_casas(Math.round(minutes / 3600));
      const minuto = duas_casas(Math.round((minutes % 3600) / 60));
      const segundo = duas_casas(Math.round(minutes % 3600) % 60);
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
.general-metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $unnnic-spacing-stack-sm;
}
</style>
