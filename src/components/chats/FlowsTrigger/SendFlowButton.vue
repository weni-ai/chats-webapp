<template>
  <UnnnicButton
    class="send-flow__handlers__button"
    :disabled="selectedFlow === ''"
    :loading="isLoading"
    :text="$t('send')"
    size="small"
    type="primary"
    iconLeft="send"
    @click="sendFlow"
  />
</template>
<script>
import { mapState } from 'pinia';
import { useRooms } from '@/store/modules/chats/rooms';

import FlowsTrigger from '@/services/api/resources/chats/flowsTrigger';

export default {
  name: 'SendFlowButton',

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
  },
  emits: ['send-flow-started', 'send-flow-finished'],

  data() {
    return {
      isLoading: false,
    };
  },

  computed: {
    ...mapState(useRooms, {
      room: (store) => store.activeRoom,
    }),
  },

  methods: {
    async sendFlow() {
      this.isLoading = true;
      this.$emit('send-flow-started');

      const contactsToSendFlow = this.selectedContact
        ? [this.selectedContact]
        : this.contacts;

      const sendFlowToContact = async (contact) => {
        const prepareObj = {
          flow: this.selectedFlow,
          contacts: [contact.external_id || contact.uuid],
          room: this.room?.uuid,
          contact_name: contact.name,
        };

        try {
          await FlowsTrigger.sendFlow(prepareObj);
        } catch (error) {
          console.error(error);
        }
      };

      try {
        await Promise.all(contactsToSendFlow.map(sendFlowToContact));
      } finally {
        this.$emit('send-flow-finished');
        this.isLoading = false;
      }
    },
  },
};
</script>
