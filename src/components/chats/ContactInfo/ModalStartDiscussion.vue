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
        :loading="startDiscussionLoading"
      />
    </template>
  </unnnic-modal>
</template>

<script>
import Sector from '@/services/api/resources/settings/sector';
import Queue from '@/services/api/resources/settings/queue';

import { unnnicCallAlert } from '@weni/unnnic-system';

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

      startDiscussionLoading: false,
    };
  },

  async created() {
    await this.getSectors();
    this.queuesToSelect = [
      { value: '', label: this.$t('discussions.start_discussion.form.search_queue') },
    ];
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
      this.startDiscussionLoading = true;
      const responseDiscussion = await this.$store.dispatch('chats/discussions/create', {
        queue: this.queue[0].value || '',
        subject: this.subject,
        initial_message: this.message,
      });

      this.close();

      if (!responseDiscussion.status) {
        return;
      }

      let errorText = '';

      switch (responseDiscussion.status) {
        case 409:
          errorText = this.$t('discussions.errors.already_open');
          break;
        case 403:
          errorText = this.$t('discussions.errors.permission');
          break;
        default:
          errorText = this.$t('discussions.errors.generic');
          break;
      }

      unnnicCallAlert({
        props: {
          text: errorText,
          type: 'error',
        },
      });
    },

    async getSectors() {
      try {
        const response = await Sector.list();
        const { results } = response;

        const newSectors = [
          { value: '', label: this.$t('discussions.start_discussion.form.search_sector') },
        ];
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

        const newQueues = this.queuesToSelect;
        results.forEach(({ uuid, name }) => newQueues.push({ value: uuid, label: name }));
        this.queuesToSelect = newQueues;

        if (results.length === 1 && newQueues?.[1]) {
          const uniqueQueue = [newQueues[1]];
          this.queue = uniqueQueue;
        }
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
  :deep(.unnnic-label__label),
  :deep(.unnnic-form__label) {
    margin: 0 0 $unnnic-spacing-nano;
  }

  :deep(.unnnic-modal-container) {
    .unnnic-modal-container-background {
      width: 50%; // -> 6 / 12

      &-body-description-container {
        padding-bottom: 0;
      }
    }
  }
}
</style>
