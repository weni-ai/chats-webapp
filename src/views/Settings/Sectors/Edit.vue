<template>
  <section class="edit-sector">
    <sector-tabs v-if="sector" v-model="tab" class="scrollable">
      <template #sector>
        <form-sector v-model="sector" />
      </template>

      <template #queues>
        <form-queue v-model="queues" :sector="sector" label="Criar nova fila" />
        <form-agent v-if="false" v-model="agents" :sector="sector.name" :queues="sector.queues" />
      </template>

      <template #tags>
        <form-tags v-model="sector.tags" />
      </template>
    </sector-tabs>

    <section class="actions">
      <unnnic-button text="Salvar" type="secondary" @click="save" />
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
import FormTags from '@/components/settings/forms/Tags';
import SectorTabs from '@/components/settings/SectorTabs';

export default {
  name: 'EditSector',

  components: {
    FormAgent,
    FormQueue,
    FormSector,
    FormTags,
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
    display: flex;
    gap: 1rem;
    margin-top: auto;
    margin-right: 1.5rem;
    padding-top: 1.5rem;

    & > * {
      width: 100%;
    }
  }
}
</style>
