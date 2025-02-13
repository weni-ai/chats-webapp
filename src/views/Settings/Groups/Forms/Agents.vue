<template>
  <section class="groups-agents-form">
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
      v-if="group.agents.length"
      class="groups-agents-form__agents"
    >
      <SelectedMember
        v-for="agent in group.agents"
        :key="agent.uuid"
        :name="`${agent.user?.first_name} ${agent.user?.last_name}`"
        :email="agent.user?.email"
        :avatarUrl="photo(agent.user?.photo_url)"
        :roleName="$t('agent')"
        @remove="removeAgent(agent.uuid)"
      />
    </section>
  </section>
</template>

<script>
import SelectedMember from '@/components/settings/forms/SelectedMember.vue';

import Group from '@/services/api/resources/settings/group';

export default {
  name: 'ProjectGroupAgentsForm',
  components: {
    SelectedMember,
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
  },
  emits: ['update:modelValue', 'changeValid'],
  data() {
    return {
      selectedAgent: [],
      agents: [
        {
          name: 'Agent A',
          uuid: '1',
          user: {
            first_name: 'Agent',
            last_name: 'Doe',
            email: 'agentdoe@email.com',
          },
        },
      ],
      toAddAgents: [],
      toRemoveAgents: [],
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

      this.agents.forEach((sector) => {
        const { name, uuid, project } = sector;

        agentsNames.push({
          value: uuid,
          label: project?.name || name, // show project name or sector name
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
    this.listAgents();

    if (this.isEditing) this.listGroupAgents();
  },

  methods: {
    listAgents() {},
    listGroupAgents() {},

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
      const agents = this.group.agents.some(
        (mappedAgent) => mappedAgent.uuid === agent.uuid,
      )
        ? this.group.agents
        : [{ ...agent, new: true }, ...this.group.agents];

      this.group.agents = agents;

      // if (this.isEditing)
      this.selectedAgent = [this.agentsNames[0]];
    },
    removeAgent(agentUuid) {
      // if (this.isEditing)
      const agent = this.group.agents.find((agent) => agent.uuid === agentUuid);

      this.toRemoveAgents.push(agent);
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
