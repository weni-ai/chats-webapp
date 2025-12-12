<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <AsideSlotTemplate>
    <template #header>
      <UnnnicChatsHeader
        :title="$t('flows_trigger.title')"
        :subtitle="$t('flows_trigger.subtitle', { project: projectName })"
        avatarIcon="send"
        :close="() => $emit('close')"
      />
    </template>
    <AsideSlotTemplateSection
      v-if="showSendFlowStep && !isLoadingCheckProjectPrincipal"
      class="flows-trigger"
    >
      <SendFlow
        :contacts="selected"
        :groups="selectedGroup"
        :selectedContact="selectedContact"
        :isProjectPrincipal="isProjectPrincipal"
        @update:selected-flow="updateSelectedFlow"
        @update:project-uuid-flow="updateProjectUuidFlow"
        @back="closeSendFlow"
        @close="$emit('close')"
      />
    </AsideSlotTemplateSection>
    <AsideSlotTemplateSection
      v-if="!showSendFlowStep && !isLoadingCheckProjectPrincipal"
      class="flows-trigger"
    >
      <header class="flows-trigger__header">
        <UnnnicButton
          v-if="!isMobile"
          type="secondary"
          size="small"
          :text="$t('flows_trigger.triggered_flows.title')"
          @click="showTriggeredFlowsModal = true"
        />

        <UnnnicInput
          v-model="searchUrn"
          iconLeft="search-1"
          :placeholder="$t('chats.search_contact')"
        />

        <UnnnicButton
          v-if="isMobile"
          size="large"
          type="primary"
          :text="$t('flows_trigger.add_contact')"
          iconLeft="add"
          @click="openNewContactModal"
        />
      </header>

      <SelectedContactsSection
        :contacts="listOfGroupAndContactsSelected"
        @click="selectedContactHandler($event)"
        @remove-contact="selectedContactHandler($event)"
      />

      <section
        class="flows-trigger__groups"
        @scroll="
          (event) => {
            handleScroll(event.srcElement);
          }
        "
      >
        <section
          v-if="openedRoomsAlerts.length > 0"
          class="flows-trigger__contact-alerts"
        >
          <strong
            v-for="contact in openedRoomsAlerts"
            :key="contact"
            class="flows-trigger__contact-alerts__alert"
          >
            <UnnnicIcon
              size="md"
              icon="info"
              filled
              scheme="feedback-yellow"
            />
            {{
              $t('flows_trigger.already_open_room.open', {
                contact: contact.contactName,
              })
            }}
            <template v-if="contact.agent">
              {{
                $t('flows_trigger.already_open_room.with_agent', {
                  agent: contact.agent,
                  queue: contact.queue,
                })
              }}
            </template>
            <template v-else>
              {{
                $t('flows_trigger.already_open_room.in_queue_awaiting', {
                  queue: contact.queue,
                })
              }}
            </template>
          </strong>
        </section>

        <FlowsContactsLoading v-show="isContactsLoading" />
        <p
          v-if="showErrorContactsNoResults"
          class="flows-trigger__groups__no-results"
        >
          {{ $t('without_results') }}
        </p>

        <section v-show="!isContactsLoading">
          <template v-for="(element, letter) in letters">
            <!-- eslint-disable-next-line vue/valid-v-for -->
            <UnnnicCollapse
              v-model="letterColapse[letter]"
              class="flows-trigger__groups__group"
              :title="
                $t('flows_trigger.letter_group', {
                  letter,
                  length: element.length,
                })
              "
            >
              <UnnnicChatsContact
                v-for="item in element"
                :key="item.uuid"
                class="flows-trigger__groups__group__contact"
                :title="item.name"
                :lastMessage="{ text: getContactUrn(item) }"
                :tabindex="0"
                checkboxWhenSelect
                :selected="selected.some((search) => search.uuid === item.uuid)"
                @click="setContacts(item)"
                @keypress.enter="setGroups(item)"
              />
            </UnnnicCollapse>
          </template>
        </section>
      </section>
      <UnnnicButton
        v-if="isMobile && selected.length > 0"
        class="flows-trigger__mobile-send"
        type="primary"
        iconCenter="send"
        size="extra-large"
        float
        iconFilled
        @click="openSendFlow"
      />
      <section
        v-else-if="!isMobile && !showSendFlow"
        class="flows-trigger__handlers"
      >
        <UnnnicButton
          size="small"
          type="secondary"
          :text="$t('add')"
          iconLeft="add"
          @click="openNewContactModal"
        />
        <UnnnicButton
          :disabled="listOfGroupAndContactsSelected.length === 0"
          :text="selectedFlow ? $t('send') : $t('continue')"
          type="primary"
          size="small"
          @click="selectedFlow ? sendFlowToContacts() : openSendFlow()"
        />
      </section>
    </AsideSlotTemplateSection>
    <AsideSlotTemplateSection
      v-if="isLoadingCheckProjectPrincipal"
      class="flows-trigger"
    >
      <UnnnicSkeletonLoading
        width="100%"
        height="500px"
      />
    </AsideSlotTemplateSection>

    <template #modals>
      <ModalListTriggeredFlows
        v-if="showTriggeredFlowsModal"
        @close="showTriggeredFlowsModal = false"
      />
      <ModalAddNewContact
        v-if="showNewContactModal"
        :projectUuidFlow="projectUuidFlow"
        @close="closeNewContactModal"
      />
      <ModalSendFlow
        v-if="showSendFlowModal"
        :contacts="selected"
        @close="closeSendFlow"
        @send-flow-finished="$emit('close')"
      />
      <ModalRemoveSelectedContacts
        v-if="showRemoveSelectedContactsModal"
        :contacts="selected"
        @remove-contacts="removeContactsByModal"
        @close="closeRemoveSelectedContactsModal"
      />
      <ModalProgressBarFalse
        v-if="showModalProgressBar"
        :title="$t('flows_trigger.sending')"
      />
    </template>
  </AsideSlotTemplate>
