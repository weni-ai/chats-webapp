<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <unnnic-modal
    @close="$emit('close')"
    :text="$t('flows_trigger.add_new_contact.title')"
    class="modal-add-new-contact"
  >
    <form class="modal-add-new-contact__form" @submit.stop="">
      <unnnic-input
        v-model="contact.name"
        :label="$t('flows_trigger.add_new_contact.contact_name')"
        :placeholder="$t('flows_trigger.add_new_contact.contact_name')"
      />
      <unnnic-input
        v-model="contact.tel"
        label="WhatsApp"
        placeholder="+99 (99) 99999 9999"
        :mask="Object.values(telMask)"
      />
    </form>

    <template #options>
      <unnnic-button :text="$t('cancel')" type="secondary" @click="$emit('close')" />
      <unnnic-button
        :text="$t('save')"
        type="primary"
        @click="saveNewContact"
        :disabled="!isValidForm"
        :loading="isLoading"
      />
    </template>
  </unnnic-modal>
</template>

<script>
import { unnnicCallAlert } from '@weni/unnnic-system';
import FlowsTrigger from '@/services/api/resources/chats/flowsTrigger.js';

export default {
  name: 'ModalAddNewContact',

  data: () => ({
    contact: {
      name: '',
      tel: '',
    },
    telMask: {
      telephone: '+## (##) #### ####',
      cellphone: '+## (##) ##### ####',
    },
    isLoading: false,
  }),

  computed: {
    isValidForm() {
      const { contact, telMask } = this;

      return (
        contact.name &&
        (contact.tel.length === telMask.telephone.length ||
          contact.tel.length === telMask.cellphone.length)
      );
    },
  },

  methods: {
    async saveNewContact() {
      this.isLoading = true;

      try {
        const prepareTel = this.contact.tel.replace(/[^0-9]/g, '');
        const newContact = {
          name: this.contact.name,
          urns: [`whatsapp:${prepareTel}`],
        };
        const response = await FlowsTrigger.createContact(newContact);

        unnnicCallAlert({
          props: {
            text: this.$t('flows_trigger.successfully_add_contact'),
            type: 'success',
          },
          seconds: 5,
        });

        this.isLoading = false;

        this.$emit('close', response);
      } catch (error) {
        this.isLoading = false;

        console.log(error);
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.modal-add-new-contact {
  &__form {
    text-align: start;
  }

  :deep(.unnnic-modal-container-background-body-description-container) {
    padding-bottom: 0;
  }
}
</style>
