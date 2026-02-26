<template>
  <UnnnicDialog
    v-model:open="open"
    class="modal-start-discussion"
  >
    <UnnnicDialogContent size="large">
      <UnnnicDialogHeader :closeButton="!startDiscussionLoading">
        <UnnnicDialogTitle>
          {{ $t('discussions.start_discussion.title') }}
        </UnnnicDialogTitle>
      </UnnnicDialogHeader>
      <section
        class="start-discussion-form"
        data-testid="start-discussion-form"
      >
        <div class="start-discussion-form__selects">
          <div class="start-discussion-form__selects__input">
            <UnnnicLabel
              :label="$t('discussions.start_discussion.form.select_sector')"
            />
            <UnnnicSelectSmart
              v-model="sector"
              :options="sectorsToSelect"
              autocomplete
              autocompleteIconLeft
              autocompleteClearOnFocus
              data-testid="select-sector"
            />
          </div>
          <div class="start-discussion-form__selects__input">
            <UnnnicLabel
              :label="$t('discussions.start_discussion.form.select_queue')"
            />
            <UnnnicSelectSmart
              v-model="queue"
              :disabled="sector[0]?.value === '' || queuesToSelect.length < 2"
              :options="queuesToSelect"
              autocomplete
              autocompleteIconLeft
              autocompleteClearOnFocus
              data-testid="select-queue"
            />
          </div>
        </div>
        <UnnnicInput
          v-model="subject"
          size="md"
          :maxlength="50"
          :placeholder="
            $t('discussions.start_discussion.form.discussion_reason')
          "
          :label="$t('discussions.start_discussion.form.subject')"
          data-testid="input-subject"
        />

        <UnnnicTextArea
          v-model="message"
          :label="$t('message')"
          :placeholder="
            $t('discussions.start_discussion.form.explain_situation')
          "
          :maxLength="300"
          data-testid="input-explain-situation"
        />
      </section>
      <UnnnicDialogFooter>
        <UnnnicDialogClose>
          <UnnnicButton
            :text="$t('cancel')"
            type="tertiary"
            :disabled="startDiscussionLoading"
          />
        </UnnnicDialogClose>
        <UnnnicButton
          :text="$t('start')"
          type="primary"
          :disabled="isConfirmButtonDisabled"
          :loading="startDiscussionLoading"
          @click="startDiscussion()"
        />
      </UnnnicDialogFooter>
    </UnnnicDialogContent>
  </UnnnicDialog>
</template>

<script>
import { mapActions, mapState } from 'pinia';
import { useDiscussions } from '@/store/modules/chats/discussions';

import Discussion from '@/services/api/resources/chats/discussion';
import Queue from '@/services/api/resources/settings/queue';

import unnnic from '@weni/unnnic-system';

export default {
  name: 'ModalStartDiscussion',

  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
  },
  emits: ['close', 'update:modelValue'],

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

  computed: {
    ...mapState(useDiscussions, ['discussionsCount']),
    open: {
      get() {
        return this.modelValue;
      },
      set(value) {
        this.$emit('update:modelValue', value);
      },
    },
    isConfirmButtonDisabled() {
      return (
        !this.sector[0] ||
        !this.queue[0]?.value ||
        !this.subject ||
        !this.message
      );
    },
  },

  watch: {
    sector(sector) {
      if (sector[0].value) {
        if (this.queuesToSelect[0]) {
          this.queue = [this.queuesToSelect[0]];
        }
        this.getSectorQueues(sector[0].value);
      }
    },
  },

  async created() {
    await this.getSectors();
    this.queuesToSelect = [
      {
        value: '',
        label: this.$t('discussions.start_discussion.form.search_queue'),
      },
    ];
  },

  methods: {
    ...mapActions(useDiscussions, {
      createDiscussion: 'create',
      setDiscussionsCount: 'setDiscussionsCount',
    }),
    close() {
      this.$emit('close');
    },

    async startDiscussion() {
      this.startDiscussionLoading = true;
      const responseDiscussion = await this.createDiscussion({
        queue: this.queue[0].value || '',
        subject: this.subject,
        initial_message: this.message,
      });

      if (this.$route.path !== 'discussion' && responseDiscussion.uuid) {
        this.setDiscussionsCount(this.discussionsCount + 1);
        this.$router.push({
          name: 'discussion',
          params: { discussionId: responseDiscussion.uuid },
        });
      }

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

      unnnic.unnnicCallAlert({
        props: {
          text: errorText,
          type: 'error',
        },
      });
    },

    async getSectors() {
      try {
        const response = await Discussion.getSectors();
        const { results } = response;

        const newSectors = [
          {
            value: '',
            label: this.$t('discussions.start_discussion.form.search_sector'),
          },
        ];

        results.forEach(({ uuid, name }) =>
          newSectors.push({ value: uuid, label: name }),
        );

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

        const newQueues = [this.queuesToSelect[0]];
        results.forEach(({ uuid, name }) =>
          newQueues.push({ value: uuid, label: name }),
        );
        this.queuesToSelect = newQueues;

        if (results.length === 1 && newQueues?.[1]) {
          const uniqueQueue = [newQueues[1]];
          this.queue = uniqueQueue;
        }
      } catch (error) {
        console.error(
          'The sector tags could not be loaded at this time.',
          error,
        );
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.start-discussion-form {
  display: grid;
  gap: $unnnic-spacing-sm;

  text-align: start;
  padding: $unnnic-space-6;

  &__selects {
    display: flex;
    gap: $unnnic-spacing-xs;

    &__input {
      flex: 1;
    }
  }
}
</style>
