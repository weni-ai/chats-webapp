<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <AsideSlotTemplate>
    <template #header>
      <section class="flows-trigger__page-header">
        <UnnnicPageHeader
          :title="$t('flows_trigger.title')"
          data-testid="flows-trigger-header"
        >
          <template #actions>
            <UnnnicButton
              type="tertiary"
              size="small"
              iconCenter="close"
              :ariaLabel="$t('close')"
              data-testid="flows-trigger-close"
              @click="$emit('close')"
            />
          </template>
        </UnnnicPageHeader>
      </section>
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
        @update:cached-template="updateCachedTemplate"
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
          <UnnnicDisclaimer
            v-for="contact in openedRoomsAlerts"
            :key="contact.contactName"
            type="attention"
            :description="alreadyOpenRoomMessage(contact)"
            data-testid="flows-trigger-already-open"
          />
        </section>

        <FlowsContactsLoading v-show="isContactsLoading" />
        <p
          v-if="showErrorContactsNoResults"
          class="flows-trigger__groups__no-results"
        >
          {{ $t('without_results') }}
        </p>

        <section v-show="!isContactsLoading">
          <template v-for="(element, letter) in lettersWithoutUnnamed">
            <!-- eslint-disable-next-line vue/valid-v-for -->
            <UnnnicCollapse
              v-model="letterColapse[letter]"
              class="flows-trigger__groups__group"
              :title="
                $t('flows_trigger.letter_group', {
                  letter,
                  length: element?.length || 0,
                })
              "
            >
              <FlowsContactCard
                v-for="item in element"
                :key="item.uuid"
                class="flows-trigger__groups__group__contact"
                :name="item.name"
                :subtitle="getContactUrn(item)"
                :selected="selected.some((search) => search.uuid === item.uuid)"
                @toggle="setContacts(item)"
              />
            </UnnnicCollapse>
          </template>
          <template v-if="letters['unnamed_contact']">
            <UnnnicCollapse
              v-model="letterColapse['unnamed_contact']"
              class="flows-trigger__groups__group"
              :title="
                $t('flows_trigger.letter_group_unnamed', {
                  length: letters['unnamed_contact']?.length || 0,
                })
              "
            >
              <FlowsContactCard
                v-for="item in letters['unnamed_contact']"
                :key="item.uuid"
                class="flows-trigger__groups__group__contact"
                :name="`[${$t('flows_trigger.unnamed_contact')}]`"
                :subtitle="getContactUrn(item)"
                :selected="selected.some((search) => search.uuid === item.uuid)"
                unnamed
                @toggle="setContacts(item)"
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
          :disabled="
            listOfGroupAndContactsSelected.length === 0 ||
            hasCachedTemplateVariables
          "
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
        :isProjectPrincipal="isProjectPrincipal"
        @close="closeSendFlow"
        @send-flow-finished="$emit('close')"
      />
      <ModalVariableMapping
        v-if="showInlineVariableModal && inlineTemplate"
        :template="inlineTemplate.data"
        :variables="inlineTemplate.variables"
        :localVariables="localVariables"
        :isLoading="isLoadingSendFlow"
        @close="closeInlineVariableModal"
        @confirm="confirmInlineVariableMapping"
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
import { useFeatureFlag } from '@/store/modules/featureFlag';
import { useProfile } from '@/store/modules/profile';

