<template>
  <section class="form-agent">
    <UnnnicSelect
      v-model="agentSelection"
      :options="agentsNames"
      :label="$t('agents.add.select.label')"
      :placeholder="$t('agents.add.select.placeholder')"
      returnObject
      clearable
      enableSearch
      :search="searchAgent"
      @update:search="searchAgent = $event"
    />

    <TagGroup
      v-if="selectedAgents.length > 0"
      :tags="selectedAgentsTags"
      disabledTag
      hasCloseIcon
      @close="(agent) => remove(agent.uuid)"
    />
  </section>
</template>

<script>
import TagGroup from '@/components/TagGroup.vue';

export default {
  name: 'FormAgent',

  components: {
    TagGroup,
  },

  props: {
    agents: {
      type: Array,
      default: () => [],
    },
    modelValue: {
      type: Array,
      default: () => [],
    },
  },
  emits: ['update:modelValue', 'validate', 'remove', 'select'],

  data() {
    return {
      agentSelection: null,
      searchAgent: '',
    };
  },

  computed: {
    selectedAgentsTags() {
      return this.selectedAgents.map((agent) => {
        const {
          user: { first_name, last_name, email },
        } = agent;
        const agentName = `${first_name} ${last_name}`.trim();
        const formattedName = agentName ? `${agentName} (${email})` : email;
        return { uuid: agent.uuid, name: formattedName };
      });
    },
    agentsNames() {
      return this.agents.map((agent) => {
        const {
          user: { email, first_name, last_name },
          uuid,
        } = agent;

        return {
          uuid,
          value: email,
          label: first_name || last_name ? `${first_name} ${last_name}` : email,
        };
      });
    },
    selectedAgents: {
      get() {
        return this.modelValue;
      },
      set(agents) {
        this.$emit('update:modelValue', agents);
      },
    },
  },

  watch: {
    selectedAgents: {
      deep: true,
      immediate: true,
      handler() {
        this.$emit('validate', this.validate());
      },
    },
    agentSelection(newVal) {
      if (!newVal?.value) {
        return;
      }
      const agent = this.agents.find((agent) => agent.uuid === newVal.uuid);
      if (!agent) {
        return;
      }
      this.$emit('select', agent);
      this.$nextTick(() => {
        this.agentSelection = null;
      });
    },
  },

  methods: {
    remove(agentUuid) {
      this.$emit('remove', agentUuid);
    },
    validate() {
      return this.selectedAgents.length > 0;
    },
  },
};
</script>
