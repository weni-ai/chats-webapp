<template>
  <section class="form-agent">
    <section class="section">
      <p class="title">
        {{ $t('agents.add.title') }}
        <UnnnicToolTip
          enabled
          side="right"
          :text="$t('new_sector.agent_tip')"
        >
          <UnnnicIconSvg
            icon="information-circle-4"
            scheme="neutral-soft"
            size="sm"
          />
        </UnnnicToolTip>
      </p>

      <section class="controls">
        <div>
          <UnnnicLabel :label="$t('agents.add.select.label')" />
          <UnnnicSelectSmart
            :modelValue="internalSelectedAgents"
            :options="agentsNames"
            autocomplete
            autocompleteIconLeft
            autocompleteClearOnFocus
            enableSearchByValue
            @update:model-value="chooseAgent"
          />
        </div>
      </section>
    </section>

    <section
      v-if="selectedAgents.length > 0"
      class="form-agent__agents"
    >
      <SelectedMember
        v-for="selectedAgent in selectedAgents"
        :key="selectedAgent.uuid"
        :name="
          selectedAgent.user.first_name + ' ' + selectedAgent.user.last_name
        "
        :email="selectedAgent.user.email"
        :roleName="$t('agent')"
        @remove="remove(selectedAgent.uuid)"
      />
    </section>
  </section>
</template>

<script>
import SelectedMember from '@/components/settings/forms/SelectedMember.vue';

export default {
  name: 'FormAgent',

  components: {
    SelectedMember,
  },

  props: {
    agents: {
      type: Array,
      default: () => [],
    },
    sector: {
      type: Object,
      default: () => ({}),
    },
    modelValue: {
      type: Array,
      default: () => [],
    },
  },
  emits: ['update:modelValue', 'validate', 'remove', 'select'],

  data: () => ({
    internalSelectedAgents: [],
    selectAgent: null,
    agent: '',
  }),

  computed: {
    agentsNames() {
      const agentsNames = [
        {
          value: '',
          label: this.$t('agents.add.select.placeholder'),
        },
      ];

      this.agents.forEach((agent) => {
        const {
          user: { email, first_name, last_name },
          uuid,
        } = agent;

        agentsNames.push({
          uuid,
          value: email,
          label: first_name || last_name ? `${first_name} ${last_name}` : email,
        });
      });

      return agentsNames;
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
  },

  methods: {
    remove(agentUuid) {
      this.$emit('remove', agentUuid);
    },
    chooseAgent(selected) {
      // prevent clean after select agent
      if (!selected[0].value) return;
      this.selectAgent = selected;
      const agent = this.agents.find((agent) => {
        const { uuid } = agent;
        return uuid === selected[0].uuid;
      });
      this.agent = agent;
      this.$emit('select', this.agent);
      this.internalSelectedAgents = [
        {
          value: '',
          label: this.$t('agents.add.select.placeholder'),
        },
      ];
    },
    validate() {
      return this.selectedAgents.length > 0;
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
.form-agent {
  .section {
    margin-bottom: 1.5rem;
  }

  .title {
    font-weight: $unnnic-font-weight-bold;
    color: $unnnic-color-neutral-dark;
    font-size: $unnnic-font-size-body-lg;
    line-height: 1.5rem;

    margin-bottom: 0.5rem;
  }

  &__agents {
    display: flex;
    flex-direction: column;
    gap: $unnnic-spacing-stack-xs;
  }
}
</style>
