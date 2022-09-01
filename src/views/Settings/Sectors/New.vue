<template>
  <section class="new-sector">
    <section class="scrollable">
      <div class="new-sector__indicator">
        <unnnic-indicator :current-step="step" :number-of-steps="3" :titles="stepsTitles" />
      </div>
      <div class="new-sector__divider" />

      <section class="new-sector__form">
        <form-sector
          v-show="step === Steps.General"
          v-model="sector"
          @validate="isSectorFormValid = $event"
        />

        <form-queue
          v-show="step === Steps.Queues"
          v-model="sector.queues"
          label="Adicionar nova Fila"
          show-info-icon
          :sector="sector"
          @validate="isQueuesFormValid = $event"
        />
        <form-agent
          v-show="step === Steps.Queues"
          v-model="sector.agents"
          :queues="sector.queues"
          :sector="sector.name"
          @validate="isAgentsFormValid = $event"
        />
        <form-tags v-show="step === Steps.Tags" v-model="sector.tags" />
      </section>
    </section>

    <div class="actions">
      <unnnic-button
        v-if="step !== Steps.Tags"
        text="Salvar e continuar"
        iconRight="arrow-right-1-1"
        type="secondary"
        :disabled="!isActiveFormValid"
        @click="nextStep"
      />
      <unnnic-button
        v-else
        :disabled="!isActiveFormValid"
        type="secondary"
        text="Salvar"
        @click="saveSector"
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
import FormTags from '@/components/settings/forms/Tags';

const Steps = Object.freeze({
  General: 1,
  Queues: 2,
  Tags: 3,
});

export default {
  name: 'NewSector',

  components: {
    FormAgent,
    FormQueue,
    FormSector,
    FormTags,
  },

  data: () => ({
    sector: {
      name: '',
      manager: '',
      workingDay: {
        start: '',
        end: '',
        dayOfWeek: 'week-days',
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
    Steps,
    step: Steps.General,
    tabs: [Steps.General, Steps.Queues, Steps.Agents],
    stepsTitles: ['Geral', 'Filas', 'Tags'],
  }),

  computed: {
    isActiveFormValid() {
      if (!this.step) return false;

      const steps = {
        [Steps.General]: this.isSectorFormValid,
        [Steps.Queues]: this.isQueuesFormValid && this.isAgentsFormValid,
        [Steps.Tags]: this.sector.tags.length > 0,
      };

      return steps[this.step];
    },
  },

  methods: {
    nextStep() {
      const steps = {
        [Steps.General]: () => {
          this.step = Steps.Queues;
        },
        [Steps.Queues]: () => {
          this.step = Steps.Tags;
        },
        [Steps.Tags]: this.saveSector,
      };

      steps[this.step]?.();
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
  margin-right: 1.5rem;
  padding-bottom: 1rem;

  .scrollable {
    overflow-y: auto;
    height: 100%;
    padding-right: 1rem;
    margin-right: 0.5rem;
  }

  &__indicator {
    padding: 0 calc(2 * $unnnic-spacing-inset-nano);
  }

  &__divider {
    border-top: solid 1px $unnnic-color-neutral-soft;
    margin-top: calc(2 * $unnnic-spacing-inline-md);
  }

  &__form {
    margin-top: $unnnic-spacing-inline-md;
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
