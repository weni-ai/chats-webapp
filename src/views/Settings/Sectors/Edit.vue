<template>
  <section class="edit-sector">
    <sector-tabs v-if="sector" v-model="tab">
      <template #sector>
        <form-sector v-model="sector" />
      </template>

      <template #queues>
        <form-queue v-model="queues" :sector="sector.name" />
      </template>

      <template #agents>
        <form-agent v-model="agents" :sector="sector.name" :queues="sector.queues" />
      </template>
    </sector-tabs>

    <section class="actions">
      <unnnic-button text="Voltar" type="secondary" @click="$router.back()" />
      <unnnic-button text="Salvar edições" iconRight="check-circle-1-1" @click="save" />
    </section>

    <unnnic-modal
      :showModal="isOpenSaveConfirmationModal"
      text="Atualizações salvas"
      modal-icon="check-circle-1-1"
      scheme="feedback-green"
      @close="$router.back()"
    >
      <template #options>
        <unnnic-button text="Fechar" @click="$router.back()" />
      </template>
    </unnnic-modal>
  </section>
</template>

<script>
import cloneDeep from 'lodash.clonedeep';

import FormAgent from '@/components/settings/forms/Agent';
import FormSector from '@/components/settings/forms/Sector';
import FormQueue from '@/components/settings/forms/Queue';
import SectorTabs from '@/components/settings/SectorTabs';

export default {
  name: 'EditSector',

  components: {
    FormAgent,
    FormQueue,
    FormSector,
    SectorTabs,
  },

  props: {
    id: [String, Number],
  },

  created() {
    this.sector = this.$store.getters['settings/getSectorById'](Number(this.id));
    this.queues = cloneDeep(this.sector.queues);
    this.agents = cloneDeep(this.sector.agents);
  },

  data: () => ({
    tab: '',
    sector: null,
    queues: [],
    agents: [],
    isOpenSaveConfirmationModal: false,
  }),

  methods: {
    async save() {
      await this.$store.dispatch('settings/updateSector', this.sector);
      this.isOpenSaveConfirmationModal = true;
    },
  },
};
</script>

<style lang="scss" scoped>
.edit-sector {
  .actions {
    display: flex;
    align-items: center;
    gap: 1rem;

    margin-top: 1.5rem;

    & > * {
      flex: 1 1;
    }
  }
}
</style>
