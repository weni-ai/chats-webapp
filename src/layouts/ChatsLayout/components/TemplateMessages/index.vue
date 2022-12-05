<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <div class="container">
    <section class="template-messages" v-if="!showSelectTemplate">
      <div @click="$emit('close')" style="cursor: pointer">
        <unnnic-icon icon="keyboard-arrow-left-1" /> Selecionar contatos
      </div>
      <div class="selected-contacts" v-if="!thereIsContact">
        <span v-if="!thereIsContact" class="no-contacts-label">Nenhum contato encontrado</span>
        <div v-if="thereIsContact">
          <!-- <div v-for="item in users" :key="item.nome">
            <span>{{ item.nome }}</span>
          </div> -->
        </div>
      </div>
      <div class="contact-list">
        <span class="title-group">Grupos</span>
        <div class="container-names">
          <div class="users-names">
            <unnnic-checkbox style="padding: 10px"></unnnic-checkbox>
            <user-avatar
              username="Grupo 1"
              size="2xl"
              :photo-url="usePhoto ? room.contact.photo_url : ''"
            />
            <div class="names">
              <span>Grupo 1</span>
              <span class="number">42 contatos</span>
            </div>
          </div>
        </div>
      </div>
      <div class="contact-list">
        <span class="title-group">A</span>
        <div class="container-names" v-for="item in users" :key="item.nome">
          <div class="users-names">
            <unnnic-checkbox style="padding: 10px"></unnnic-checkbox>
            <user-avatar
              :username="item.nome"
              size="2xl"
              :photo-url="usePhoto ? room.contact.photo_url : ''"
            />
            <div class="names">
              <span>{{ item.nome }}</span>
              <span class="number">42988850976</span>
            </div>
          </div>
        </div>
      </div>
    </section>
    <section class="template-messages" v-if="showSelectTemplate">
      <layout-template-message @close="closeSelectTemplate" />
    </section>
    <div style="display: flex; justify-content: space-between" v-if="!showSelectTemplate">
      <div class="new-contact" @click="openModal">
        <unnnic-button
          style="padding: 0.75rem 4rem"
          size="small"
          text="Adicionar"
          type="terciary"
          :iconLeft="'add-1'"
        />
      </div>
      <div @click="openSelectTemplate">
        <unnnic-button
          style="padding: 0.75rem 4rem"
          text="Continuar"
          type="secondary"
          size="small"
        />
      </div>
    </div>
    <!-- <div style="display: flex; justify-content: space-between" v-if="showSelectTemplate">
      <unnnic-button
        text="Enviar"
        size="small"
        type="secondary"
        iconLeft="send-email-3-1"
        style="width: 100%"
      />
    </div> -->
    <modal-add-new-contact v-show="showModal" @close="closeModal" />
  </div>
</template>

<script>
import UserAvatar from '@/components/chats/UserAvatar';
import ModalAddNewContact from '@/components/chats/TemplateMessages/ModalAddNewContact.vue';
import LayoutTemplateMessage from '@/components/chats/TemplateMessages/LayoutTemplateMessage';

export default {
  name: 'ContactList',

  components: {
    UserAvatar,
    ModalAddNewContact,
    LayoutTemplateMessage,
  },

  props: {
    disabled: {
      type: Boolean,
      default: false,
    },
    usePhoto: {
      type: Boolean,
      default: false,
    },
  },
  created() {
    this.listAllContacts();
  },
  methods: {
    openModal() {
      this.showModal = true;
    },
    closeModal() {
      this.showModal = false;
    },
    openSelectTemplate() {
      this.showSelectTemplate = true;
    },
    closeSelectTemplate() {
      this.showSelectTemplate = false;
    },
    listAllContacts() {
      const letras = [];
      this.users.sort((a, b) => a.nome.localeCompare(b.nome));
      this.users.forEach((element) => {
        const l = element.nome[0].toUpperCase();
        letras[l] = letras[l] || [];
        letras[l].push(element);
      });
      this.letras = letras;
      console.log(this.letras, `aqui`);
    },
  },
  data: () => ({
    thereIsContact: true,
    names: [],
    letras: [],
    showModal: false,
    showSelectTemplate: false,
    users: [
      { nome: 'Marcos Santos' },
      { nome: 'Lennon Bueno' },
      { nome: 'Ana Maria' },
      { nome: 'Denise Fzargo' },
      { nome: 'Álvaro Fernandes' },
    ],
  }),
};
</script>

<style lang="scss" scoped>
.container {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $unnnic-spacing-stack-xs;
  padding-bottom: $unnnic-spacing-inset-nano;

  .template-messages {
    flex: 1 1;
    display: flex;
    flex-direction: column;
    gap: $unnnic-spacing-stack-md;

    // padding-right: $unnnic-spacing-inset-sm;
    overflow-y: auto;
  }
  .selected-contacts {
    width: 100%;
    max-width: 99%;
    border-radius: 0.6rem;
    padding: 1rem;
    background-color: $unnnic-color-background-carpet;
    .no-contacts-label {
      color: $unnnic-color-neutral-cloudy;
      font-family: $unnnic-font-family-secondary;
      font-size: 0.6rem;
    }
  }
  .new-contact {
    width: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    font-family: $unnnic-font-family-secondary;
    font-size: 0.75rem;
    font-weight: 400;
    color: $unnnic-color-neutral-dark;
  }
  .contact-list {
    .title-group {
      color: $unnnic-color-neutral-dark;
      font-size: 0.75rem;
      margin: 8px 8px 8px 8px;
    }
    .container-names {
      background-color: $unnnic-color-background-carpet;
      border-radius: 4px;
      width: 96%;
      height: 60px;
      margin: 8px 8px 8px 8px;
      display: flex;
      flex-direction: row;
      .users-names {
        display: flex;
        align-items: center;
        color: $unnnic-color-neutral-darkest;

        .names {
          display: flex;
          flex-direction: column;
          margin-left: 10px;
          font-size: 0.875rem;
          .number {
            color: $unnnic-color-neutral-cloudy;
            font-weight: 400;
            font-size: 0.75rem;
            margin-top: 8px;
          }
        }
      }
    }
  }
}
</style>