import AsideSlotTemplate from '@/components/layouts/chats/AsideSlotTemplate/index.vue';
import AsideSlotTemplateSection from '@/components/layouts/chats/AsideSlotTemplate/Section.vue';
import ModalListTriggeredFlows from '@/components/chats/FlowsTrigger/ModalListTriggeredFlows.vue';
import ModalAddNewContact from '@/components/chats/FlowsTrigger/ModalAddNewContact.vue';
import ModalSendFlow from '@/components/chats/FlowsTrigger/ModalSendFlow.vue';
import ModalRemoveSelectedContacts from '@/components/chats/FlowsTrigger/ModalRemoveSelectedContacts.vue';
import ModalVariableMapping from '@/components/chats/FlowsTrigger/ModalVariableMapping.vue';
import { FLOW_TRIGGER_VARIABLE_MAPPING_FLAG } from '@/components/chats/FlowsTrigger/types';
import {
  getAvailableLocalVariables,
  resolveAllValues,
} from '@/components/chats/FlowsTrigger/localVariables';
import SelectedContactsSection from '@/components/chats/FlowsTrigger/SelectedContactsSection.vue';
import SendFlow from '@/components/chats/FlowsTrigger/SendFlow.vue';
import FlowsContactCard from '@/components/chats/FlowsTrigger/FlowsContactCard.vue';
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
    FlowsContactCard,
    FlowsContactsLoading,
    ModalListTriggeredFlows,
    ModalAddNewContact,
    ModalSendFlow,
    ModalRemoveSelectedContacts,
    ModalVariableMapping,
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

    showInlineVariableModal: false,
    inlineTemplate: null,
    cachedTemplate: null,
  }),

  computed: {
    ...mapState(useConfig, {
      project: (store) => store.project,
    }),
    ...mapState(useRooms, {
      room: (store) => store.activeRoom,
    }),
    ...mapState(useFeatureFlag, ['featureFlags']),
    ...mapState(useProfile, ['me']),

    isVariableMappingEnabled() {
      return !!this.featureFlags?.active_features?.includes(
        FLOW_TRIGGER_VARIABLE_MAPPING_FLAG,
      );
    },

    hasCachedTemplateVariables() {
      return (this.cachedTemplate?.variables?.length ?? 0) > 0;
    },

    contactsForResolution() {
      if (
        this.selectedContact &&
        Object.keys(this.selectedContact).length > 0
      ) {
        return [this.selectedContact];
      }
      return this.selected;
    },

    localVariables() {
      return getAvailableLocalVariables({
        contacts: this.contactsForResolution,
        agent: this.me,
        room: this.room,
      });
    },

    lettersWithoutUnnamed() {
      return Object.keys(this.letters).reduce((acc, key) => {
        if (key !== 'unnamed_contact') {
          acc[key] = this.letters[key];
        }
        return acc;
      }, {});
    },

    letters() {
      const letters = {};
      const UNNAMED_KEY = 'unnamed_contact';

      const hasValidName = (item) =>
        item.name != null && String(item.name).trim() !== '';

      const getGroupKey = (element) => {
        if (!hasValidName(element)) return UNNAMED_KEY;
        const first = element.name[0];
        return /\d/.test(first)
          ? first
          : first
              .toUpperCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '');
      };

      this.listOfContacts
        .filter(
          (item) =>
            item.urns?.[0] &&
            (hasValidName(item)
              ? item.name.toUpperCase().includes(this.search.toUpperCase())
              : true),
        )
        .forEach((element) => {
          const groupKey = getGroupKey(element);

          letters[groupKey] = letters[groupKey] || [];

          const contactAlreadyExist = letters[groupKey].some((pushedContact) =>
            pushedContact.urns.some((pushedUrn) =>
              element.urns.some(
                (elementUrn) =>
                  elementUrn.scheme === pushedUrn.scheme &&
                  elementUrn.path === pushedUrn.path,
              ),
            ),
          );

          if (!contactAlreadyExist) letters[groupKey].push(element);
          if (this.letterColapse[groupKey] === undefined) {
            this.letterColapse[groupKey] = true;
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

    updateCachedTemplate(cachedTemplate) {
      this.cachedTemplate = cachedTemplate;

      if (cachedTemplate?.variables?.length > 0) {
        this.inlineTemplate = cachedTemplate;
        this.showInlineVariableModal = true;
        return;
      }

      this.closeInlineVariableModal();
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

    alreadyOpenRoomMessage(contact) {
      const opening = this.$t('flows_trigger.already_open_room.open', {
        contact: contact.contactName,
      });

      const detail = contact.agent
        ? this.$t('flows_trigger.already_open_room.with_agent', {
            agent: contact.agent,
            queue: contact.queue,
          })
        : this.$t('flows_trigger.already_open_room.in_queue_awaiting', {
            queue: contact.queue,
          });

      return `${opening} ${detail}`;
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
      if (this.hasCachedTemplateVariables) return;

      await this.doSendFlowToContacts();
    },

    closeInlineVariableModal() {
      this.showInlineVariableModal = false;
      this.inlineTemplate = null;
    },

    async confirmInlineVariableMapping(params) {
      await this.doSendFlowToContacts(params);
      this.closeInlineVariableModal();
    },

    async doSendFlowToContacts(params) {
      let hasError = false;

      this.isLoadingSendFlow = true;
      const contactsToSendFlow = this.selectedContact
        ? [this.selectedContact]
        : this.selected;

      const sendFlowToContact = async (contact) => {
        const resolvedParams = params
          ? resolveAllValues(params, {
              contact,
              agent: this.me,
              room: this.room,
            })
          : null;

        const prepareObj = {
          flow: this.selectedFlow,
          contacts: [contact.external_id || contact.uuid],
          room: this.room?.uuid || '',
          contact_name: contact.name,
          ...(resolvedParams ? { params: resolvedParams } : {}),
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
.flows-trigger__page-header {
  min-height: var(--chats-column-header-height, 57px);
  :deep(.page-header) {
    margin-top: 0;
    padding: $unnnic-space-2 $unnnic-space-4;

    grid-template-columns: 1fr auto;
    gap: $unnnic-space-2;
  }

  :deep(.page-header__title) {
    font: $unnnic-font-display-3;
  }

  :deep(.page-header__actions) {
    > * {
      width: auto;
    }
  }
}

.flows-trigger {
  display: flex;
  overflow: hidden;
  flex-direction: column;

  background-color: $unnnic-color-bg-base;

  padding: $unnnic-space-2;

  > * + :not(.flows-trigger__handlers) {
    margin-top: $unnnic-space-4;
  }

  &__header {
    display: grid;
    gap: $unnnic-space-4;
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
      color: $unnnic-color-fg-base;
      font-size: $unnnic-font-size-body-gt;
    }
  }

  &__contact-alerts {
    display: flex;
    flex-direction: column;
    gap: $unnnic-spacing-sm;
  }
}
.flows-trigger__mobile-send {
  z-index: 100;

  margin: 0 $unnnic-spacing-ant $unnnic-spacing-md 0;
}

.flows-trigger__handlers {
  margin-top: auto;
  margin-right: -$unnnic-space-2;
  margin-bottom: -$unnnic-space-2;
  margin-left: -$unnnic-space-2;
  padding: $unnnic-space-2;

  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $unnnic-space-2;
  align-items: center;

  border-top: 1px solid $unnnic-color-border-base;
  background-color: $unnnic-color-bg-base;
}
</style>
