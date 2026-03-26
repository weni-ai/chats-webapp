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
            <UnnnicSelect
              v-model="sector"
              data-testid="select-sector"
              :options="sectorsToSelect"
              :label="$t('discussions.start_discussion.form.select_sector')"
              :placeholder="
                $t('discussions.start_discussion.form.search_sector')
              "
              returnObject
              clearable
              enableSearch
              :search="searchSector"
              @update:search="searchSector = $event"
            />
          </div>
          <div class="start-discussion-form__selects__input">
            <UnnnicSelect
              v-model="queue"
              data-testid="select-queue"
              :disabled="!sector?.value || queuesToSelect.length === 0"
              :options="queuesToSelect"
              :label="$t('discussions.start_discussion.form.select_queue')"
              :placeholder="
                $t('discussions.start_discussion.form.search_queue')
              "
              returnObject
              clearable
              enableSearch
              :search="searchQueue"
              @update:search="searchQueue = $event"
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
      sector: null,
      queue: null,

      sectorsToSelect: [],
      queuesToSelect: [],

      searchSector: '',
      searchQueue: '',

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
        !this.sector?.value ||
        !this.queue?.value ||
        !this.subject ||
        !this.message
      );
    },
  },

  watch: {
    sector: {
      handler(newSector) {
        this.queue = null;
        this.searchQueue = '';
        if (newSector?.value) {
          this.getSectorQueues(newSector.value);
        } else {
          this.queuesToSelect = [];
        }
      },
    },
  },

  async created() {
    await this.getSectors();
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
        queue: this.queue?.value || '',
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

        const newSectors = [];
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

        const newQueues = [];
        results.forEach(({ uuid, name }) =>
          newQueues.push({ value: uuid, label: name }),
        );
        this.queuesToSelect = newQueues;

        if (results.length === 1 && newQueues[0]) {
          this.queue = newQueues[0];
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
