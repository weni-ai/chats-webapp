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

    <UnnnicTextArea
      v-model="queueForm.queue_purpose"
      :label="$t('queues.queue_purpose.field.label')"
      :placeholder="$t('queues.queue_purpose.field.placeholder')"
      :message="$t('queues.queue_purpose.field.helper')"
      :maxLength="1000"
    />

    <section class="sector-queues-form__limit-chats">
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

    <section
      v-if="enableQueueFlowsFeature"
      class="sector-queues-form__bond-flows"
      data-testid="queue-bond-flows"
    >
      <UnnnicSwitch
        :modelValue="bondFlowsSwitchValue"
        :textRight="$t('config_chats.queues.bond_flows_queue.switch.label')"
        :helper="$t('config_chats.queues.bond_flows_queue.switch.helper')"
        @update:model-value="handleBondFlowsToggle"
      />
      <SelectQueueFlows
        v-if="queueForm.bond_flows_queue"
        v-model="queueForm.selected_flows"
      />
    </section>

    <DisableBondFlowsModal
      v-model="showDisableBondFlowsModal"
      @confirm="confirmDisableBondFlows"
    />

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
      :canLoadMore="canLoadMoreCurrentAgents"
      @load-more="$emit('load-more-current-agents')"
      @remove="handlerRemoveAgent($event)"
      @select="handlerAddAgent($event)"
    />
  </section>
</template>

<script>
import { mapState } from 'pinia';

import AgentsForm from '../Agent.vue';
import SelectQueueFlows from './SelectQueueFlows.vue';
import DisableBondFlowsModal from './DisableBondFlowsModal.vue';

import { useProfile } from '@/store/modules/profile';
import { useConfig } from '@/store/modules/config';
import { useFeatureFlag } from '@/store/modules/featureFlag';

export default {
  name: 'QueueInputsForm',
  components: {
    AgentsForm,
    SelectQueueFlows,
    DisableBondFlowsModal,
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
    canLoadMoreCurrentAgents: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:modelValue', 'load-more-current-agents'],
  data() {
    return {
      editingAutomaticMessage: false,
      showDisableBondFlowsModal: false,
      bondFlowsSwitchValue: false,
    };
  },
  computed: {
    ...mapState(useProfile, ['me']),
    ...mapState(useConfig, ['enableGroupsMode']),
    ...mapState(useFeatureFlag, ['featureFlags']),
    isEditing() {
      return !!this.queueForm.uuid;
    },
    enableQueueFlowsFeature() {
      return this.featureFlags.active_features?.includes(
        'weniChatsFilterFlowsByQueue',
      );
    },
    queueForm: {
      get() {
        return this.modelValue;
      },
      set(value) {
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
    'queueForm.bond_flows_queue': {
      immediate: true,
      handler(value) {
        this.bondFlowsSwitchValue = value;
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

        const validQueueLimit = this.queueForm.queue_limit.is_active
          ? validQueueLimitValue
          : true;

        const allValid = validQueue && validQueueLimit;

        this.queueForm.validForm = allValid;
      },
    },
  },
  methods: {
    handleBondFlowsToggle(value) {
      if (!value && this.queueForm.selected_flows?.length > 0) {
        this.showDisableBondFlowsModal = true;
        this.bondFlowsSwitchValue = false;
        this.$nextTick(() => {
          this.bondFlowsSwitchValue = true;
        });
        return;
      }

      this.queueForm.bond_flows_queue = value;
      this.bondFlowsSwitchValue = value;
      if (!value) {
        this.queueForm.selected_flows = [];
      }
    },

    confirmDisableBondFlows() {
      this.queueForm.bond_flows_queue = false;
      this.bondFlowsSwitchValue = false;
      this.queueForm.selected_flows = [];
      this.showDisableBondFlowsModal = false;
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
  gap: $unnnic-space-4;

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

  &__bond-flows {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-2;
  }
}
</style>