</template>

<script>
import isMobile from 'is-mobile';
import { mapState } from 'pinia';

import { useConfig } from '@/store/modules/config';

import AsideSlotTemplate from '@/components/layouts/chats/AsideSlotTemplate/index.vue';
import AsideSlotTemplateSection from '@/components/layouts/chats/AsideSlotTemplate/Section.vue';
import ModalListTriggeredFlows from '@/components/chats/FlowsTrigger/ModalListTriggeredFlows.vue';
import ModalAddNewContact from '@/components/chats/FlowsTrigger/ModalAddNewContact.vue';
import ModalSendFlow from '@/components/chats/FlowsTrigger/ModalSendFlow.vue';
import ModalRemoveSelectedContacts from '@/components/chats/FlowsTrigger/ModalRemoveSelectedContacts.vue';
import SelectedContactsSection from '@/components/chats/FlowsTrigger/SelectedContactsSection.vue';
import SendFlow from '@/components/chats/FlowsTrigger/SendFlow.vue';
import ModalProgressBarFalse from '@/components/ModalProgressBarFalse.vue';
import callUnnnicAlert from '@/utils/callUnnnicAlert';
import Group from '@/services/api/resources/settings/group.js';

import FlowsContactsLoading from '@/views/loadings/FlowsTrigger/FlowsContactsLoading.vue';

import FlowsTrigger from '@/services/api/resources/chats/flowsTrigger.js';
import FlowsAPI from '@/services/api/resources/flows/flowsTrigger.js';
import { useRooms } from '@/store/modules/chats/rooms';

