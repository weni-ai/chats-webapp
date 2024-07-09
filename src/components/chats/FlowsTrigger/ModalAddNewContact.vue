<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <UnnnicModal
    :text="$t('flows_trigger.add_new_contact.title')"
    class="modal-add-new-contact"
    @close="$emit('close')"
  >
    <form
      class="modal-add-new-contact__form"
      @submit.stop=""
    >
      <UnnnicInput
        v-model="contact.name"
        :label="inputLabelContactName"
        :placeholder="inputPlaceholderContactName"
      />
      <UnnnicInput
        v-model="contact.tel"
        :label="inputLabelContactTel"
        placeholder="+99 (99) 99999 9999"
        :mask="Object.values(telMask)"
      />
    </form>

    <template #options>
      <UnnnicButton
        v-if="!isMobile"
        :text="$t('cancel')"
        type="secondary"
        @click="$emit('close')"
      />
      <UnnnicButton
        :text="$t('save')"
        type="primary"
        :disabled="!isValidForm"
        :loading="isLoading"
        @click="saveNewContact"
      />
    </template>
  </UnnnicModal>
</template>

<script>
import isMobile from 'is-mobile';

import FlowsTrigger from '@/services/api/resources/chats/flowsTrigger.js';

import callUnnnicAlert from '@/utils/callUnnnicAlert';

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
    isMobile: isMobile(),
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

    inputPlaceholderContactName() {
      return this.$t('flows_trigger.add_new_contact.contact_name');
    },
    inputLabelContactName() {
      return this.isMobile ? '' : this.inputPlaceholderContactName;
    },
    inputLabelContactTel() {
      return this.isMobile ? '' : 'WhatsApp';
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

        callUnnnicAlert({
          props: {
            text: this.$t('flows_trigger.successfully_add_contact'),
            type: 'success',
          },
          seconds: 5,
        });

        this.isLoading = false;

        this.$emit('close', response);
      } catch (error) {
        if (error?.response?.status === 400) {
          const prepareTel = this.contact.tel.replace(/[^0-9]/g, '');
          const contact = [`${prepareTel}`];
          callUnnnicAlert({
            props: {
              text: this.$t('flows_trigger.contact_already_exists', {
                contact,
              }),
              type: 'error',
            },
            seconds: 5,
          });
        } else {
          throw error;
        }

        this.isLoading = false;
        this.$emit('close');
        console.log(error);
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.modal-add-new-contact {
  &__form {
    display: grid;
    gap: $unnnic-spacing-xs;

    text-align: start;
  }

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
