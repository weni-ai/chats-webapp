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

      <UnnnicModal
        v-if="isAddAgentModalOpen"
        class="add-agent-modal"
        data-testid="add-agent-modal"
        :text="$t('discussions.add_agents.title')"
        :description="$t('discussions.add_agents.description')"
        @close="handleAddAgentModal"
      >
        <div class="add-agent-modal__input">
          <UnnnicLabel :label="$t('discussions.add_agents.select_agent')" />
          <UnnnicSelectSmart
            v-model="agentSelected"
            :options="agentsToSelect"
            autocomplete
            autocompleteIconLeft
            autocompleteClearOnFocus
          />
        </div>
        <SelectedMember
          v-if="agentSelected[0]?.description"
          :name="agentSelected[0]?.label"
          :email="agentSelected[0]?.description"
          :photoUrl="agentSelected[0]?.photoUrl"
          @remove="handlingRemoveAgent"
        />
        <template #options>
          <UnnnicButton
            :text="$t('cancel')"
            type="secondary"
            data-testid="cancel-add-agent-modal-button"
            @click="handleAddAgentModal"
          />
          <UnnnicButton
            :text="$t('add')"
            type="primary"
            :disabled="!agentSelected[0]"
            :loading="addAgentLoading"
            @click="handlingAddAgent"
          />
        </template>
      </UnnnicModal>
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
      agentSelected: [],
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
      if (newIsAddAgentModalOpen) {
        const response = await Project.allUsers();
        const { results } = response;

        const agentsInvolvedNames = [
          ...this.agentsInvolved.map((agent) => this.getUserFullName(agent)),
        ];
        const filteredAgents = results.filter(
          (agent) => !agentsInvolvedNames.includes(this.getUserFullName(agent)),
        );

        const newAgents = [this.agentsToSelect[0]];

        filteredAgents.forEach((agent) =>
          newAgents.push({
            value: agent.email,
            label: this.getUserFullName(agent),
            description: agent.email,
            photoUrl: agent.photoUrl,
          }),
        );
        this.agentsToSelect = newAgents;
      }
    },
    details: {
      immediate: true,
      async handler() {
        const responseAgents = await this.getDiscussionAgents();
        if (responseAgents.results) {
          this.agentsInvolved = responseAgents.results;
        }
        this.agentsToSelect = [
          { value: '', label: this.$t('discussions.add_agents.search_agent') },
        ];
      },
    },
  },

  unmounted() {
    this.agentSelected = [];
  },

  methods: {
    ...mapActions(useDiscussions, ['addAgent', 'getDiscussionAgents']),
    handlingRemoveAgent() {
      this.agentSelected = [
        { value: '', label: this.$t('discussions.add_agents.search_agent') },
      ];
    },
    getUserFullName(user) {
      const { first_name, last_name } = user;
      return `${first_name} ${last_name}`;
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

      this.agentSelected = [];
    },

    async handlingAddAgent() {
      const newAgent = this.agentSelected[0];

      if (!newAgent?.value) {
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

  .add-agent-modal {
    :deep(.unnnic-modal-container) {
      .unnnic-modal-container-background {
        width: 50%;

        overflow: visible;

        &-body-description {
          display: grid;
          gap: $unnnic-spacing-sm;

          overflow: visible;

          &-container {
            padding-bottom: 0;

            overflow: visible;
          }
        }
      }
    }

    &__input {
      text-align: start;
    }
  }
}
</style>
