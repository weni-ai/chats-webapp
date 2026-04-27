<template>
  <section class="queue-form">
    <FillDefaultOption
      v-if="showHelpers"
      :modelValue="useDefaultSectorQueue"
      :customizedOptionText="$t('config_chats.custom_queue')"
      :defaultOptionText="$t('config_chats.default_queue.title')"
      @update:model-value="updateDefaultSectorQueueValue"
    />
    <section
      v-if="showHelpers"
      class="queue-form__configure-queue-title"
    >
      <h1 class="queue-form__title">
        {{ $t('config_chats.queues.configure_queue.title') }}
      </h1>
      <UnnnicToolTip
        enabled
        :text="$t('config_chats.queues.configure_queue.tooltip')"
      >
        <UnnnicIcon
          icon="ri:question-line"
          scheme="fg-base"
          size="sm"
        />
      </UnnnicToolTip>
    </section>
    <template v-if="!loadingInfo">
      <section
        v-for="(queue, index) in queues"
        :key="index"
        class="queue-form__queue-container"
      >
        <section
          v-if="index > 0"
          class="queue-form__new-queue__header"
        >
          <h2 class="queue-form__new-queue__title">
            {{ $t('config_chats.queues.new') }}
          </h2>
          <UnnnicToolTip
            enabled
            :text="$t('config_chats.queues.remove_tooltip')"
          >
            <UnnnicIcon
              icon="delete"
              scheme="fg-critical"
              clickable
              size="ant"
              @click="removeQueue(index)"
            />
          </UnnnicToolTip>
        </section>
        <section class="queue-form__form">
          <QueueInputsForm
            :key="index"
            :modelValue="queue"
            :agentsOptions="agentsOptions"
            @update:model-value="queues[index] = $event"
          />
          <hr
            v-if="multiple"
            class="divider"
          />
        </section>
      </section>
      <UnnnicButton
        v-if="multiple"
        :text="$t('config_chats.queues.add_queue')"
        iconLeft="add"
        type="secondary"
        @click="addQueue()"
      />
    </template>
  </section>
</template>

<script>
import { mapState } from 'pinia';

import Queue from '@/services/api/resources/settings/queue';
import Project from '@/services/api/resources/settings/project';

import QueueInputsForm from './QueueInputsForm.vue';
import FillDefaultOption from '../FillDefaultOption.vue';

import { useProfile } from '@/store/modules/profile';
import { useConfig } from '@/store/modules/config';
import { useFeatureFlag } from '@/store/modules/featureFlag';

import { cloneDeep } from 'lodash';

export default {
  name: 'FormQueue',
  components: { QueueInputsForm, FillDefaultOption },
  props: {
    modelValue: {
      type: Array,
      required: true,
    },
    multiple: {
      type: Boolean,
      default: false,
    },
    sector: { type: Object, required: true },
    showHelpers: {
      type: Boolean,
      default: false,
    },
  },

  emits: ['update:modelValue', 'update-queue-agents-count', 'changeIsValid'],

  data() {
    return {
      agentsPage: 0,
      editingAutomaticMessage: false,
      loadingInfo: false,
      agentsOptions: [],
      useDefaultSectorQueue: 0,
      agentsLimitPerPage: 50,
      formTemplate: {
        name: '',
        default_message: '',
        queue_limit: { is_active: false, limit: null },
        currentAgents: [],
        agents: 0,
        toAddAgentsUuids: [],
        toRemoveAgentsUuids: [],
        validForm: false,
      },
    };
  },

  computed: {
    ...mapState(useFeatureFlag, ['featureFlags']),
    ...mapState(useProfile, ['me']),
    ...mapState(useConfig, ['enableGroupsMode']),
    isEditing() {
      return !!this.queues?.[0]?.uuid && !this.multiple;
    },
    queues: {
      get() {
        return this.modelValue;
      },
      set(value) {
        this.$emit('update:modelValue', value);
      },
    },
  },

  watch: {
    queues: {
      deep: true,
      immediate: true,
      handler() {
        const validForms = this.queues.every((queue) => queue.validForm);
        this.$emit('changeIsValid', validForms);
      },
    },
  },

  async mounted() {
    this.loadingInfo = true;

    if (this.isEditing) {
      this.queues = [
        {
          ...this.formTemplate,
          ...(await Queue.getQueueInformation(this.queues[0].uuid)),
          queue_limit: {
            ...this.queues[0].queue_limit,
          },
          agents: this.queues[0].agents,
        },
      ];

      if (!this.enableGroupsMode) await this.listQueueAgents();
    } else {
      this.queues = [
        {
          ...this.queues?.[0],
          ...this.formTemplate,
        },
      ];
    }

    if (!this.enableGroupsMode) this.listProjectAgents();

    this.loadingInfo = false;
  },
  methods: {
    addQueue() {
      this.queues.push(cloneDeep(this.formTemplate));
    },
    removeQueue(index) {
      this.queues.splice(index, 1);
    },
    updateDefaultSectorQueueValue(activate) {
      this.useDefaultSectorQueue = activate;
      if (activate) {
        const meAgent = this.agentsOptions.find(
          (agent) => agent.user.email === this.me.email,
        );
        this.queues[0] = {
          ...this.queues[0],
          name: this.$t('config_chats.default_queue.name'),
          currentAgents: this.enableGroupsMode ? [] : [meAgent],
        };
      } else {
        this.queues[0] = {
          ...this.queues[0],
          name: '',
          currentAgents: [],
        };
      }
    },
    async listProjectAgents() {
      let hasNext = false;
      try {
        const offset = this.agentsPage * this.agentsLimitPerPage;
        const { results, next } = await Project.agents(
          offset,
          this.agentsLimitPerPage,
        );
        this.agentsPage += 1;
        this.agentsOptions = this.agentsOptions.concat(results);

        hasNext = next;
      } finally {
        if (hasNext) {
          this.listProjectAgents();
        }
      }
    },
    async listQueueAgents() {
      const response = await Queue.agents(this.queues[0].uuid, 0, 9999);
      this.queues[0].currentAgents = response.results;
    },
  },
};
</script>

<style lang="scss" scoped>
.queue-form {
  display: grid;
  gap: $unnnic-space-4;
  margin-bottom: $unnnic-space-4;

  &__queue-container {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-4;
  }

  &__new-queue {
    &__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: $unnnic-space-1;
    }
    &__title {
      font: $unnnic-font-display-3;
      color: $unnnic-color-fg-emphasized;
    }
  }

  &__configure-queue-title {
    display: flex;
    align-items: center;
    gap: $unnnic-space-1;
  }

  &__title {
    font: $unnnic-font-display-3;
    color: $unnnic-color-fg-emphasized;
  }

  &__limit-chats {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-3;

    &__title {
      font: $unnnic-font-display-3;
      color: $unnnic-color-fg-emphasized;
    }

    &__inputs {
      display: flex;
      flex-direction: column;
      gap: $unnnic-space-2;
    }
  }

  .divider {
    margin-top: $unnnic-space-4;
    border: 1px solid $unnnic-color-border-base;
  }
}
</style>
