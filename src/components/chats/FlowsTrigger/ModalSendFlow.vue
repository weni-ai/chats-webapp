<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <UnnnicDialog
    v-model:open="isOpen"
    class="modal-send-flow"
    data-testid="modal-send-flow"
  >
    <UnnnicDialogContent>
      <UnnnicDialogHeader>
        <UnnnicDialogTitle>
          {{ $t('flows_trigger.send') }}
        </UnnnicDialogTitle>
      </UnnnicDialogHeader>
      <section class="modal-send-flow__content">
        <SelectFlow
          v-model="selectedFlow"
          data-testid="select-flow"
          :isDisabled="isCheckingTemplate"
        />
      </section>
      <UnnnicDialogFooter>
        <SendFlowButton
          ref="sendFlowButton"
          class="modal-send-flow__handler"
          :contacts="contacts"
          :selectedFlow="selectedFlow"
          :isProjectPrincipal="isProjectPrincipal"
          :isCheckingTemplate="isCheckingTemplate"
          :cachedTemplate="cachedTemplate"
          data-testid="send-flow-button"
          @send-flow-finished="finishSendFlow"
        />
      </UnnnicDialogFooter>
    </UnnnicDialogContent>
  </UnnnicDialog>
  <Teleport to=".chats-webapp">
    <ModalVariableMapping
      v-if="showVariableModal && cachedTemplate"
      :templates="cachedTemplate.templates"
      :totalTemplateQty="cachedTemplate.total_template_qty"
      :localVariables="localVariables"
      :isLoading="isSendingFlow"
      data-testid="modal-send-flow-variable-mapping"
      @close="onCancelVariableMapping"
      @confirm="onConfirmVariableMapping"
    />
  </Teleport>
</template>

<script>
import { mapState } from 'pinia';

import { useFeatureFlag } from '@/store/modules/featureFlag';
import { useProfile } from '@/store/modules/profile';
import { useRooms } from '@/store/modules/chats/rooms';

import callUnnnicAlert from '@/utils/callUnnnicAlert';

import FlowsTriggerAPI from '@/services/api/resources/chats/flowsTrigger';

import SelectFlow from './SelectFlow.vue';
import SendFlowButton from './SendFlowButton.vue';
import ModalVariableMapping from './ModalVariableMapping.vue';
import { FLOW_TRIGGER_VARIABLE_MAPPING_FLAG } from './types';
import { getAvailableLocalVariables } from '@/utils/localVariables';
import { hasTemplateVariables } from '@/utils/flowTemplates';

export default {
  name: 'ModalSendFlow',

  components: {
    SelectFlow,
    SendFlowButton,
    ModalVariableMapping,
  },

  props: {
    contacts: {
      type: Array,
      required: true,
    },
    isProjectPrincipal: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['close', 'send-flow-finished'],

  data() {
    return {
      isOpen: true,
      selectedFlow: '',
      isCheckingTemplate: false,
      cachedTemplate: null,
      showVariableModal: false,
      isSendingFlow: false,
    };
  },

  computed: {
    ...mapState(useFeatureFlag, ['featureFlags']),
    ...mapState(useProfile, ['me']),
    ...mapState(useRooms, {
      activeRoom: (store) => store.activeRoom,
    }),

    isVariableMappingEnabled() {
      return !!this.featureFlags?.active_features?.includes(
        FLOW_TRIGGER_VARIABLE_MAPPING_FLAG,
      );
    },

    localVariables() {
      return getAvailableLocalVariables({
        contacts: this.contacts,
        agent: this.me,
        room: this.activeRoom,
      });
    },
  },

  watch: {
    isOpen(value) {
      if (!value) this.$emit('close');
    },
    selectedFlow(newSelectedFlow) {
      this.checkFlowTemplate(newSelectedFlow);
    },
  },

  methods: {
    finishSendFlow({ hasError }) {
      callUnnnicAlert({
        props: {
          text: hasError
            ? this.$t('flows_trigger.error_triggering')
            : this.$t('flows_trigger.successfully_triggered'),
          type: hasError ? 'error' : 'success',
        },
        seconds: 5,
      });

      this.$emit('send-flow-finished');
    },

    setCachedTemplate(template) {
      this.cachedTemplate = template;
      this.showVariableModal = Boolean(template?.templates?.length);
    },

    onCancelVariableMapping() {
      this.showVariableModal = false;
    },

    async onConfirmVariableMapping(params) {
      this.isSendingFlow = true;
      try {
        await this.$refs.sendFlowButton.doSendFlow(params);
        this.showVariableModal = false;
      } finally {
        this.isSendingFlow = false;
      }
    },

    async checkFlowTemplate(flowUuid) {
      this.setCachedTemplate(null);

      if (!flowUuid) return;
      if (this.isProjectPrincipal || !this.isVariableMappingEnabled) return;

      this.isCheckingTemplate = true;
      try {
        const response = await FlowsTriggerAPI.getFlowTemplates(flowUuid);

        if (this.selectedFlow !== flowUuid) return;

        const templates = response?.templates || [];
        const hasVariables = hasTemplateVariables(templates);

        this.setCachedTemplate(
          hasVariables
            ? {
                templates,
                total_template_qty:
                  response?.total_template_qty ?? templates.length,
              }
            : null,
        );
      } catch (error) {
        console.error('Error checking flow templates', error);
      } finally {
        if (this.selectedFlow === flowUuid) {
          this.isCheckingTemplate = false;
        }
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.modal-send-flow {
  &__content {
    padding: $unnnic-space-6;
  }

  :deep(.unnnic-select-smart) .dropdown-data {
    // !important at position is needed here because the
    // unnnicSelectSmart base already uses !important
    position: initial !important;
  }
}
</style>
