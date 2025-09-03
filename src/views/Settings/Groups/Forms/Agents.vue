<template>
  <section :class="{ 'groups-agents-form': true, 'is-editing': isEditing }">
    <h2 class="groups-agents-form__title">
      {{ $t('config_chats.groups.agents_form.title') }}
    </h2>
    <fieldset>
      <UnnnicLabel
        :label="$t('config_chats.groups.agents_form.field.agents.label')"
      />
      <UnnnicSelectSmart
        v-model="selectedAgent"
        :options="agentsNames"
        autocomplete
        autocompleteIconLeft
        autocompleteClearOnFocus
        @update:model-value="selectAgent"
      />
    </fieldset>
    <section
      v-if="group.agents?.length"
      class="groups-agents-form__agents"
    >
      <SelectedMemberExpanded
        v-for="agent in group.agents"
        :key="agent.uuid"
        :agentName="
          agent.user
            ? `${agent.user?.first_name} ${agent.user?.last_name}`
            : agent.user_name
        "
        :agentEmail="agent.user?.email || agent.user_email"
        :queuesOptions="queuesOptions"
        :agentQueues="agent.queues"
        @remove="removeAgent(agent.uuid)"
        @update:agent-queues="agent.queues = $event"
      />
    </section>
  </section>
</template>

<script>
import SelectedMemberExpanded from '@/components/settings/forms/SelectedMemberExpanded.vue';

import Project from '@/services/api/resources/settings/project';

export default {
  name: 'ProjectGroupAgentsForm',
  components: {
    SelectedMemberExpanded,
  },
  props: {
    isEditing: {
      type: Boolean,
      default: false,
    },
    modelValue: {
      type: Object,
      required: true,
    },
    queuesOptions: {
      type: Array,
      default: () => [],
    },
  },
  emits: ['update:modelValue', 'changeValid', 'remove-agent'],
  data() {
    return {
      selectedAgent: [],
      agents: [],
      agentsPage: 0,
      agentsLimitPerPage: 50,
    };
  },
  computed: {
    group: {
      get() {
        return this.modelValue;
      },
      set(value) {
        this.$emit('update:modelValue', value);
      },
    },
    agentsNames() {
      const agentsNames = [
        {
          value: '',
          label: this.$t(
            'config_chats.groups.agents_form.field.agents.placeholder',
          ),
        },
      ];

      this.agents.forEach((agent) => {
        const { uuid, user } = agent;

        agentsNames.push({
          value: uuid,
          label:
            user.first_name || user.last_name
              ? `${user.first_name} ${user.last_name}`
              : user.email,
        });
      });

      return agentsNames;
    },
    valid() {
      return !!this.group.agents?.length;
    },
  },

  watch: {
    valid() {
      this.$emit('changeValid', this.valid);
    },
  },

  mounted() {
    this.listAgentsOptions();
  },

  methods: {
    async listAgentsOptions() {
      let hasNext = false;
      try {
        const offset = this.agentsPage * this.agentsLimitPerPage;
        const { results, next } = await Project.agents(
          offset,
          this.agentsLimitPerPage,
        );
        const agentsWithQueues = results.map((agent) => ({
          ...agent,
          queues: [],
        }));
        this.agentsPage += 1;
        this.agents = this.agents.concat(agentsWithQueues);

        hasNext = next;
      } finally {
        if (hasNext) {
          this.listAgentsOptions();
        }
      }
    },

    selectAgent(selectedAgent) {
      if (selectedAgent.length > 0) {
        const agent = this.agents.find((agent) => {
          const { uuid } = agent;

          return uuid === selectedAgent[0].value;
        });
        this.addAgent(agent);
      }
    },

    addAgent(agent) {
      if (!agent) return;
      agent.queues = this.queuesOptions;
      const agents = this.group.agents.some(
        (mappedAgent) =>
          mappedAgent.permission === agent.uuid ||
          agent.user.email ===
            (mappedAgent.user_email || mappedAgent.user.email),
      )
        ? this.group.agents
        : [{ ...agent, new: true }, ...this.group.agents];

      this.group.agents = agents;

      this.selectedAgent = [this.agentsNames[0]];
    },
    removeAgent(agentUuid) {
      const agent = this.group.agents.find((agent) => agent.uuid === agentUuid);

      if (this.isEditing && !agent?.new) this.$emit('remove-agent', agent);

      this.group.agents = this.group.agents.filter(
        (sector) => sector.uuid !== agentUuid,
      );
    },
    photo(link) {
      if (![null, undefined, ''].includes(link)) {
        const getOnlyPhoto = link.split('?')[0];
        return getOnlyPhoto;
      }
      return link;
    },
  },
};
</script>

<style lang="scss" scoped>
.groups-agents-form {
  display: flex;
  flex-direction: column;
  gap: $unnnic-spacing-sm;

  &.is-editing {
    margin-top: -$unnnic-spacing-sm;
  }

  &__agents {
    display: flex;
    flex-direction: column;
    gap: $unnnic-spacing-sm;
  }

  &__title {
    font-family: $unnnic-font-family-secondary;
    margin-top: $unnnic-spacing-sm;
    font-weight: $unnnic-font-weight-bold;
    color: $unnnic-color-neutral-dark;
    font-size: $unnnic-font-size-body-lg;
    line-height: $unnnic-line-height-large * 1.5;
  }

  :deep(.unnnic-form__label) {
    margin-top: 0;
    margin-bottom: $unnnic-spacing-xs;
  }
}

fieldset {
  border: none;
  padding: 0;
  margin: 0;
}
</style>
