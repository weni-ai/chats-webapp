<template>
  <section class="new-sector">
    <sector-tabs v-model="tab">
      <template #sector>
        <form-sector v-model="sector" />
      </template>

      <template #queues>
        <form-queue v-model="sector.queues" />
      </template>

      <template #agents>
        <section>
          <form-agent v-model="sector.agents" :queues="sector.queues" :sector="sector.name" />
        </section>
      </template>
    </sector-tabs>

    <div class="actions">
      <unnnic-button
        v-if="tab !== 'agents'"
        text="Continuar configurações de setor"
        iconRight="arrow-right-1-1"
        type="secondary"
        @click="nextTab"
      />
      <unnnic-button v-else-if="sector.agents.length !== 0" text="Concluir" @click="saveSector" />
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
import SectorTabs from '@/components/settings/SectorTabs';

export default {
  name: 'NewSector',

  components: {
    FormAgent,
    FormQueue,
    FormSector,
    SectorTabs,
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
