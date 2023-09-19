<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <aside-slot-template
    :title="$t('flows_trigger.title')"
    :subtitle="$t('flows_trigger.subtitle', { queue: 'Atendimento humano' })"
    icon="send-email-3-1"
    @close="$emit('close')"
  >
    <aside-slot-template-section class="template-messages" v-if="showSelectTemplate">
      <layout-template-message
        @back="closeSelectTemplate"
        @close="$emit('close')"
        :contacts="selected"
        :groups="selectedGroup"
      />
    </aside-slot-template-section>
    <aside-slot-template-section class="template-messages" v-else>
      <unnnic-input
        v-model="searchUrn"
        icon-left="search-1"
        :placeholder="$t('chats.search_contact')"
      ></unnnic-input>
      <section
        class="template-messages__selecteds"
        v-if="listOfGroupAndContactsSelected.length > 0"
      >
        <unnnic-tag
          type="default"
          v-for="item in listOfGroupAndContactsSelected"
          :key="item.uuid"
          :text="item.name"
          hasCloseIcon
          scheme="background-snow"
          @close="unselectItem(item)"
        />
      </section>
      <section
        class="template-messages__groups"
        @scroll="
          (event) => {
            handleScroll(event.srcElement);
          }
        "
      >
        <unnnic-collapse
          :title="$t('flows_trigger.groups', { length: listOfGroups.length })"
          active
          v-if="listOfGroups.length > 0"
        >
          <unnnic-chats-contact
            v-for="item in searchGroup"
            :key="item.uuid"
            :username="item.name"
            :lastMessage="$tc('flows_trigger.group_contacts', item.count)"
            :tabindex="0"
            checkboxWhenSelect
            :selected="selectedGroup.some((search) => search.uuid === item.uuid)"
            @click="setGroups(item)"
            @keypress.enter="setGroups(item)"
          />
        </unnnic-collapse>
        <template v-for="(element, letter) in letras">
          <unnnic-collapse
            :key="letter"
            :title="$t('flows_trigger.letter_group', { letter, length: element.length })"
            active
          >
            <unnnic-chats-contact
              v-for="item in element"
              :key="item.uuid"
              :username="item.name"
              :lastMessage="item.urns[0]"
              :tabindex="0"
              checkboxWhenSelect
              :selected="selected.some((search) => search.uuid === item.uuid)"
              @click="setContacts(item)"
              @keypress.enter="setGroups(item)"
            />
          </unnnic-collapse>
        </template>
      </section>
    </aside-slot-template-section>
    <div class="template-messages__handlers" v-if="!showSelectTemplate">
      <unnnic-button-next
        size="small"
        type="secondary"
        :text="$t('add')"
        :iconLeft="'add-1'"
        @click="openModal"
      />
      <unnnic-button-next
        :disabled="this.listOfGroupAndContactsSelected.length === 0"
        :text="$t('continue')"
        type="primary"
        size="small"
        @click="openSelectTemplate"
      />
    </div>
    <modal-add-new-contact v-if="showModal" @close="closeModal" />
  </aside-slot-template>
</template>

<script>
import AsideSlotTemplate from '@/components/layouts/chats/AsideSlotTemplate';
import AsideSlotTemplateSection from '@/components/layouts/chats/AsideSlotTemplate/Section.vue';
import ModalAddNewContact from '@/components/chats/TemplateMessages/ModalAddNewContact.vue';
import LayoutTemplateMessage from '@/components/chats/TemplateMessages/LayoutTemplateMessage';
import TemplateMessages from '@/services/api/resources/chats/templateMessage.js';

