<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <unnnic-modal
    @close="$emit('close')"
    :text="$t('flows_trigger.remove_selected_contacts')"
    class="modal-remove-selected-contacts"
    ref="refModalRemoveSelectedContacts"
    :showModal="contacts.length > 0"
  >
    <selected-contacts-section
      :contacts="newContacts"
      @remove-contact="removeModalContact($event)"
    />
    <template #options>
      <unnnic-button
        :text="$t('cancel')"
        type="secondary"
        size="large"
        @click="closeModalInternally"
      />
      <unnnic-button
        :text="$t('confirm')"
        type="primary"
        size="large"
        @click="emitRemoveContacts"
      />
    </template>
  </unnnic-modal>
</template>

<script>
import SelectedContactsSection from '@/components/chats/FlowsTrigger/SelectedContactsSection.vue';

export default {
  name: 'ModalRemoveSelectedContacts',

  components: {
    SelectedContactsSection,
  },

  props: {
    contacts: {
      type: Array,
      required: true,
    },
  },

  data() {
    return {
      contactsToRemove: [],
    };
  },

  computed: {
    newContacts() {
      const uuidsToRemove = this.contactsToRemove.map((contact) => contact.uuid);
      const newContacts = this.contacts.filter((contact) => !uuidsToRemove.includes(contact.uuid));
      return newContacts;
    },
  },

  methods: {
    closeModalInternally() {
      this.$refs.refModalRemoveSelectedContacts?.onCloseClick();
      this.$emit('close');
    },

    removeModalContact(contact) {
      this.contactsToRemove.push(contact);
    },

    emitRemoveContacts() {
      this.$emit('remove-contacts', this.contactsToRemove);
      this.closeModalInternally();
    },
  },
};
</script>

<style lang="scss" scoped>
.modal-remove-selected-contacts {
  :deep(.unnnic-modal-container) {
    .unnnic-modal-container-background-body {
      &-description {
        padding: 0;

        &-container {
          padding-bottom: 0;
        }
      }
    }
  }
}
</style>
