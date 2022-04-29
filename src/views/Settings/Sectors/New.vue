<template>
  <section class="new-sector">
    <unnnic-tab v-model="tab" initialTab="queue" :tabs="tabs">
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
          <unnnic-icon-svg icon="information-circle-4" scheme="neutral-soft" size="sm" />
        </div>
      </template>

      <template slot="tab-head-agents">
        <div class="form-tab">
          <span class="name">Agentes</span>
          <unnnic-icon-svg icon="information-circle-4" scheme="neutral-soft" size="sm" />
        </div>
      </template>

      <template slot="tab-panel-sector">
        <form-sector @submit="tab = 'queue'" />
      </template>

      <template slot="tab-panel-queue">
        <form-queue v-model="queues" />
      </template>

      <template slot="tab-panel-agents">
        <section></section>
      </template>
    </unnnic-tab>

    <div v-show="isShowingActions" class="actions">
      <unnnic-button text="Voltar" type="secondary" @click="previousTab" />
      <unnnic-button text="Continuar" @click="nextTab" />
    </div>
  </section>
</template>

<script>
import FormQueue from '@/components/settings/forms/Queue';
import FormSector from '@/components/settings/forms/Sector';

export default {
  name: 'NewSector',

  components: {
    FormQueue,
    FormSector,
  },

  data: () => ({
    agents: [],
    queues: [],
    tab: '',
    tabs: ['sector', 'queue', 'agents'],
  }),

  computed: {
    isShowingActions() {
      const tabs = {
        sector: () => false,
        queue: () => !!this.queues.length,
        agents: () => !!this.agents.length,
      };

      return tabs[this.tab]?.() || false;
    },
  },

  methods: {
    nextTab() {
      const tabs = {
        sector: () => {
          this.tab = 'queue';
        },
        queue: () => {
          this.tab = 'agents';
        },
        agents: () => this.$router.push('/settings/chats'),
      };

      tabs[this.tab]?.();
    },
    previousTab() {
      const tabs = {
        queue: () => {
          this.tab = 'sector';
        },
        agents: () => {
          this.tab = 'queue';
        },
      };

      tabs[this.tab]?.();
    },
  },
};
</script>

<style lang="scss" scoped>
.new-sector {
  height: 100%;

  display: flex;
  flex-direction: column;

  .form-tab {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .actions {
    margin-top: auto;
    padding-top: 1.5rem;

    display: flex;
    gap: 1rem;

    & > * {
      flex: 1 1;
    }
  }
}
</style>
