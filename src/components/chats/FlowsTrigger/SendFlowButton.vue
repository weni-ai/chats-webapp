<template>
  <UnnnicButton
    v-bind="$attrs"
    :disabled="selectedFlow === ''"
    :loading="isLoading"
    :text="noHasContacts ? $t('continue') : $t('send')"
    size="small"
    type="primary"
    :iconLeft="noHasContacts ? '' : 'send'"
    data-testid="send-flow-button"
    @click="noHasContacts ? backToContactList() : startSendFlow()"
  />
  <Teleport to="body">
    <ModalVariableMapping
      v-if="showVariableModal && templateForMapping"
      :template="templateForMapping.data"
      :variables="templateForMapping.variables"
      :isLoading="isLoading"
      @close="onCancelVariableMapping"
      @confirm="onConfirmVariableMapping"
    />
  </Teleport>
</template>
<script>
import { mapState } from 'pinia';
import { useRooms } from '@/store/modules/chats/rooms';

import FlowsTrigger from '@/services/api/resources/chats/flowsTrigger';

import ModalVariableMapping from './ModalVariableMapping.vue';

export default {
  name: 'SendFlowButton',

  components: {
    ModalVariableMapping,
  },

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
  },
  emits: ['send-flow-started', 'send-flow-finished', 'back-to-contact-list'],

  data() {
    return {
      isLoading: false,
      showVariableModal: false,
      templateForMapping: null,
    };
  },

  computed: {
    ...mapState(useRooms, {
      room: (store) => store.activeRoom,
    }),
    noHasContacts() {
      return !this.selectedContact && this.contacts.length === 0;
    },
  },

  methods: {
    backToContactList() {
      this.$emit('back-to-contact-list');
    },

    async startSendFlow() {
      if (this.isProjectPrincipal) {
        await this.doSendFlow();
        return;
      }

      this.isLoading = true;
      try {
        const response = await FlowsTrigger.getFlowTemplates(
          this.selectedFlow,
          this.projectUuidFlow,
        );

        const firstTemplate = response?.templates?.[0];
        const variables = firstTemplate?.variables || [];

        if (variables.length > 0) {
          this.templateForMapping = firstTemplate;
          this.showVariableModal = true;
          this.isLoading = false;
          return;
        }
      } catch (error) {
        console.error('Error checking flow templates', error);
      }

      await this.doSendFlow();
    },

    onCancelVariableMapping() {
      this.showVariableModal = false;
      this.templateForMapping = null;
    },

    async onConfirmVariableMapping(params) {
      await this.doSendFlow(params);
      this.showVariableModal = false;
      this.templateForMapping = null;
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
        const prepareObj = {
          flow: this.selectedFlow,
          contacts: [contact.external_id || contact.uuid],
          room: this.room?.uuid,
          contact_name: contact.name,
          ...(params ? { params } : {}),
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
