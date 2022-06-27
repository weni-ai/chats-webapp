<template>
  <section class="new-sector">
    <div class="scrollable">
      <sector-tabs v-model="tab">
        <template #sector>
          <form-sector v-model="sector" @validate="isSectorFormValid = $event" />
        </template>

        <template #queues>
          <form-queue
            v-model="sector.queues"
            :sector="sector.name"
            @validate="isQueuesFormValid = $event"
          />
        </template>

        <template #agents>
          <section>
            <form-agent
              v-model="sector.agents"
              :queues="sector.queues"
              :sector="sector.name"
              @validate="isAgentsFormValid = $event"
            />
          </section>
        </template>

        <template #tags>
          <section>
            <form-tags v-model="sector.tags" />
          </section>
        </template>
      </sector-tabs>
    </div>

    <div class="actions">
      <unnnic-button
        v-if="tab !== 'tags'"
        text="Continuar configurações de setor"
        iconRight="arrow-right-1-1"
        type="secondary"
        :disabled="!isActiveFormValid"
        @click="nextTab"
      />
      <unnnic-button v-else :disabled="!isActiveFormValid" text="Concluir" @click="saveSector" />
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
import FormTags from '@/components/settings/forms/Tags';
import SectorTabs from '@/components/settings/SectorTabs';

export default {
  name: 'NewSector',

  components: {
    FormAgent,
    FormQueue,
    FormSector,
    FormTags,
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
      tags: [],
      maxSimultaneousChatsByAgent: '',
    },
    isSectorFormValid: false,
    isQueuesFormValid: false,
    isAgentsFormValid: false,
    isOpenSectorConfirmationDialog: false,
    tab: '',
    tabs: ['sector', 'queues', 'agents'],
  }),

  computed: {
    isActiveFormValid() {
      if (!this.tab) return false;

      const tabs = {
        sector: this.isSectorFormValid,
        queues: this.isQueuesFormValid,
        agents: this.isAgentsFormValid,
        tags: this.sector.tags.length > 0,
      };

      return tabs[this.tab];
    },
  },

  methods: {
    nextTab() {
      const tabs = {
        sector: () => {
          this.tab = 'queues';
        },
        queues: () => {
          this.tab = 'agents';
        },
        agents: () => {
          this.tab = 'tags';
        },
        tags: this.saveSector,
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
  display: flex;
  flex-direction: column;
  height: 100%;
  padding-bottom: 1rem;

  .scrollable {
    overflow-y: auto;
    padding-right: 1rem;
    margin-right: 0.5rem;
  }

  .actions {
    margin-top: auto;
    margin-right: 1.5rem;
    padding-top: 1.5rem;

    & > * {
      width: 100%;
    }
  }
}
</style>
