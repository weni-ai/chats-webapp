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
            <UnnnicToolTip
              enabled
              :text="$t('flows_trigger.triggered_flows.title')"
            >
              <UnnnicButton
                type="tertiary"
                size="small"
                iconCenter="history"
                data-testid="flows-trigger-history"
                @click="showTriggeredFlowsModal = true"
              />
            </UnnnicToolTip>
            <UnnnicToolTip
              enabled
              :text="$t('flows_trigger.add_new_contact.title')"
            >
              <UnnnicButton
                type="tertiary"
                size="small"
                iconCenter="person_add"
                data-testid="flows-trigger-add-contact"
                @click="openNewContactModal"
              />
            </UnnnicToolTip>
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
      <UnnnicSegmentedControl
        v-if="enableExpiredWindowFeature"
        v-model="activeView"
        class="flows-trigger__view-switch"
        data-testid="flows-trigger-views"
      >
        <UnnnicSegmentedControlList>
          <UnnnicSegmentedControlTrigger
            value="expired_window"
            data-testid="flows-trigger-view-expired-window"
          >
            {{ $t('flows_trigger.views.expired_window') }}
          </UnnnicSegmentedControlTrigger>
          <UnnnicSegmentedControlTrigger
            value="all_contacts"
            data-testid="flows-trigger-view-all-contacts"
          >
            {{ $t('flows_trigger.views.all_contacts') }}
          </UnnnicSegmentedControlTrigger>
        </UnnnicSegmentedControlList>
      </UnnnicSegmentedControl>

      <section class="flows-trigger__view">
        <FlowsTriggerAllContacts
          v-if="activeView === 'all_contacts' || !enableExpiredWindowFeature"
          ref="allContacts"
          :projectUuidFlow="projectUuidFlow"
          :selectedContacts="listOfGroupAndContactsSelected"
          :openedRoomsAlerts="openedRoomsAlerts"
          :selected="selected"
          @toggle="setContacts"
          @select-contact="selectedContactHandler"
          @remove-contact="selectedContactHandler"
        />
        <FlowsTriggerExpiredWindow
          v-else-if="
            activeView === 'expired_window' && enableExpiredWindowFeature
          "
        />
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
          :text="$t('cancel')"
          @click="$emit('close')"
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
        :templates="inlineTemplate.templates"
        :totalTemplateQty="inlineTemplate.total_template_qty"
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

import { useRooms } from '@/store/modules/chats/rooms';
import { useConfig } from '@/store/modules/config';
import { useProfile } from '@/store/modules/profile';
import { useFeatureFlag } from '@/store/modules/featureFlag';

import AsideSlotTemplate from '@/components/layouts/chats/AsideSlotTemplate/index.vue';
import AsideSlotTemplateSection from '@/components/layouts/chats/AsideSlotTemplate/Section.vue';
import ModalListTriggeredFlows from '@/components/chats/FlowsTrigger/ModalListTriggeredFlows.vue';
import ModalAddNewContact from '@/components/chats/FlowsTrigger/ModalAddNewContact.vue';
import ModalSendFlow from '@/components/chats/FlowsTrigger/ModalSendFlow.vue';
import ModalRemoveSelectedContacts from '@/components/chats/FlowsTrigger/ModalRemoveSelectedContacts.vue';
import ModalVariableMapping from '@/components/chats/FlowsTrigger/ModalVariableMapping.vue';
import {
  getAvailableLocalVariables,
  resolveAllValues,
} from '@/utils/localVariables';
import { hasTemplateVariables } from '@/utils/flowTemplates';
import SendFlow from '@/components/chats/FlowsTrigger/SendFlow.vue';
import ModalProgressBarFalse from '@/components/ModalProgressBarFalse.vue';

import callUnnnicAlert from '@/utils/callUnnnicAlert';

import FlowsTriggerAllContacts from './AllContacts.vue';
import FlowsTriggerExpiredWindow from './ExpiredWindow.vue';

import FlowsTrigger from '@/services/api/resources/chats/flowsTrigger.js';
import Group from '@/services/api/resources/settings/group.js';

export default {
  name: 'FlowsTrigger',

  components: {
    AsideSlotTemplate,
    AsideSlotTemplateSection,
    FlowsTriggerAllContacts,
    FlowsTriggerExpiredWindow,
    ModalListTriggeredFlows,
    ModalAddNewContact,
    ModalSendFlow,
    ModalRemoveSelectedContacts,
    ModalVariableMapping,
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
    activeView: 'expired_window',

    search: '',
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
    ...mapState(useFeatureFlag, {
      activeFeatures: (store) => store.featureFlags.active_features,
    }),
    ...mapState(useConfig, {
      project: (store) => store.project,
    }),
    ...mapState(useRooms, {
      room: (store) => store.activeRoom,
    }),
    ...mapState(useProfile, ['me']),

    enableExpiredWindowFeature() {
      return this.activeFeatures.includes('weniChatsFlow24hWindow');
    },

    hasCachedTemplateVariables() {
      return hasTemplateVariables(this.cachedTemplate?.templates ?? []);
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

    searchGroup() {
      return this.listOfGroups.filter((item) =>
        item.name.toUpperCase().includes(this.search.toUpperCase()),
      );
    },
    listOfGroupAndContactsSelected() {
      return this.selected.concat(this.selectedGroup);
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
          this.groupList();
        }
      },
    },
    projectUuidFlow: {
      immediate: true,
      handler(newProjectUuidFlow) {
        if (newProjectUuidFlow) {
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

      if (hasTemplateVariables(cachedTemplate?.templates ?? [])) {
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
      await this.$refs.allContacts?.contactList(null, true);

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

  &__view-switch {
    flex: 0 0 auto;
  }

  &__view {
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
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
