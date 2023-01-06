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
          :percent="percent"
          :inverted-percentage="invertedPercentage"
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
          :percent="percent"
          :inverted-percentage="invertedPercentage"
        />
      </unnnic-tool-tip>
      <unnnic-tool-tip enabled text="É o tempo médio de resposta ao contato" side="right">
        <unnnic-card
          type="dash"
          title="Tempo de resposta"
          icon="messaging-we-chat-3"
          scheme="aux-purple"
          :value="timeToString(this.metrics.response_time)"
          :percent="percent"
          :inverted-percentage="invertedPercentage"
        />
      </unnnic-tool-tip>
      <unnnic-tool-tip enabled text="É o tempo médio de duração de um chat" side="left">
        <unnnic-card
          type="dash"
          title="Tempo de interação"
          icon="messages-bubble-1"
          scheme="aux-lemon"
          :value="timeToString(this.metrics.interact_time)"
          :percent="percent"
          :inverted-percentage="invertedPercentage"
        />
      </unnnic-tool-tip>
    </template>
  </section>
</template>

<script>
export default {
  props: {
    metrics: {
      type: Array,
      default: () => [],
    },
  },

  methods: {
    timeToString({ minutes }) {
      if (![null, undefined, ''].includes(minutes)) {
        return `${minutes}min`;
      }
      return '0min';
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