export default {
  name: 'FlowsTrigger',

  components: {
    AsideSlotTemplate,
    AsideSlotTemplateSection,
    FlowsContactsLoading,
    ModalListTriggeredFlows,
    ModalAddNewContact,
    ModalSendFlow,
    ModalRemoveSelectedContacts,
    SelectedContactsSection,
    SendFlow,
    ModalProgressBarFalse,
  },

  props: {
    selectedContact: {
      type: Object,
      default: () => {},
    },
  },
  emits: ['close'],

  data: () => ({
    letterColapse: {},

    isContactsLoading: true,

    search: '',
    searchUrn: '',
    timerId: 0,

    listOfContacts: [],
    listOfGroups: [],
    selected: [],
    selectedGroup: [],
    openedRoomsAlerts: [],

    showNewContactModal: false,
    showTriggeredFlowsModal: false,
    showSendFlow: false,
    showRemoveSelectedContactsModal: false,

    page: 0,

    isMobile: isMobile(),
    isProjectPrincipal: null,

    projectUuidFlow: '',
    selectedFlow: '',
    isSendFlowStarted: false,
    isSendFlowFinished: false,
    isLoadingSendFlow: false,
    isLoadingCheckProjectPrincipal: false,
  }),

  computed: {
    ...mapState(useConfig, {
      projectName: (store) => store.project.name,
      project: (store) => store.project,
    }),
    ...mapState(useRooms, {
      room: (store) => store.activeRoom,
    }),

    letters() {
      const letters = {};
      this.listOfContacts
        .filter(
          (item) =>
            item.name?.toUpperCase().includes(this.search.toUpperCase()) &&
            item.urns?.[0],
        )
        .forEach((element) => {
          const l = element.name[0].toUpperCase();
          const removeAccent = l
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
          letters[removeAccent] = letters[removeAccent] || [];

          const contactAlreadyExist = letters[removeAccent].some(
            (pushedContact) =>
              pushedContact.urns.some((pushedUrn) =>
                element.urns.some(
                  (elementUrn) =>
                    elementUrn.scheme === pushedUrn.scheme &&
                    elementUrn.path === pushedUrn.path,
                ),
              ),
          );

          if (!contactAlreadyExist) letters[removeAccent].push(element);
          if (this.letterColapse[removeAccent] === undefined) {
            this.letterColapse[removeAccent] = true;
          }
        });

      return letters;
    },

    searchGroup() {
      return this.listOfGroups.filter((item) =>
        item.name.toUpperCase().includes(this.search.toUpperCase()),
      );
    },
    listOfGroupAndContactsSelected() {
      return this.selected.concat(this.selectedGroup);
    },
    showErrorContactsNoResults() {
      return (
        !this.isContactsLoading &&
        this.searchUrn &&
        this.listOfContacts.length === 0
      );
    },
    showSendFlowModal() {
      return this.isMobile && this.showSendFlow;
    },
    showSendFlowStep() {
      return !this.isMobile && this.showSendFlow;
    },
    showModalProgressBar() {
      return this.isLoadingSendFlow;
    },
  },
  watch: {
    searchUrn: {
      handler() {
        if (this.timerId !== 0) clearTimeout(this.timerId);
        this.timerId = setTimeout(() => {
          this.contactList(null, true);
        }, 500);
      },
    },
    selectedContact: {
      immediate: true,
      handler(newSelectedContact) {
        if (newSelectedContact) {
          this.openSendFlow();
        }
      },
    },
    isProjectPrincipal: {
      handler(newIsProjectPrincipal) {
        if (newIsProjectPrincipal) {
          this.openSendFlow();
        } else {
          this.contactList();
          this.groupList();
        }
      },
    },
    projectUuidFlow: {
      immediate: true,
      handler(newProjectUuidFlow) {
        if (newProjectUuidFlow) {
          this.contactList();
          this.groupList();
        }
      },
    },
  },

  created() {
    this.projectPrincipalCheck();
  },

  methods: {
    updateSelectedFlow(selectedFlow) {
      this.selectedFlow = selectedFlow;
    },

    updateProjectUuidFlow(projectUuidFlow) {
      this.projectUuidFlow = projectUuidFlow;
    },

    setContacts(contact) {
      if (this.selected.some((search) => search.uuid === contact.uuid)) {
        this.selected = this.selected.filter((el) => el.uuid !== contact.uuid);

        this.openedRoomsAlerts = this.openedRoomsAlerts.filter(
          (mappedContactName) => {
            return mappedContactName.contactName !== contact.name;
          },
        );
      } else {
        this.selected.push(contact);
        FlowsTrigger.checkContact(contact.uuid, this.projectUuidFlow)
          .then((response) => {
            if (response.show_warning) {
              this.openedRoomsAlerts.push({
                contactName: contact.name,
                queue: response.queue,
                agent: response.agent,
              });
            }
          })
          .catch(
            (error) =>
              new Error(
                `An error occurred when trying to check if the
                contact "${contact.name}" already had an open room:`,
                error,
              ),
          );
      }
    },

    setGroups(item) {
      if (this.selectedGroup.some((search) => search.uuid === item.uuid)) {
        this.selectedGroup = this.selectedGroup.filter(
          (el) => el.uuid !== item.uuid,
        );
      } else {
        this.selectedGroup.push(item);
      }
    },

    removeContactsByModal(contactsToRemove) {
      if (!contactsToRemove) return;

      this.closeRemoveSelectedContactsModal();

      contactsToRemove.forEach((contact) => this.unselectItem(contact));
    },

    selectedContactHandler(contact) {
      if (!this.isMobile || this.listOfGroupAndContactsSelected.length === 1) {
        this.unselectItem(contact);
        return;
      }

      this.openRemoveSelectedContactsModal();
    },

    unselectItem(item) {
      if (this.selected.some((search) => search.uuid === item.uuid)) {
        this.selected = this.selected.filter((el) => el.uuid !== item.uuid);
      }
      this.openedRoomsAlerts = this.openedRoomsAlerts.filter(
        (mappedContactName) => {
          return mappedContactName !== item.name;
        },
      );
    },

    async projectPrincipalCheck() {
      try {
        this.isLoadingCheckProjectPrincipal = true;
        const response = await Group.listProjects({
          orgUuid: this.project.org,
          limit: 1,
          offset: 0,
          params: { its_principal: true },
        });

        if (response?.results?.length > 0) {
          const projectPrincipal = response.results.find(
            (project) =>
              project.uuid.toLowerCase() === this.project.uuid.toLowerCase(),
          );

          if (projectPrincipal) {
            this.isProjectPrincipal = true;
          } else {
            this.isProjectPrincipal = false;
          }
        } else {
          this.isProjectPrincipal = false;
        }
      } catch (error) {
        console.error('projectPrincipalCheck', error);
        this.isProjectPrincipal = false;
      } finally {
        this.isLoadingCheckProjectPrincipal = false;
      }
    },

    async contactList(next, cleanList = false) {
      if (!this.searchUrn || this.searchUrn.length >= 3) {
        if (cleanList) this.listOfContacts = [];
        this.isContactsLoading = true;
        try {
          const response = await FlowsAPI.getContacts(
            this.searchUrn,
            this.projectUuidFlow,
          );

          // Array filter to prevent 'null' or 'undefined' values in contact response
          this.listOfContacts = this.listOfContacts
            .concat(response.data?.results || [])
            .filter((contact) => contact);

          this.hasNext = response.next;

          this.listOfContacts.sort((a, b) => a.name?.localeCompare(b.name));
        } catch (error) {
          console.error('contactList', error);
        } finally {
          this.isContactsLoading = false;
        }
      }
    },

    handleScroll(target) {
      // Pagination temporarily removed, remove the condition below to work again.
      if (this.hasNext || !this.hasNext) return;

      if (this.isContactsLoading) return;
      if (
        target.offsetHeight + Math.ceil(target.scrollTop) >=
        target.scrollHeight
      ) {
        this.searchForMoreContacts();
      }
    },

    searchForMoreContacts() {
      if (this.hasNext) {
        this.contactList(this.hasNext, false);
      }
    },

    getContactUrn(item) {
      const urn = item.urns?.[0];
      return urn ? `${urn?.scheme}:${urn?.path}` : '';
    },

    async groupList() {
      try {
        const response = await FlowsTrigger.getListOfGroups(
          this.projectUuidFlow,
        );
        this.listOfGroups = response.results.filter(
          (el) => ![null, undefined].includes(el.name),
        );
        this.listOfGroups.sort((a, b) => a.name.localeCompare(b.name));
      } catch (error) {
        console.error('groupList', error);
      }
    },

    openNewContactModal() {
      this.showNewContactModal = true;
    },

    async closeNewContactModal(newContact) {
      this.showNewContactModal = false;
      await this.contactList(null, true);

      if (newContact) {
        this.setContacts(newContact);
      }
    },

    openSendFlow() {
      this.showSendFlow = true;
    },
    closeSendFlow() {
      this.showSendFlow = false;
    },

    openRemoveSelectedContactsModal() {
      this.showRemoveSelectedContactsModal = true;
    },
    closeRemoveSelectedContactsModal() {
      this.showRemoveSelectedContactsModal = false;
    },

    async sendFlowToContacts() {
      let hasError = false;

      this.isLoadingSendFlow = true;
      const contactsToSendFlow = this.selectedContact
        ? [this.selectedContact]
        : this.selected;

      const sendFlowToContact = async (contact) => {
        const prepareObj = {
          flow: this.selectedFlow,
          contacts: [contact.external_id || contact.uuid],
          room: this.room?.uuid || '',
          contact_name: contact.name,
        };

        try {
          await FlowsTrigger.sendFlow(prepareObj, this.projectUuidFlow);
        } catch (error) {
          console.error('sendFlowToContact', error);
          hasError = true;
        }
      };

      try {
        await Promise.all(contactsToSendFlow.map(sendFlowToContact));
        hasError = false;
      } catch (error) {
        console.error('sendFlowToContacts', error);
        hasError = true;
      } finally {
        this.isLoadingSendFlow = false;
        callUnnnicAlert({
          props: {
            text: hasError
              ? this.$t('flows_trigger.error_triggering')
              : this.$t('flows_trigger.successfully_triggered'),
            type: hasError ? 'error' : 'success',
          },
          seconds: 5,
        });
        this.$emit('close');
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.flows-trigger {
  display: flex;
  overflow: hidden;
  flex-direction: column;
  gap: $unnnic-spacing-sm;

  overflow: hidden;

  background-color: $unnnic-color-background-carpet;

  padding: $unnnic-space-2;

  &__header {
    display: grid;
    gap: $unnnic-spacing-nano;
  }

  &__groups {
    flex: 1 1;
    display: flex;
    flex-direction: column;
    gap: $unnnic-spacing-sm;
    overflow-y: auto;

    // Space between content and scrollbar
    margin-right: -$unnnic-spacing-xs;
    padding-right: $unnnic-spacing-xs;

    &__group__contact {
      &:not(:last-of-type) {
        margin-bottom: $unnnic-spacing-nano;
      }
    }

    &__no-results {
      color: $unnnic-color-neutral-cloudy;
      font-size: $unnnic-font-size-body-gt;
    }
  }

  &__contact-alerts {
    display: flex;
    flex-direction: column;
    gap: $unnnic-spacing-sm;

    &__alert {
      border: $unnnic-border-width-thinner solid $unnnic-color-neutral-soft;
      border-radius: $unnnic-border-radius-sm;

      padding: $unnnic-spacing-sm;

      display: flex;
      align-items: center;
      justify-content: center;
      gap: $unnnic-spacing-xs;

      font-weight: $unnnic-font-weight-regular;
      font-size: $unnnic-font-size-body-gt;
    }
  }
}
.flows-trigger__mobile-send {
  z-index: 100;

  margin: 0 $unnnic-spacing-ant $unnnic-spacing-md 0;
}

.flows-trigger__handlers {
  margin-top: auto;

  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $unnnic-spacing-xs;
  align-items: end;

  background-color: $unnnic-color-background-carpet;
}
</style>
