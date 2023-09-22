<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <div class="modal">
    <div class="modal-container">
      <div class="modal-container-background">
        <div class="modal-background-color">
          <div class="header-modal">
            <div @click="$emit('close')">
              <unnnic-icon
                style="cursor: pointer; margin-right: 26px; margin-top: 18px"
                size="sm"
                icon="close-1"
              />
            </div>
          </div>
          <div class="content-title">{{ $t('flows_trigger.add_new_contact.title') }}</div>
          <div class="form">
            <div style="margin-bottom: 16px">
              <unnnic-input
                :label="$t('flows_trigger.add_new_contact.contact_name')"
                :placeholder="$t('flows_trigger.add_new_contact.contact_name')"
                v-model="contact.name"
              />
            </div>
            <div style="margin-bottom: 44px">
              <unnnic-input
                v-model="contact.tel"
                label="WhatsApp"
                placeholder="+99 (99) 9999 99999"
                class="input"
                mask="+## (##) #### #####"
              />
            </div>
          </div>
          <div class="footer">
            <div style="margin-right: 30px; margin-left: 24px" @click="$emit('close')">
              <unnnic-button
                style="padding: 0.75rem 4.75rem"
                :text="$t('cancel')"
                type="terciary"
                :disabled="false"
              />
            </div>
            <div>
              <unnnic-button
                style="padding: 0.75rem 5rem"
                :text="$t('save')"
                type="secondary"
                size="large"
                @click="saveNewContact"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
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
  }),

  methods: {
    async saveNewContact() {
      try {
        const prepareTel = this.contact.tel.replace(/[^0-9]/g, '');
        const newContact = {
          name: this.contact.name,
          urns: [`whatsapp:${prepareTel}`],
        };
        await FlowsTrigger.createContact(newContact);

        unnnicCallAlert({
          props: {
            text: this.$t('flows_trigger.successfully_add_contact'),
            type: 'success',
            scheme: 'feedback-green',
          },
          seconds: 5,
        });

        this.$emit('close');
      } catch (error) {
        console.log(error);
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.modal {
  position: fixed;
  z-index: 9998;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  transition: opacity 0.3s ease;
}
.header-modal {
  display: flex;
  justify-content: flex-end;
  border-spacing: $unnnic-spacing-inline-md;
}

.modal-container {
  display: flex;
  width: 100%;
  height: 100%;
  justify-content: center;
  align-items: center;
}

.modal-container-background {
  width: 498px;
  box-shadow: 0 8px 16px rgb(0 0 0 / 8%);
  transition: all 0.3s ease;
  border-radius: 0.25rem;
  overflow: hidden;
  background-color: $unnnic-color-background-carpet;
}
.modal-background-color {
  min-height: 388px;

  .content-title {
    color: $unnnic-color-neutral-darkest;
    font-weight: $unnnic-font-weight-black;
    font-size: $unnnic-font-size-title-sm;
    line-height: $unnnic-line-height-md;
    margin-top: 18px;
    margin-bottom: 32px;
    text-align: center;
  }
}
.form {
  width: 90%;
  margin-left: 24px;
  margin-bottom: 32px;
  ::placeholder {
    color: #d1d4da;
  }
}

.footer {
  display: flex;
  // margin-left: 24px;
  // margin-bottom: 32px;
}
</style>
