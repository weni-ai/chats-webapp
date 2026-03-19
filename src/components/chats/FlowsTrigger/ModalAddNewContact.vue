<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <UnnnicDialog
    v-model:open="isOpen"
    class="modal-add-new-contact"
    data-testid="modal-add-new-contact"
  >
    <UnnnicDialogContent>
      <UnnnicDialogHeader>
        <UnnnicDialogTitle>
          {{ $t('flows_trigger.add_new_contact.title') }}
        </UnnnicDialogTitle>
      </UnnnicDialogHeader>
      <section class="modal-add-new-contact__content">
        <form
          class="modal-add-new-contact__form"
          @submit.stop=""
        >
          <UnnnicInput
            v-model="contact.name"
            :label="inputLabelContactName"
            :placeholder="inputPlaceholderContactName"
            data-testid="input-contact-name"
          />
          <UnnnicInput
            v-model="contact.tel"
            :label="inputLabelContactTel"
            placeholder="+99 (99) 99999 9999"
            :mask="Object.values(telMask)"
            data-testid="input-contact-tel"
          />
        </form>
      </section>
      <UnnnicDialogFooter>
        <UnnnicButton
          v-if="!isMobile"
          :text="$t('cancel')"
          type="secondary"
          data-testid="cancel-button"
          @click="$emit('close')"
        />
        <UnnnicButton
          :text="$t('save')"
          type="primary"
          :disabled="!isValidForm"
          :loading="isLoading"
          data-testid="save-button"
          @click="saveNewContact"
        />
      </UnnnicDialogFooter>
    </UnnnicDialogContent>
  </UnnnicDialog>
</template>

<script>
import isMobile from 'is-mobile';

import FlowsTrigger from '@/services/api/resources/chats/flowsTrigger.js';

import callUnnnicAlert from '@/utils/callUnnnicAlert';

export default {
  name: 'ModalAddNewContact',

  props: {
    projectUuidFlow: {
      type: String,
      required: false,
      default: '',
    },
  },
  emits: ['close'],

  data: () => ({
    isOpen: true,
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

      return !!(
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

  watch: {
    isOpen(value) {
      if (!value) this.$emit('close');
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
        const response = await FlowsTrigger.createContact(
          newContact,
          this.projectUuidFlow,
        );

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
  &__content {
    padding: $unnnic-space-6;
  }

  &__form {
    display: grid;
    gap: $unnnic-spacing-xs;

    text-align: start;
  }
}
</style>
