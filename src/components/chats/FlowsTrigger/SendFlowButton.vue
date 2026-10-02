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
import { useProfile } from '@/store/modules/profile';

import FlowsTrigger from '@/services/api/resources/chats/flowsTrigger';

import { resolveAllValues } from '@/utils/localVariables';
import { hasTemplateVariables } from '@/utils/flowTemplates';

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
    expiredWindow: {
      type: Boolean,
      default: false,
    },
    expiredWindowFlow: {
      type: Object,
      default: () => ({
        sendToAll: true,
        ignoredContacts: [],
        includedContacts: [],
      }),
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
    ...mapState(useProfile, ['me']),
    noHasContacts() {
      if (this.expiredWindow) return false;
      return !this.selectedContact && this.contacts.length === 0;
    },
    hasTemplateVariables() {
      if (this.isProjectPrincipal) {
        return false;
      }

      return hasTemplateVariables(this.cachedTemplate?.templates ?? []);
    },
  },

  methods: {
    backToContactList() {
      this.$emit('back-to-contact-list');
    },

    async startSendFlow() {
      if (this.hasTemplateVariables) return;

      await this.doSendFlow();
    },

    async sendFlow() {
      await this.startSendFlow();
    },

    async doSendFlow(params) {
      this.isLoading = true;
      this.$emit('send-flow-started');

      let hasError = false;
      try {
        hasError = this.expiredWindow
          ? await this.sendExpiredWindowFlow()
          : await this.sendFlowToContacts(params);
      } finally {
        this.$emit('send-flow-finished', { hasError });
        this.isLoading = false;
      }
    },

    async sendExpiredWindowFlow() {
      try {
        await FlowsTrigger.startOutOfWhatsappWindowFlow(
          {
            flow: this.selectedFlow,
            ignored_contacts: this.expiredWindowFlow.ignoredContacts,
            included_contacts: this.expiredWindowFlow.includedContacts,
            send_to_all: this.expiredWindowFlow.sendToAll,
          },
          this.projectUuidFlow,
        );
        return false;
      } catch (error) {
        console.error(error);
        return true;
      }
    },

    async sendFlowToContacts(params) {
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

      await Promise.all(contactsToSendFlow.map(sendFlowToContact));
      return hasError;
    },
  },
};
</script>
