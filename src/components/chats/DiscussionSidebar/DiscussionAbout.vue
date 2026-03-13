<template>
  <main
    v-if="details"
    class="discussion-about"
  >
    <AsideSlotTemplateSection class="discussion-about__section">
      <h2 class="discussion-about__section__title">
        {{ `${$tc('discussions.title')} ${$t('about')} ${details?.contact}` }}
      </h2>
      <p>
        {{ `${$t('discussions.about.started_in')} ${discussionStartDate}` }}
      </p>
    </AsideSlotTemplateSection>
    <AsideSlotTemplateSection class="discussion-about__section">
      <h2 class="discussion-about__section__title">
        {{ $t('discussions.about.agents_involved') }}
      </h2>
      <ul>
        <li
          v-for="user in agentsInvolved"
          :key="getUserFullName(user)"
        >
          {{ `${getUserFullName(user)} ${getUserRoleTreated(user)}` }}
        </li>
      </ul>

      <UnnnicButton
        :text="$t('discussions.about.add_agent')"
        iconLeft="add-1"
        type="secondary"
        :disabled="agentsInvolved?.length >= 5"
        data-testid="add-agent-button"
        @click="handleAddAgentModal"
      />

      <UnnnicDialog
        v-model:open="isAddAgentModalOpen"
        class="add-agent-modal"
        data-testid="add-agent-modal"
      >
        <UnnnicDialogContent size="medium">
          <UnnnicDialogHeader>
            <UnnnicDialogTitle>
              {{ $t('discussions.add_agents.title') }}
            </UnnnicDialogTitle>
          </UnnnicDialogHeader>
          <section class="add-agent-modal__content">
            <p class="add-agent-modal__description">
              {{ $t('discussions.add_agents.description') }}
            </p>
            <div class="add-agent-modal__input">
              <UnnnicSelect
                v-model="agentSelected"
                :options="agentsToSelect"
                :label="$t('discussions.add_agents.select_agent')"
                :placeholder="$t('discussions.add_agents.search_agent')"
                returnObject
                clearable
                enableSearch
                :search="searchAgent"
                @update:search="searchAgent = $event"
              />
            </div>
            <SelectedMember
              v-if="agentSelected?.description"
              :name="agentSelected?.label"
              :email="agentSelected?.description"
              :photoUrl="agentSelected?.photoUrl"
              @remove="handlingRemoveAgent"
            />
          </section>
          <UnnnicDialogFooter>
            <UnnnicButton
              :text="$t('cancel')"
              type="secondary"
              data-testid="cancel-add-agent-modal-button"
              @click="handleAddAgentModal"
            />
            <UnnnicButton
              :text="$t('add')"
              type="primary"
              :disabled="!agentSelected"
              :loading="addAgentLoading"
              @click="handlingAddAgent"
            />
          </UnnnicDialogFooter>
        </UnnnicDialogContent>
      </UnnnicDialog>
    </AsideSlotTemplateSection>
  </main>
</template>

<script>
import moment from 'moment';

import Project from '@/services/api/resources/settings/project';

import AsideSlotTemplateSection from '@/components/layouts/chats/AsideSlotTemplate/Section.vue';
import SelectedMember from '@/components/settings/forms/SelectedMember.vue';

import { mapActions, mapState } from 'pinia';
import { useDiscussions } from '@/store/modules/chats/discussions';

import { useProfile } from '@/store/modules/profile';
export default {
  name: 'DiscussionAbout',

  components: {
    AsideSlotTemplateSection,
    SelectedMember,
  },

  props: {
    details: {
      type: Object,
      required: true,
    },
  },

  data() {
    return {
      agentsInvolved: null,

      isAddAgentModalOpen: false,
      addAgentLoading: false,
      agentsToSelect: [],
      agentSelected: null,
      searchAgent: '',
    };
  },

  computed: {
    ...mapState(useProfile, ['me']),
    discussionStartDate() {
      const { created_on } = this.details;
      const date = new Date(created_on);

      return `${moment(date).format('HH:mm')} | ${moment(date).format('L')}`;
    },
  },

  watch: {
    async isAddAgentModalOpen(newIsAddAgentModalOpen) {
      if (!newIsAddAgentModalOpen) {
        this.agentSelected = null;
        return;
      }
      const response = await Project.allUsers();
      const { results } = response;

      const agentsInvolvedNames = [
        ...this.agentsInvolved.map((agent) => this.getUserFullName(agent)),
      ];
      const filteredAgents = results.filter(
        (agent) => !agentsInvolvedNames.includes(this.getUserFullName(agent)),
      );

      const newAgents = [];

      filteredAgents.forEach((agent) =>
        newAgents.push({
          value: agent.email,
          label: this.getUserFullName(agent),
          description: agent.email,
          photoUrl: agent.photoUrl,
        }),
      );
      this.agentsToSelect = newAgents;
    },
    details: {
      immediate: true,
      async handler() {
        const responseAgents = await this.getDiscussionAgents();
        if (responseAgents.results) {
          this.agentsInvolved = responseAgents.results;
        }
        this.agentsToSelect = [];
      },
    },
  },

  unmounted() {
    this.agentSelected = null;
  },

  methods: {
    ...mapActions(useDiscussions, ['addAgent', 'getDiscussionAgents']),
    handlingRemoveAgent() {
      this.agentSelected = null;
    },
    getUserFullName(user) {
      const { first_name, last_name } = user;
      return `${first_name} ${last_name}`.trim() || user.email;
    },

    getUserRoleTreated(user) {
      const roles = {
        0: user.email === this.me?.email ? this.$t('you') : '',
        1: this.$t('manager'),
      };
      return roles[user.role] ? `(${roles[user.role]})` : '';
    },

    handleAddAgentModal() {
      this.isAddAgentModalOpen = !this.isAddAgentModalOpen;

      this.agentSelected = null;
    },

    async handlingAddAgent() {
      const newAgent = this.agentSelected?.value;

      if (!newAgent) {
        return;
      }

      try {
        this.addAgentLoading = true;
        const responseAgent = await this.addAgent({
          user_email: newAgent.value,
        });

        this.agentsInvolved.push(responseAgent);

        this.handleAddAgentModal();
        this.addAgentLoading = false;
      } catch (error) {
        console.error(
          'An error occurred when trying to add agent to discussion:',
          error,
        );
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.discussion-about {
  &__section {
    padding: $unnnic-space-2;

    display: grid;
    gap: $unnnic-spacing-xs;

    color: $unnnic-color-neutral-dark;
    font-size: $unnnic-font-size-body-gt;
    font-weight: $unnnic-font-weight-regular;

    &__title {
      font-size: $unnnic-font-size-body-gt;
      font-weight: $unnnic-font-weight-bold;
    }
  }
}

.add-agent-modal {
  &__content {
    display: grid;
    gap: $unnnic-spacing-sm;
    padding: $unnnic-space-6;
    overflow: visible;
  }

  &__description {
    color: $unnnic-color-neutral-dark;
    font: $unnnic-font-body;
    margin: 0;
  }

  &__input {
    text-align: start;
  }
}
</style>
