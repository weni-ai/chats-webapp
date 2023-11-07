<template>
  <main v-if="details">
    <aside-slot-template-section>
      <h2>
        {{ `${$t('discussions.title')} ${$t('about')} ${details?.contact}` }}
      </h2>
      <p>{{ `${$t('discussions.about.started_in')} ${discussionStartDate}` }}</p>
    </aside-slot-template-section>
    <aside-slot-template-section>
      <h2>
        {{ $t('discussions.about.agents_involved') }}
      </h2>
      <ul>
        <li v-for="user in agentsInvolved" :key="getUserFullName(user)">
          {{ `${getUserFullName(user)} ${getUserRoleTreated(user)}` }}
        </li>
      </ul>

      <unnnic-button
        :text="$t('discussions.about.add_agent')"
        iconLeft="add-1"
        type="secondary"
        @click="handleAddAgentModal"
        :disabled="this.agentsInvolved?.length >= 5"
      />

      <unnnic-modal
        v-if="isAddAgentModalOpen"
        @close="handleAddAgentModal"
        class="add-agent-modal"
        :text="$t('discussions.add_agents.title')"
        :description="$t('discussions.add_agents.description')"
      >
        <div class="add-agent-modal__input">
          <unnnic-label :label="$t('discussions.add_agents.select_agent')" />
          <unnnic-select-smart
            v-model="agentSelected"
            :options="agentsToSelect"
            autocomplete
            autocompleteIconLeft
            autocompleteClearOnFocus
          />
        </div>
        <selected-member
          v-if="agentSelected[0]"
          :name="agentSelected[0].label"
          :email="agentSelected[0].description"
          :photoUrl="agentSelected[0].photoUrl"
          @remove="agentSelected = []"
        />
        <template #options>
          <unnnic-button :text="$t('cancel')" type="secondary" @click="handleAddAgentModal" />
          <unnnic-button
            :text="$t('add')"
            type="primary"
            :disabled="!agentSelected[0]"
            @click="addAgent"
          />
        </template>
      </unnnic-modal>
    </aside-slot-template-section>
  </main>
</template>

<script>
import moment from 'moment';

import Project from '@/services/api/resources/settings/project';

import AsideSlotTemplateSection from '@/components/layouts/chats/AsideSlotTemplate/Section';
import SelectedMember from '@/components/settings/forms/SelectedMember';

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

  data: () => {
    return {
      agentsInvolved: null,

      isAddAgentModalOpen: false,
      agentsToSelect: [],
      agentSelected: [],
    };
  },
  async created() {
    const responseAgents = await this.$store.dispatch('chats/discussions/getDiscussionAgents');
    if (responseAgents.results) {
      this.agentsInvolved = responseAgents.results;
    }
    this.agentsToSelect = [{ value: '', label: this.$t('discussions.add_agents.search_agent') }];
  },
  computed: {
    discussionStartDate() {
      const { created_on } = this.details;
      const date = new Date(created_on);

      return `${moment(date).format('HH:mm')} | ${moment(date).format('L')}`;
    },
  },

  methods: {
    getUserFullName(user) {
      const { first_name, last_name } = user;
      return `${first_name} ${last_name}`;
    },

    getUserRoleTreated(user) {
      const roles = {
        0: user.email === this.$store.state.profile.me?.email ? this.$t('you') : '',
        1: this.$t('manager'),
      };
      return roles[user.role] ? `(${roles[user.role]})` : '';
    },

    handleAddAgentModal() {
      this.isAddAgentModalOpen = !this.isAddAgentModalOpen;

      this.agentSelected = [];
    },

    async addAgent() {
      const newAgent = this.agentSelected[0];

      if (!newAgent?.value) {
        return;
      }

      await this.$store.dispatch('chats/discussions/addAgent', {
        user_email: newAgent.value,
      });

      const [first_name, last_name] = newAgent.label.split(' ');
      this.agentsInvolved.push({ first_name, last_name });

      this.handleAddAgentModal();
    },
  },

  watch: {
    async isAddAgentModalOpen(newIsAddAgentModalOpen) {
      if (newIsAddAgentModalOpen && this.agentsToSelect.length < 2) {
        const response = await Project.agents();
        const { results } = response;

        const newAgents = this.agentsToSelect;
        results.forEach(({ user }) =>
          newAgents.push({
            value: user.email,
            label: this.getUserFullName(user),
            description: user.email,
            photoUrl: user.photoUrl,
          }),
        );
        this.agentsToSelect = newAgents;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
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
</style>
