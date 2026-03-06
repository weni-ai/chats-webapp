<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <UnnnicDialog
    v-model:open="isOpen"
    class="modal-remove-selected-contacts"
    data-testid="modal-remove-selected-contacts"
  >
    <UnnnicDialogContent>
      <UnnnicDialogHeader>
        <UnnnicDialogTitle>
          {{ $t('flows_trigger.remove_selected_contacts') }}
        </UnnnicDialogTitle>
      </UnnnicDialogHeader>
      <section class="modal-remove-selected-contacts__content">
        <SelectedContactsSection
          :contacts="newContacts"
          data-testid="selected-contacts-section"
          @remove-contact="removeModalContact($event)"
        />
      </section>
      <UnnnicDialogFooter>
        <UnnnicButton
          :text="$t('cancel')"
          type="secondary"
          size="large"
          data-testid="cancel-button"
          @click="closeModalInternally"
        />
        <UnnnicButton
          :text="$t('confirm')"
          type="primary"
          size="large"
          data-testid="confirm-button"
          @click="emitRemoveContacts"
        />
      </UnnnicDialogFooter>
    </UnnnicDialogContent>
  </UnnnicDialog>
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
    isOpen: {
      get() {
        return this.contacts.length > 0;
      },
      set(value) {
        if (!value) this.$emit('close');
      },
    },
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
  &__content {
    padding: $unnnic-space-6;
  }
}
</style>
