<template>
  <section
    class="send-flow"
    data-testid="send-flow-container"
  >
    <section>
      <SelectProjects
        v-if="isProjectPrincipal"
        v-model="projectUuidFlow"
      />
      <SelectFlow
        v-model="selectedFlow"
        data-testid="select-flow"
        :isDisabled="
          isCheckingTemplate || (isProjectPrincipal && !projectUuidFlow)
        "
        :projectUuidFlow="projectUuidFlow"
      />
    </section>

    <div v-if="showProgressBar">
      <ModalProgressBarFalse
        :title="$t('flows_trigger.sending')"
        @close="closeModalProgress"
      />
    </div>
    <Teleport to=".chats-webapp">
      <ModalVariableMapping
        v-if="showVariableModal && cachedTemplate"
        :template="cachedTemplate.data"
        :variables="cachedTemplate.variables"
        :localVariables="localVariables"
        :isLoading="isSendingFlow"
        data-testid="send-flow-variable-mapping"
        @close="onCancelVariableMapping"
        @confirm="onConfirmVariableMapping"
      />
    </Teleport>
    <footer class="send-flow__handlers">
      <UnnnicButton
        class="send-flow__handlers__button"
        :text="$t('back')"
        size="small"
        type="tertiary"
        data-testid="back-button"
        @click="noHasContacts ? $emit('close') : $emit('back')"
      />
      <SendFlowButton
        ref="sendFlowButton"
        class="send-flow__handlers__button"
        :contacts="contacts"
        :selectedContact="selectedContact"
        :selectedFlow="selectedFlow"
        :isProjectPrincipal="isProjectPrincipal"
        :projectUuidFlow="projectUuidFlow"
        :isCheckingTemplate="isCheckingTemplate"
        :cachedTemplate="cachedTemplate"
        data-testid="send-flow-button"
        @back-to-contact-list="backToContactList"
        @send-flow-started="openModalProgress"
        @send-flow-finished="closeModalProgressWithResult"
      />
    </footer>
  </section>
</template>

<script>
import { mapState } from 'pinia';

import { useFeatureFlag } from '@/store/modules/featureFlag';

import callUnnnicAlert from '@/utils/callUnnnicAlert';

import ModalProgressBarFalse from '@/components/ModalProgressBarFalse.vue';

import FlowsTriggerAPI from '@/services/api/resources/chats/flowsTrigger';

import SelectFlow from './SelectFlow.vue';
import SendFlowButton from './SendFlowButton.vue';
import SelectProjects from './SelectProjects.vue';
import { FLOW_TRIGGER_VARIABLE_MAPPING_FLAG } from './types';
import { hasTemplateVariables } from '@/utils/flowTemplates';

export default {
  name: 'SendFlow',

  components: {
    SelectFlow,
    SendFlowButton,
    ModalProgressBarFalse,
    SelectProjects,
  },

  props: {
    contacts: {
      type: Array,
      default: () => [],
    },
    selectedContact: {
      type: Object,
      default: () => {},
    },
    isProjectPrincipal: {
      type: Boolean,
      default: false,
    },
  },
  emits: [
    'back',
    'close',
    'update:projectUuidFlow',
    'update:selectedFlow',
    'update:cachedTemplate',
  ],

  data() {
    return {
      showProgressBar: false,

      selectedFlow: '',
      projectUuidFlow: '',

      isCheckingTemplate: false,
      cachedTemplate: null,
    };
  },

  computed: {
    ...mapState(useFeatureFlag, ['featureFlags']),

    noHasContacts() {
      return !this.selectedContact && this.contacts.length === 0;
    },

    isVariableMappingEnabled() {
      return !!this.featureFlags?.active_features?.includes(
        FLOW_TRIGGER_VARIABLE_MAPPING_FLAG,
      );
    },
  },

  watch: {
    selectedFlow(newSelectedFlow) {
      this.$emit('update:selectedFlow', newSelectedFlow);
      this.checkFlowTemplate(newSelectedFlow);
    },
    projectUuidFlow(newProjectUuidFlow) {
      this.$emit('update:projectUuidFlow', newProjectUuidFlow);
    },
  },

  methods: {
    openModalProgress() {
      this.showProgressBar = true;
    },

    closeModalProgress() {
      this.showProgressBar = false;

      this.$emit('close');
    },

    closeModalProgressWithResult({ hasError }) {
      this.showProgressBar = false;

      callUnnnicAlert({
        props: {
          text: hasError
            ? this.$t('flows_trigger.error_triggering')
            : this.$t('flows_trigger.successfully_triggered'),
          type: hasError ? 'error' : 'success',
        },
        seconds: 5,
      });

      this.$emit('close');
    },

    backToContactList() {
      this.$emit('back');
    },

    setCachedTemplate(template) {
      this.cachedTemplate = template;
      this.$emit('update:cachedTemplate', template);
    },

    async checkFlowTemplate(flowUuid) {
      this.setCachedTemplate(null);

      if (!flowUuid) return;
      if (this.isProjectPrincipal || !this.isVariableMappingEnabled) return;

      this.isCheckingTemplate = true;
      try {
        const response = await FlowsTriggerAPI.getFlowTemplates(
          flowUuid,
          this.projectUuidFlow,
        );

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
.send-flow {
  display: flex;
  justify-content: space-between;
  flex-direction: column;

  height: 100%;

  &__handlers {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: $unnnic-space-2;

    &__button {
      width: 100%;
    }
  }
}
</style>
