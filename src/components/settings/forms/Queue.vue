<template>
  <section class="queue-form">
    <section
      v-if="showHelpers"
      class="form-wrapper__radios"
    >
      <UnnnicRadio
        :modelValue="useDefaultSectorQueue"
        :value="0"
        data-testid="disable-default-queue-config"
        @update:model-value="updateDefaultSectorQueueValue"
      >
        {{ $t('config_chats.custom_queue') }}
      </UnnnicRadio>
      <UnnnicRadio
        :modelValue="useDefaultSectorQueue"
        :value="1"
        data-testid="enable-default-queue-config"
        @update:model-value="updateDefaultSectorQueueValue"
      >
        {{ $t('config_chats.default_queue.title') }}
      </UnnnicRadio>
    </section>
    <p
      v-if="showHelpers"
      class="forms__hint"
      data-testid="hint"
    >
      {{ $t('config_chats.queues.hint') }}
    </p>
    <h1
      v-if="showHelpers"
      class="forms__title"
    >
      {{ $t('config_chats.queues.queue_definitions') }}
    </h1>
    <section
      v-if="!loadingInfo"
      class="sector-queues-form"
    >
      <UnnnicInput
        v-if="!isEditing"
        v-model="queue.name"
        :label="$t('queues.queue_name')"
        :placeholder="$t('queues.queue_name_placeholder')"
        data-testid="queue-name-input"
        class="input"
      />
      <UnnnicChatText
        v-if="isEditing"
        class="sector-queues-form__automatic-message"
        titleColor="neutral-dark"
        size="small"
        :title="$t('automatic_message.title')"
        :info="$t('automatic_message.info')"
      >
        <template #actions>
          <UnnnicButton
            v-if="!editingAutomaticMessage"
            class="sector-queues-form__automatic-message-button"
            type="secondary"
            iconCenter="edit"
            data-testid="edit-automatic-message-button"
            size="small"
            @click="handlerEditAutomaticMessage()"
          />
        </template>
        <template #description>
          <UnnnicTextArea
            v-if="editingAutomaticMessage"
            ref="textEditor"
            v-model="queue.default_message"
            class="sector-queues-form__automatic-message-textarea"
            :maxLength="250"
            size="sm"
            :placeholder="$t('automatic_message.placeholder')"
            data-testid="automatic-message-textarea"
            @focus="focusTextEditor"
            @focusout="editingAutomaticMessage = false"
          />

          <p
            v-else
            data-testid="queue-default-message"
          >
            {{ queue.default_message || $t('automatic_message.placeholder') }}
          </p>
        </template>
      </UnnnicChatText>

      <section
        v-if="enableQueueLimitFeature"
        class="queue-form__limit-chats"
      >
        <p class="queue-form__limit-chats__title">
          {{ $t('config_chats.queues.limit_chats.title') }}
        </p>
        <section class="queue-form__limit-chats__inputs">
          <UnnnicSwitch
            v-model="queue.queue_limit.is_active"
            :textRight="$t('config_chats.queues.limit_chats.switch.label')"
            :helper="$t('config_chats.queues.limit_chats.switch.helper')"
          />
          <UnnnicInput
            v-if="queue.queue_limit.is_active"
            v-model="queue.queue_limit.limit"
            :label="$t('config_chats.queues.limit_chats.switch.input_label')"
            :placeholder="
              $t('config_chats.queues.limit_chats.switch.input_placeholder')
            "
          />
        </section>
      </section>

      <UnnnicDisclaimer
        v-if="enableGroupsMode"
        :description="
          isEditing
            ? $t('config_chats.queues.message.config_agents_group')
            : $t('config_chats.queues.message.add_new_queue')
        "
        :type="isEditing ? 'informational' : 'attention'"
      />

      <AgentsForm
        v-else
        v-model="queue.currentAgents"
        :sector="sector"
        :agents="agentsOptions"
        @remove="handlerRemoveAgent($event)"
        @select="handlerAddAgent($event)"
      />
    </section>
  </section>
</template>

<script>
import AgentsForm from './Agent.vue';

import Queue from '@/services/api/resources/settings/queue';
import Project from '@/services/api/resources/settings/project';
import { mapState } from 'pinia';
import { useProfile } from '@/store/modules/profile';
import { useConfig } from '@/store/modules/config';
import { useFeatureFlag } from '@/store/modules/featureFlag';

import { cloneDeep, isEqual } from 'lodash';

