<template>
  <unnnic-button
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
import { mapState } from 'vuex';

import FlowsTrigger from '@/services/api/resources/chats/flowsTrigger';

export default {
  name: 'SendFlowButton',

  props: {
    contacts: {
      type: Array,
    },
    selectedContact: {
      type: Object,
    },
    selectedFlow: {
      type: String,
      required: true,
    },
  },

  data() {
    return {
      isLoading: false,
    };
  },

  computed: {
    ...mapState({
      room: (state) => state.chats.rooms.activeRoom,
    }),
  },

  methods: {
    async sendFlow() {
      this.isLoading = true;
      this.$emit('send-flow-started');

      const contactsToSendFlow = this.selectedContact ? [this.selectedContact] : this.contacts;

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
