<template>
  <unnnic-modal
    v-if="showModal"
    @close="close"
    class="start-discussion-form__modal"
    :text="$t('discussions.start_discussion.title')"
  >
    <section class="start-discussion-form">
      <div class="start-discussion-form__selects">
        <div class="start-discussion-form__selects__input">
          <unnnic-label :label="$t('discussions.start_discussion.form.select_sector')" />
          <unnnic-select-smart
            v-model="sector"
            :options="sectorsToSelect"
            autocomplete
            autocompleteIconLeft
          />
        </div>
        <div class="start-discussion-form__selects__input">
          <unnnic-label :label="$t('discussions.start_discussion.form.select_queue')" />
          <unnnic-select-smart
            v-model="queue"
            :disabled="sector[0]?.value === '' || queuesToSelect.length < 2"
            :options="queuesToSelect"
            autocomplete
            autocompleteIconLeft
          />
        </div>
      </div>
      <unnnic-input
        v-model="subject"
        size="md"
        :maxlength="50"
        :placeholder="$t('discussions.start_discussion.form.discussion_reason')"
        :label="$t('discussions.start_discussion.form.subject')"
      />

      <unnnic-text-area
        v-model="message"
        :label="$t('message')"
        :placeholder="$t('discussions.start_discussion.form.explain_situation')"
        :maxLength="300"
      />
    </section>
    <template #options>
      <unnnic-button :text="$t('cancel')" type="secondary" @click="close" />
      <unnnic-button
        :text="$t('confirm')"
        type="primary"
        @click="startDiscussion"
        :disabled="isConfirmButtonDisabled"
      />
    </template>
  </unnnic-modal>
</template>

<script>
import Sector from '@/services/api/resources/settings/sector';
import Queue from '@/services/api/resources/settings/queue';

export default {
  name: 'ModalStartDiscussion',

  props: {
    showModal: {
      type: Boolean,
      required: true,
    },
  },

  data: () => {
    return {
      subject: '',
      message: '',
      sector: [],
      queue: [],

      sectorsToSelect: [],
      queuesToSelect: [],
    };
  },

  async created() {
    await this.getSectors();
    this.queuesToSelect = [{ value: '', label: this.$t('queue') }];
  },

  computed: {
    isConfirmButtonDisabled() {
      return !this.sector[0] || !this.queue[0] || !this.subject || !this.message;
    },
  },

  methods: {
    close() {
      this.$emit('close');
    },

    async startDiscussion() {
      this.close();
    },

    async getSectors() {
      try {
        const response = await Sector.list();
        const { results } = response;

        const newSectors = [{ value: '', label: this.$t('sector.title') }];
        results.forEach(({ uuid, name }) => newSectors.push({ value: uuid, label: name }));
        this.sectorsToSelect = newSectors;
      } catch (error) {
        console.error('The sectors could not be loaded at this time.', error);
      }
    },

    async getSectorQueues(sectorUuid) {
      if (!sectorUuid) {
        this.queuesToSelect = [];
        return;
      }
      try {
        const response = await Queue.list(sectorUuid);
        const { results } = response;
        console.log(response);

        const newQueues = this.queuesToSelect;
        results.forEach(({ uuid, name }) => newQueues.push({ value: uuid, label: name }));
        this.queuesToSelect = newQueues;
      } catch (error) {
        console.error('The sector tags could not be loaded at this time.', error);
      }
    },
  },

  watch: {
    sector(sector) {
      if (sector[0].value) {
        this.getSectorQueues(sector[0].value);
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.start-discussion-form__modal {
  .start-discussion-form {
    display: grid;
    gap: $unnnic-spacing-sm;

    text-align: start;

    &__selects {
      display: flex;
      gap: $unnnic-spacing-xs;

      &__input {
        flex: 1;
      }
    }
  }
  :deep(.unnnic-modal-container-background) {
    width: 66%; // -> 8 / 12
  }
}
</style>
