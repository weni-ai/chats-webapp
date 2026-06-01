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
    <Teleport to="#app">
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
import { useProfile } from '@/store/modules/profile';
import { useRooms } from '@/store/modules/chats/rooms';

import callUnnnicAlert from '@/utils/callUnnnicAlert';

import ModalProgressBarFalse from '@/components/ModalProgressBarFalse.vue';

import FlowsTriggerAPI from '@/services/api/resources/chats/flowsTrigger';

import SelectFlow from './SelectFlow.vue';
import SendFlowButton from './SendFlowButton.vue';
import SelectProjects from './SelectProjects.vue';
import ModalVariableMapping from './ModalVariableMapping.vue';
import { FLOW_TRIGGER_VARIABLE_MAPPING_FLAG } from './types';
import { getAvailableLocalVariables } from './localVariables';

export default {
  name: 'SendFlow',

  components: {
    SelectFlow,
    SendFlowButton,
    ModalProgressBarFalse,
    SelectProjects,
    ModalVariableMapping,
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

    noHasContacts() {
      return !this.selectedContact && this.contacts.length === 0;
    },

    isVariableMappingEnabled() {
      return !!this.featureFlags?.active_features?.includes(
        FLOW_TRIGGER_VARIABLE_MAPPING_FLAG,
      );
    },

    contactsForResolution() {
      if (
        this.selectedContact &&
        Object.keys(this.selectedContact).length > 0
      ) {
        return [this.selectedContact];
      }
      return this.contacts;
    },

    localVariables() {
      return getAvailableLocalVariables({
        contacts: this.contactsForResolution,
        agent: this.me,
        room: this.activeRoom,
      });
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
      this.showVariableModal = Boolean(template?.variables?.length);
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
        const response = await FlowsTriggerAPI.getFlowTemplates(
          flowUuid,
          this.projectUuidFlow,
        );

        if (this.selectedFlow !== flowUuid) return;

        const firstTemplate = response?.templates?.[0];
        const variables = firstTemplate?.variables || [];
        this.setCachedTemplate(variables.length > 0 ? firstTemplate : null);
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
    gap: $unnnic-spacing-xs;

    &__button {
      width: 100%;
    }
  }
}
</style>