export default {
  name: 'FormQueue',
  components: { AgentsForm },
  props: {
    modelValue: {
      type: Object,
      required: true,
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
      toAddAgentsUuids: [],
      toRemoveAgentsUuids: [],
      agentsLimitPerPage: 50,

      initialState: null,
    };
  },

  computed: {
    ...mapState(useFeatureFlag, ['featureFlags']),
    ...mapState(useProfile, ['me']),
    ...mapState(useConfig, ['enableGroupsMode']),
    isEditing() {
      return !!this.queue.uuid;
    },
    queue: {
      get() {
        return this.modelValue;
      },
      set(value) {
        this.$emit('update:modelValue', value);
      },
    },
    isInitialFormState() {
      const { initialState } = this;

      if (!initialState) return true;

      return isEqual(
        {
          automaticMessage: this.queue.default_message,
          currentAgents: this.queue.currentAgents,
        },
        initialState,
      );
    },
    validForm() {
      const valid = this.enableGroupsMode
        ? !!this.queue.name?.trim()
        : !!this.queue.name?.trim() && !!this.queue.currentAgents?.length;

      return valid && !this.isInitialFormState;
    },
    enableQueueLimitFeature() {
      return this.featureFlags.active_features?.includes('weniChatsQueueLimit');
    },
  },

  watch: {
    validForm: {
      handler() {
        this.$emit('changeIsValid', this.validForm);
      },
    },
    'queue.queue_limit.is_active': {
      deep: true,
      handler(value) {
        if (!value) {
          this.queue.queue_limit.limit = null;
        }
      },
    },
    queue: {
      deep: true,
      immediate: true,
      handler(value) {
        const valid = this.enableGroupsMode
          ? !!value.name?.trim()
          : !!value.name?.trim() && !!value.currentAgents?.length;

        this.$emit('changeIsValid', valid);
      },
    },
  },

  async mounted() {
    this.loadingInfo = true;

    if (this.isEditing) {
      this.queue = {
        ...(await Queue.getQueueInformation(this.queue.uuid)),
        queue_limit: {
          ...this.queue.queue_limit,
        },
        agents: this.queue.agents,
      };

      if (!this.enableGroupsMode) await this.listQueueAgents();
    } else {
      this.queue = {
        ...this.queue,
        default_message: '',
        currentAgents: [],
        queue_limit: { is_active: false, limit: null },
      };
    }

    if (!this.enableGroupsMode) this.listProjectAgents();

    this.loadingInfo = false;

    this.initialState = cloneDeep({
      automaticMessage: this.queue.default_message,
      currentAgents: this.queue.currentAgents,
    });
  },
  methods: {
    updateDefaultSectorQueueValue(activate) {
      this.useDefaultSectorQueue = activate;
      if (activate) {
        const meAgent = this.agentsOptions.find(
          (agent) => agent.user.email === this.me.email,
        );
        this.queue = {
          ...this.queue,
          name: this.$t('config_chats.default_queue.name'),
          currentAgents: this.enableGroupsMode ? [] : [meAgent],
        };
      } else {
        this.queue = {
          ...this.queue,
          name: '',
          currentAgents: [],
        };
      }
    },
    handlerEditAutomaticMessage() {
      this.editingAutomaticMessage = true;
      this.focusTextEditor();
    },
    focusTextEditor() {
      this.$nextTick(() => {
        this.$refs.textEditor?.focus();
      });
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
      const response = await Queue.agents(this.queue.uuid, 0, 9999);
      this.queue.currentAgents = response.results;
    },
    async handlerRemoveAgent(agentUuid) {
      if (this.isEditing) {
        this.toRemoveAgentsUuids.push(agentUuid);
        this.toRemoveAgentsUuids = [...new Set(this.toRemoveAgentsUuids)];
      }

      this.queue.currentAgents = this.queue.currentAgents.filter(
        (agent) => agent.uuid !== agentUuid,
      );

      this.queue.agents--;
      this.$emit('update-queue-agents-count', this.queue);
    },

    async handlerAddAgent(agent) {
      const { currentAgents } = this.queue;

      const alreadyInQueue = currentAgents.some(
        (a) => a.uuid === agent.uuid || a.user.email === agent.user.email,
      );

      if (!alreadyInQueue & this.isEditing) {
        this.toAddAgentsUuids.push(agent.uuid);
        this.toAddAgentsUuids = [...new Set(this.toAddAgentsUuids)];

        this.queue.currentAgents.push({
          ...agent,
        });
        this.queue.agents++;
        this.$emit('update-queue-agents-count', this.queue);
      } else {
        if (!alreadyInQueue) {
          this.queue.currentAgents.push(agent);
          this.queue.agents++;
        }
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.queue-form {
  display: grid;
  gap: $unnnic-spacing-sm;

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

  .form-wrapper {
    &__radios {
      display: flex;
      gap: $unnnic-space-4;
    }
  }
}
.forms {
  &__title {
    font-weight: $unnnic-font-weight-bold;
    color: $unnnic-color-neutral-dark;
    font-size: $unnnic-font-size-body-lg;
    line-height: $unnnic-line-height-large * 1.5;
  }

  &__hint {
    font-size: $unnnic-font-size-body-gt;
    line-height: $unnnic-font-size-body-gt + $unnnic-line-height-md;
  }
}
.sector-queues-form {
  display: grid;
  gap: $unnnic-spacing-sm;

  &__automatic-message {
    max-width: 100% !important;
    max-height: 100% !important;

    &-button {
      :deep(.unnnic-icon-size--sm) {
        font-size: $unnnic-font-size-title-sm;
      }
    }
    &-textarea {
      word-break: break-all;
    }
  }

  :deep(.unnnic-form__label) {
    margin-top: 0;
  }
}
</style>
