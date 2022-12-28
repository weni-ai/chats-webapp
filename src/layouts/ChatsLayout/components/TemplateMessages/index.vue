<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <div class="container">
    <section class="template-messages" v-if="!showSelectTemplate">
      <div @click="$emit('close')" style="cursor: pointer">
        <unnnic-icon icon="keyboard-arrow-left-1" /> Selecionar contatos
      </div>
      <div class="no-selected-contacts" v-if="this.selected.length === 0">
        <span class="contacts-label">Nenhum contato selecionado</span>
      </div>
      <div style="display: flex" v-if="this.selected.length > 0">
        <div v-for="item in selectedContacts" :key="item.nome">
          <div class="selected-contacts">
            <user-avatar :username="item.name" size="md" />
            <span class="contacts-names">{{ item.name }}</span>
          </div>
        </div>
      </div>
      <div>
        <unnnic-input
          v-model="search"
          icon-left="search-1"
          size="sm"
          placeholder="Pesquisar contato"
        ></unnnic-input>
      </div>
      <div class="contact-list">
        <span class="title-group" v-if="listOfGroups.length > 0">Grupos</span>
        <div class="container-names" v-for="item in listOfGroups" :key="item.name">
          <div class="users-names">
            <unnnic-checkbox
              :value="selected.some((search) => search.uuid === item.uuid)"
              @change="setGroups(item)"
              style="padding: 10px"
            ></unnnic-checkbox>
            <user-avatar
              :username="item.name"
              size="2xl"
              :photo-url="usePhoto ? room.contact.photo_url : ''"
            />
            <div class="names">
              <span>{{ item.name }}</span>
              <span class="number">{{ item.count }} contatos</span>
            </div>
          </div>
        </div>
      </div>
      <div class="contact-list">
        <template v-for="(element, letter) in letras">
          <span class="title-group" :key="letter">{{ letter }}</span>
          <div class="container-names" v-for="item in element" :key="item.name">
            <div class="users-names">
              <unnnic-checkbox
                :value="selected.some((search) => search.uuid === item.uuid)"
                @change="setContacts(item)"
                style="padding: 10px"
              />
              <user-avatar
                :username="item.name"
                size="2xl"
                :photo-url="usePhoto ? room.contact.photo_url : ''"
              />
              <div class="names">
                <span>{{ item.name }}</span>
                <span class="number">{{ item.urns[0] }}</span>
              </div>
            </div>
          </div>
        </template>
      </div>
    </section>
    <section class="template-messages" v-if="showSelectTemplate">
      <layout-template-message @close="closeSelectTemplate" />
    </section>
    <div style="display: flex; justify-content: space-between" v-if="!showSelectTemplate">
      <div class="new-contact" @click="openModal">
        <unnnic-button
          style="width: 100%; margin-right: 2px"
          size="small"
          text="Adicionar"
          type="terciary"
          :iconLeft="'add-1'"
        />
      </div>
      <div class="new-contact" @click="openSelectTemplate">
        <unnnic-button text="Continuar" type="secondary" size="small" style="width: 100%" />
      </div>
    </div>
    <modal-add-new-contact v-show="showModal" @close="closeModal" />
  </div>
</template>

<script>
import UserAvatar from '@/components/chats/UserAvatar';
import ModalAddNewContact from '@/components/chats/TemplateMessages/ModalAddNewContact.vue';
import LayoutTemplateMessage from '@/components/chats/TemplateMessages/LayoutTemplateMessage';
import TemplateMessages from '@/services/api/resources/chats/templateMessage.js';

export default {
  name: 'ContactList',

  components: {
    UserAvatar,
    ModalAddNewContact,
    LayoutTemplateMessage,
  },

  created() {
    this.contactList();
    this.groupList();
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

  data: () => ({
    search: '',
    thereIsContact: true,
    listOfContacts: [],
    listOfGroups: [],
    names: [],
    selected: [],
    showModal: false,
    showSelectTemplate: false,
    selectedContacts: [],
  }),

  computed: {
    letras() {
      const letras = {};
      this.listOfContacts
        .filter((item) => item.name.toUpperCase().includes(this.search.toUpperCase()))
        .forEach((element) => {
          const l = element.name[0].toUpperCase();
          const removeAccent = l.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          letras[removeAccent] = letras[removeAccent] || [];
          letras[removeAccent].push(element);
        });
      return letras;
    },
  },

  methods: {
    setContacts(item) {
      if (this.selected.some((search) => search.uuid === item.uuid)) {
        this.selected = this.selected.filter((el) => el.uuid !== item.uuid);
      } else {
        this.selected.push(item);
        this.selectedContacts = this.selected;
        console.log(this.selectedContacts, `selectedContacts`);
      }
    },

    setGroups(item) {
      if (this.selected.some((search) => search.uuid === item.uuid)) {
        this.selected = this.selected.filter((el) => el.uuid !== item.uuid);
      } else {
        this.selected.push(item);
      }
    },

    async contactList() {
      try {
        const response = await TemplateMessages.getListOfContacts();
        this.listOfContacts = response.results;
        this.listOfContacts.sort((a, b) => a.name.localeCompare(b.name));
        this.getContactLetter();
      } catch (error) {
        console.log(error);
      }
    },

    async groupList() {
      try {
        const response = await TemplateMessages.getListOfGroups();
        this.listOfGroups = response.results;
      } catch (error) {
        console.log(error);
      }
    },

    openModal() {
      this.showModal = true;
    },

    closeModal() {
      this.showModal = false;
      this.contactList();
    },

    openSelectTemplate() {
      this.showSelectTemplate = true;
    },

    closeSelectTemplate() {
      this.showSelectTemplate = false;
    },
  },
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
    padding-right: 8px;

    // padding-right: $unnnic-spacing-inset-sm;
    overflow-y: auto;
  }
  .no-selected-contacts {
    width: 100%;
    max-width: 99%;
    border-radius: 0.6rem;
    padding: 1rem;
    background-color: $unnnic-color-background-carpet;
    .contacts-label {
      color: $unnnic-color-neutral-cloudy;
      font-family: $unnnic-font-family-secondary;
      font-size: 0.6rem;
    }
  }
  .selected-contacts {
    display: flex;
    .contacts-names {
      background-color: $unnnic-color-background-carpet;
      color: $unnnic-color-neutral-darkest;
      font-family: $unnnic-font-family-secondary;
      display: flex;
      align-items: center;
      font-weight: 400;
      font-size: 0.75rem;
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
