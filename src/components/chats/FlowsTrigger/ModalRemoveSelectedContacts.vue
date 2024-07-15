<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <UnnnicModal
    ref="refModalRemoveSelectedContacts"
    :text="$t('flows_trigger.remove_selected_contacts')"
    class="modal-remove-selected-contacts"
    :showModal="contacts.length > 0"
    @close="$emit('close')"
  >
    <SelectedContactsSection
      :contacts="newContacts"
      @remove-contact="removeModalContact($event)"
    />
    <template #options>
      <UnnnicButton
        :text="$t('cancel')"
        type="secondary"
        size="large"
        @click="closeModalInternally"
      />
      <UnnnicButton
        :text="$t('confirm')"
        type="primary"
        size="large"
        @click="emitRemoveContacts"
      />
    </template>
  </UnnnicModal>
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
  emits: ['close', 'remove-contacts'],

  data() {
    return {
      contactsToRemove: [],
    };
  },

  computed: {
    newContacts() {
      const uuidsToRemove = this.contactsToRemove.map(
        (contact) => contact.uuid,
      );
      const newContacts = this.contacts.filter(
        (contact) => !uuidsToRemove.includes(contact.uuid),
      );
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
