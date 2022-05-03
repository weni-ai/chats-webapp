<template>
  <unnnic-tab v-model="tab" initialTab="sector" :tabs="tabs" class="sector-tabs">
    <template slot="tab-head-sector">
      <div class="form-tab">
        <span class="name">Novo Setor</span>
        <unnnic-tool-tip enabled text="Setor é uma área dentro da sua organização" side="right">
          <unnnic-icon-svg icon="information-circle-4" scheme="neutral-soft" size="sm" />
        </unnnic-tool-tip>
      </div>
    </template>

    <template slot="tab-head-queue">
      <div class="form-tab">
        <span class="name">Filas</span>
        <unnnic-tool-tip
          enabled
          text="Fila é onde o cliente aguarda atendimento de acordo com sua demanda"
          side="right"
        >
          <unnnic-icon-svg icon="information-circle-4" scheme="neutral-soft" size="sm" />
        </unnnic-tool-tip>
      </div>
    </template>

    <template slot="tab-head-agents">
      <div class="form-tab">
        <span class="name">Agentes</span>
        <unnnic-tool-tip enabled text="Agentes atendem os clientes através do Chats" side="right">
          <unnnic-icon-svg icon="information-circle-4" scheme="neutral-soft" size="sm" />
        </unnnic-tool-tip>
      </div>
    </template>

    <template slot="tab-panel-sector">
      <slot name="sector" />
    </template>

    <template slot="tab-panel-queue">
      <slot name="queues" />
    </template>

    <template slot="tab-panel-agents">
      <slot name="agents" />
    </template>
  </unnnic-tab>
</template>

<script>
export default {
  name: 'SectorTabs',

  props: {
    value: {
      type: String,
      default: '',
    },
  },

  data: () => ({
    tabs: ['sector', 'queue', 'agents'],
  }),

  computed: {
    tab: {
      get() {
        return this.value;
      },
      set(tab) {
        this.$emit('input', tab);
      },
    },
  },
};
</script>

<style lang="scss" scoped>
.sector-tabs {
  .form-tab {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
}
</style>
