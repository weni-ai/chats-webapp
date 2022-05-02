<template>
  <section class="new-sector">
    <unnnic-tab v-model="tab" initialTab="sector" :tabs="tabs">
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
        <form-sector v-model="sector" @submit="tab = 'queue'" />
      </template>

      <template slot="tab-panel-queue">
        <form-queue v-model="sector.queues" />
      </template>

      <template slot="tab-panel-agents">
        <section>
          <form-agent v-model="sector.agents" :queues="sector.queues" :sector="sector.name" />
        </section>
      </template>
    </unnnic-tab>

    <div class="actions">
      <unnnic-button
        v-if="tab === 'agents'"
        text="Concluir"
        class="finish-button"
        @click="saveSector"
      />
      <unnnic-button
        v-else
        text="Continuar configurações de setor"
        iconRight="arrow-right-1-1"
        type="secondary"
        @click="nextTab"
      />
    </div>

    <unnnic-modal
      :showModal="isOpenSectorConfirmationDialog"
      text="Setor adicionado"
      modal-icon="check-circle-1-1"
      description="Setor de suporte, filas e agentes criados com sucesso"
      @close="redirectToHomepage"
    >
      <template #options>
        <unnnic-button text="Fechar" @click="redirectToHomepage" />
      </template>
    </unnnic-modal>
  </section>
</template>

<script>
import FormAgent from '@/components/settings/forms/Agent';
import FormQueue from '@/components/settings/forms/Queue';
import FormSector from '@/components/settings/forms/Sector';

export default {
  name: 'NewSector',

  components: {
    FormAgent,
    FormQueue,
    FormSector,
  },

  data: () => ({
    sector: {
      name: '',
      manager: '',
      workingDay: {
        start: '',
        end: '',
      },
      agents: [],
      queues: [],
      maxSimultaneousChatsByAgent: '',
    },
    isOpenSectorConfirmationDialog: false,
    tab: '',
    tabs: ['sector', 'queue', 'agents'],
  }),

  computed: {},

  methods: {
    nextTab() {
      const tabs = {
        sector: () => {
          this.tab = 'queue';
        },
        queue: () => {
          this.tab = 'agents';
        },
        agents: this.saveSector,
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
    async saveSector() {
      await this.$store.dispatch('settings/saveSector', this.sector);

      this.isOpenSectorConfirmationDialog = true;
    },
    redirectToHomepage() {
      this.$router.push('/settings/chats');
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

    gap: 1rem;

    & > * {
      width: 100%;
    }
  }
}
</style>
