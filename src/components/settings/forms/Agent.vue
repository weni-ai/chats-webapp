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
            v-model="search"
            class="input"
            :options="agentsNames"
            autocomplete
            autocompleteIconLeft
            autocompleteClearOnFocus
            @update:model-value="chooseAgent"
          />
        </div>
        <!-- <unnnic-button
          type="secondary"
          :text="$t('agents.add.button')"
          :disabled="!selectAgent"
          @click="emitSelectedAgent"
        /> -->
      </section>
    </section>

    <section
      v-if="selectedAgents.length > 0"
      class="form-agent__agents"
    >
      <SelectedMember
        v-for="agent in selectedAgents"
        :key="agent.uuid"
        :name="agent.user.first_name + ' ' + agent.user.last_name"
        :email="agent.user.email"
        :avatarUrl="photo(agent.user.photo_url)"
        @remove="remove(agent.uuid)"
        roleName="Agente"
      />
    </section>
  </section>
</template>

<script>
import SelectedMember from '@/components/settings/forms/SelectedMember';

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
    value: {
      type: Array,
      default: () => [],
    },
  },

  data: () => ({
    search: [],
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
          value: uuid,
          label: first_name || last_name ? `${first_name} ${last_name}` : email,
        });
      });

      return agentsNames;
    },
    selectedAgents: {
      get() {
        return this.value;
      },
      set(agents) {
        this.$emit('input', agents);
      },
    },
  },

  methods: {
    remove(agentUuid) {
      this.$emit('remove', agentUuid);
    },
    chooseAgent(selected) {
      this.selectAgent = selected;
      const agent = this.agents.find((agent) => {
        const { uuid } = agent;

        return uuid === selected[0].value;
      });
      this.agent = agent;
      this.emitSelectedAgent();
    },
    emitSelectedAgent() {
      if (!this.agent.uuid) return;

      this.$emit('select', this.agent);
      this.search = [];
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

  watch: {
    selectedAgents: {
      deep: true,
      immediate: true,
      handler() {
        this.$emit('validate', this.validate());
      },
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