export default {
  name: 'ContactList',

  components: {
    AsideSlotTemplate,
    AsideSlotTemplateSection,
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
    searchUrn: '',
    timerId: 0,
    thereIsContact: true,
    listOfContacts: [],
    listOfGroups: [],
    names: [],
    selected: [],
    selectedGroup: [],
    showModal: false,
    showSelectTemplate: false,
    page: 0,
  }),

  computed: {
    letras() {
      const letras = {};
      this.listOfContacts
        .filter((item) => item.name?.toUpperCase().includes(this.search.toUpperCase()))
        .forEach((element) => {
          const l = element.name[0].toUpperCase();
          const removeAccent = l.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          letras[removeAccent] = letras[removeAccent] || [];
          letras[removeAccent].push(element);
        });
      return letras;
    },
    searchGroup() {
      return this.listOfGroups.filter((item) =>
        item.name.toUpperCase().includes(this.search.toUpperCase()),
      );
    },
    listOfGroupAndContactsSelected() {
      return this.selected.concat(this.selectedGroup);
    },
  },

  methods: {
    setContacts(item) {
      if (this.selected.some((search) => search.uuid === item.uuid)) {
        this.selected = this.selected.filter((el) => el.uuid !== item.uuid);
      } else {
        this.selected.push(item);
      }
    },

    setGroups(item) {
      if (this.selectedGroup.some((search) => search.uuid === item.uuid)) {
        this.selectedGroup = this.selectedGroup.filter((el) => el.uuid !== item.uuid);
      } else {
        this.selectedGroup.push(item);
      }
    },

    unselectItem(item) {
      if (this.selected.some((search) => search.uuid === item.uuid)) {
        this.selected = this.selected.filter((el) => el.uuid !== item.uuid);
      }
      if (this.selectedGroup.some((search) => search.uuid === item.uuid)) {
        this.selectedGroup = this.selectedGroup.filter((el) => el.uuid !== item.uuid);
      }
    },

    async contactList(next, cleanList = false) {
      if (cleanList) this.listOfContacts = [];
      this.isLoading = true;
      try {
        const response = await TemplateMessages.getListOfContacts(next, this.searchUrn);
        this.listOfContacts = this.listOfContacts.concat(response.results);
        this.hasNext = response.next;
        this.listOfContacts.sort((a, b) => a.name?.localeCompare(b.name));
        this.isLoading = false;
      } catch (error) {
        this.isLoading = false;
        console.log(error);
      }
    },

    handleScroll(target) {
      if (this.isLoading) return;
      if (target.offsetHeight + Math.ceil(target.scrollTop) >= target.scrollHeight) {
        this.searchForMoreContacts();
      }
    },

    searchForMoreContacts() {
      if (this.hasNext) {
        this.contactList(this.hasNext, false);
      }
    },

    async groupList() {
      try {
        const response = await TemplateMessages.getListOfGroups();
        this.listOfGroups = response.results.filter((el) => ![null, undefined].includes(el.name));
        this.listOfGroups.sort((a, b) => a.name.localeCompare(b.name));
      } catch (error) {
        console.log(error);
      }
    },

    openModal() {
      this.showModal = true;
    },

    closeModal() {
      this.showModal = false;
      this.contactList(null, true);
    },

    openSelectTemplate() {
      this.showSelectTemplate = true;
    },

    closeSelectTemplate() {
      this.showSelectTemplate = false;
    },
  },
  watch: {
    searchUrn: {
      handler() {
        if (this.timerId !== 0) clearTimeout(this.timerId);
        this.timerId = setTimeout(() => {
          this.contactList(null, true);
        }, 1000);
      },
    },
  },
};
</script>

<style lang="scss" scoped>
.template-messages {
  display: flex;
  overflow: hidden;
  flex-direction: column;
  gap: $unnnic-spacing-sm;

  background-color: $unnnic-color-background-carpet;

  :deep(.unnnic-tag) {
    background-color: $unnnic-color-background-snow;

    max-width: 100%;
    scroll-snap-align: start;

    .unnnic-tag__label {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  &__selecteds {
    display: flex;
    gap: 8px;
    overflow: hidden auto;
    flex-wrap: wrap;
    max-height: 64px;

    scroll-snap-type: y proximity;
  }

  &__groups {
    flex: 1 1;
    display: flex;
    flex-direction: column;
    gap: $unnnic-spacing-stack-md;
    overflow-y: auto;

    // Space between content and scrollbar
    margin-right: -$unnnic-spacing-sm;
    padding-right: $unnnic-spacing-sm;

    .contact {
      &:not(:last-of-type) {
        margin-bottom: $unnnic-spacing-nano;
      }
    }
  }
}
.template-messages__handlers {
  padding: $unnnic-spacing-xs;
  padding-top: 0;

  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $unnnic-spacing-xs;
  align-items: end;

  background-color: $unnnic-color-background-carpet;
}
.selected-contacts {
  width: 100%;
  max-width: 100%;
  border-radius: 0.6rem;
  padding: 1rem;
  background-color: $unnnic-color-background-carpet;
  .contacts-label {
    color: $unnnic-color-neutral-cloudy;
    font-family: $unnnic-font-family-secondary;
    font-size: 0.6rem;
  }
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
.flex {
  width: 100%;
  max-width: 99%;
  display: flex;
  border-radius: 0.6rem;
  padding: 5px;
  flex-wrap: wrap;
  justify-content: space-between;
  background-color: $unnnic-color-background-carpet;
}

.flex > div {
  width: 7rem;
  display: flex;
  align-items: center;
  padding: 5px;
  white-space: nowrap;
  font-size: 0.75rem;
  color: $unnnic-color-neutral-darkest;
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
  padding-right: $unnnic-spacing-inset-sm;

  overflow: hidden scroll;

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
</style>
