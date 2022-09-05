<template>
  <section class="edit-sector">
    <sector-tabs v-if="sector.uuid" v-model="tab" class="scrollable">
      <template #sector>
        <form-sector v-model="sector" is-editing />
      </template>

      <template #queues>
        <form-queue
          v-model="queue"
          :sector="sector"
          :queues="queues"
          label="Criar nova fila"
          is-editing
        />
        <form-agent v-if="false" v-model="agents" :sector="sector.name" :queues="sector.queues" />
      </template>

      <template #tags>
        <form-tags v-model="tags" />
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
import FormAgent from '@/components/settings/forms/Agent';
import FormSector from '@/components/settings/forms/Sector';
import FormQueue from '@/components/settings/forms/Queue';
import FormTags from '@/components/settings/forms/Tags';
import SectorTabs from '@/components/settings/SectorTabs';

import Sector from '@/services/api/resources/settings/sector';
import Queue from '@/services/api/resources/settings/queue';

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
    uuid: [String, Number],
  },

  async beforeMount() {
    this.getSector();
  },

  data: () => ({
    tab: '',
    sector: {
      uuid: '',
      name: '',
      workingDay: {
        start: '',
        end: '',
        dayOfWeek: 'week-days',
      },
      maxSimultaneousChatsByAgent: '',
    },
    queue: {
      name: '',
    },
    queues: [],
    agents: [],
    tags: [],
    isOpenSaveConfirmationModal: false,
  }),

  methods: {
    async getSector() {
      const { name, rooms_limit, uuid, work_end, work_start } = await Sector.find(this.uuid);
      this.sector = {
        uuid,
        name,
        workingDay: { start: work_start, end: work_end },
        maxSimultaneousChatsByAgent: rooms_limit.toString(),
      };
    },
    async getQueues() {
      const queues = await Queue.list(this.sector.uuid);
      this.queues = queues.results;
    },
    async getTags() {
      const tags = await Sector.tags(this.sector.uuid);
      this.tags = tags.results;
    },
    async save() {
      await this.$store.dispatch('settings/updateSector', this.sector);
      this.isOpenSaveConfirmationModal = true;
    },
    async handleTabChange(currentTab) {
      if (currentTab === 'sector') return;
      if (currentTab === 'queues' && this.queues.length === 0) await this.getQueues();
      if (currentTab === 'tags' && this.tags.length === 0) await this.getTags();
    },
  },

  watch: {
    tab(current) {
      this.handleTabChange(current);
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
