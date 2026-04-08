<template>
  <section class="sector-queues-form">
    <UnnnicInput
      v-if="!isEditing"
      v-model="queueForm.name"
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
          v-model="queueForm.default_message"
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
          {{ queueForm.default_message || $t('automatic_message.placeholder') }}
        </p>
      </template>
    </UnnnicChatText>

    <section
      v-if="enableQueueLimitFeature"
      class="sector-queues-form__limit-chats"
    >
      <p class="sector-queues-form__limit-chats__title">
        {{ $t('config_chats.queues.limit_chats.title') }}
      </p>
      <section class="sector-queues-form__limit-chats__inputs">
        <UnnnicSwitch
          v-model="queueForm.queue_limit.is_active"
          :textRight="$t('config_chats.queues.limit_chats.switch.label')"
          :helper="$t('config_chats.queues.limit_chats.switch.helper')"
        />
        <UnnnicInput
          v-if="queueForm.queue_limit.is_active"
          v-model="queueForm.queue_limit.limit"
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
      :modelValue="queueForm.currentAgents"
      :agents="agentsOptions"
      @remove="handlerRemoveAgent($event)"
      @select="handlerAddAgent($event)"
    />
  </section>
</template>

<script>
import { mapState } from 'pinia';
import AgentsForm from '../Agent.vue';

import { useFeatureFlag } from '@/store/modules/featureFlag';
import { useProfile } from '@/store/modules/profile';
import { useConfig } from '@/store/modules/config';

export default {
  name: 'QueueInputsForm',
  components: {
    AgentsForm,
  },
  props: {
    modelValue: {
      type: Object,
      required: true,
    },
    agentsOptions: {
      type: Array,
      required: true,
    },
  },
  emits: ['update:modelValue'],
  data() {
    return {
      test: [],
      editingAutomaticMessage: false,
    };
  },
  computed: {
    ...mapState(useFeatureFlag, ['featureFlags']),
    ...mapState(useProfile, ['me']),
    ...mapState(useConfig, ['enableGroupsMode']),
    isEditing() {
      return !!this.queueForm.uuid;
    },
    enableQueueLimitFeature() {
      return this.featureFlags.active_features?.includes('weniChatsQueueLimit');
    },
    queueForm: {
      get() {
        return this.modelValue;
      },
      set(value) {
        console.log('value', value);
        this.$emit('update:modelValue', value);
      },
    },
  },
  watch: {
    'queueForm.queue_limit.is_active': {
      handler(value) {
        if (!value) {
          this.queueForm.queue_limit.limit = null;
        }
      },
    },
    queueForm: {
      deep: true,
      immediate: true,
      handler(value) {
        const validQueue = this.enableGroupsMode
          ? !!value.name?.trim()
          : !!value.name?.trim() && !!value.currentAgents?.length;

        const validQueueLimitValue =
          !!this.queueForm.queue_limit.limit &&
          !isNaN(this.queueForm.queue_limit.limit);

        const validQueueLimit =
          this.enableQueueLimitFeature && this.queueForm.queue_limit.is_active
            ? validQueueLimitValue
            : true;

        const allValid = validQueue && validQueueLimit;

        this.queueForm.validForm = allValid;
      },
    },
  },
  methods: {
    handlerEditAutomaticMessage() {
      this.editingAutomaticMessage = true;
      this.focusTextEditor();
    },
    focusTextEditor() {
      this.$nextTick(() => {
        this.$refs.textEditor?.focus();
      });
    },
    async handlerRemoveAgent(agentUuid) {
      if (this.isEditing) {
        this.queueForm.toRemoveAgentsUuids.push(agentUuid);

        this.queueForm.toRemoveAgentsUuids = [
          ...new Set(this.queueForm.toRemoveAgentsUuids),
        ];
      }

      this.queueForm.currentAgents = this.queueForm.currentAgents.filter(
        (agent) => agent.uuid !== agentUuid,
      );
    },

    async handlerAddAgent(agent) {
      const { currentAgents } = this.queueForm;

      const alreadyInQueue = currentAgents.some(
        (a) => a.uuid === agent.uuid || a.user.email === agent.user.email,
      );

      if (!alreadyInQueue & this.isEditing) {
        this.queueForm.toAddAgentsUuids.push(agent.uuid);
        this.queueForm.toAddAgentsUuids = [
          ...new Set(this.queueForm.toAddAgentsUuids),
        ];

        this.queueForm.currentAgents.push({
          ...agent,
        });
      } else {
        if (!alreadyInQueue) {
          this.queueForm.currentAgents.push(agent);
        }
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.sector-queues-form {
  display: grid;
  gap: $unnnic-spacing-sm;

  &__divider {
    border: 1px solid $unnnic-color-border-base;
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
