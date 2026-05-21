<template>
  <UnnnicButton
    v-bind="$attrs"
    :disabled="
      selectedFlow === '' || isCheckingTemplate || hasTemplateVariables
    "
    :loading="isLoading || isCheckingTemplate"
    :text="noHasContacts ? $t('continue') : $t('send')"
    size="small"
    type="primary"
    data-testid="send-flow-button"
    @click="noHasContacts ? backToContactList() : startSendFlow()"
  />
</template>
<script>
import { mapState } from 'pinia';
import { useRooms } from '@/store/modules/chats/rooms';
import { useFeatureFlag } from '@/store/modules/featureFlag';
import { useProfile } from '@/store/modules/profile';

import FlowsTrigger from '@/services/api/resources/chats/flowsTrigger';

import { FLOW_TRIGGER_VARIABLE_MAPPING_FLAG } from './types';
import { resolveAllValues } from './localVariables';

export default {
  name: 'SendFlowButton',

  inheritAttrs: false,

  props: {
    contacts: {
      type: Array,
      default: () => [],
    },
    selectedContact: {
      type: Object,
      default: () => {},
    },
    selectedFlow: {
      type: String,
      required: true,
    },
    isProjectPrincipal: {
      type: Boolean,
      default: false,
    },
    projectUuidFlow: {
      type: String,
      default: '',
    },
    isCheckingTemplate: {
      type: Boolean,
      default: false,
    },
    cachedTemplate: {
      type: Object,
      default: null,
    },
  },
  emits: ['send-flow-started', 'send-flow-finished', 'back-to-contact-list'],

  data() {
    return {
      isLoading: false,
    };
  },

  computed: {
    ...mapState(useRooms, {
      room: (store) => store.activeRoom,
    }),
    ...mapState(useFeatureFlag, ['featureFlags']),
    ...mapState(useProfile, ['me']),
    noHasContacts() {
      return !this.selectedContact && this.contacts.length === 0;
    },
    isVariableMappingEnabled() {
      return !!this.featureFlags?.active_features?.includes(
        FLOW_TRIGGER_VARIABLE_MAPPING_FLAG,
      );
    },
    hasTemplateVariables() {
      if (this.isProjectPrincipal || !this.isVariableMappingEnabled) {
        return false;
      }

      return (this.cachedTemplate?.variables?.length ?? 0) > 0;
    },
  },

  methods: {
    backToContactList() {
      this.$emit('back-to-contact-list');
    },

    async startSendFlow() {
      if (this.hasTemplateVariables) return;

      if (this.isProjectPrincipal || !this.isVariableMappingEnabled) {
        await this.doSendFlow();
        return;
      }

      await this.doSendFlow();
    },

    async sendFlow() {
      await this.startSendFlow();
    },

    async doSendFlow(params) {
      this.isLoading = true;
      this.$emit('send-flow-started');

      const contactsToSendFlow = this.selectedContact
        ? [this.selectedContact]
        : this.contacts;

      let hasError = false;

      const sendFlowToContact = async (contact) => {
        const resolvedParams = params
          ? resolveAllValues(params, {
              contact,
              agent: this.me,
              room: this.room,
            })
          : null;

        const prepareObj = {
          flow: this.selectedFlow,
          contacts: [contact.external_id || contact.uuid],
          room: this.room?.uuid,
          contact_name: contact.name,
          ...(resolvedParams ? { params: resolvedParams } : {}),
        };

        try {
          await FlowsTrigger.sendFlow(prepareObj, this.projectUuidFlow);
        } catch (error) {
          console.error(error);
          hasError = true;
        }
      };

      try {
        await Promise.all(contactsToSendFlow.map(sendFlowToContact));
      } finally {
        this.$emit('send-flow-finished', { hasError });
        this.isLoading = false;
      }
    },
  },
};
</script>
