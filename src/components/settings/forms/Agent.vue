<template>
  <section class="form-agent">
    <section class="section">
      <p class="title">
        {{ $t('agents.add.title') }}
        <unnnic-tool-tip enabled side="right" :text="$t('new_sector.agent_tip')">
          <unnnic-icon-svg icon="information-circle-4" scheme="neutral-soft" size="sm" />
        </unnnic-tool-tip>
      </p>

      <section class="controls">
        <unnnic-autocomplete
          v-model="search"
          :data="agentsNames"
          @choose="chooseAgent"
          :label="$t('agents.add.select.label')"
          :placeholder="$t('agents.add.select.placeholder')"
          iconLeft="search-1"
          iconRight="keyboard-return-1"
          open-with-focus
          highlight
          class="input"
        />
        <!-- <unnnic-button
          type="secondary"
          :text="$t('agents.add.button')"
          :disabled="!selectAgent"
          @click="emitSelectedAgent"
        /> -->
      </section>
    </section>

    <section v-if="selectedAgents.length > 0" class="form-agent__agents">
      <selected-member
        v-for="agent in selectedAgents"
        :key="agent.uuid"
        :name="agent.user.first_name + ' ' + agent.user.last_name"
        :email="agent.user.email"
        :avatar-url="photo(agent.user.photo_url)"
        @remove="remove(agent.uuid)"
        role-name="Agente"
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
    search: '',
    selectAgent: null,
    agent: {
      uuid: '',
    },
  }),

  computed: {
    agentsNames() {
      const agents = this.agents.map((agent) => {
        const { email, first_name, last_name } = agent.user;

        return first_name || last_name ? `${first_name} ${last_name}` : email;
      });
      const filterDuplicateNames = agents.filter((item, index) => agents.indexOf(item) === index);
      // eslint-disable-next-line func-names
      // const mapped = filterDuplicateNames.map((el, i) => ({ index: i, value: el.toLowerCase() }));
      // const sort = mapped.sort((a, b) => +(a.value > b.value) || +(a.value === b.value) - 1);
      // const result = sort.map((el) => filterDuplicateNames[el.index]);
      return filterDuplicateNames;
      // return agents.filter((agent) => agent.includes(this.search));
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
        const { first_name, last_name, email } = agent.user;
        const name = `${first_name} ${last_name}`;

        return name === selected || email === selected;
      });
      this.agent = agent;
      this.emitSelectedAgent();
    },
    emitSelectedAgent() {
      if (!this.agent.uuid) return;

      this.$emit('select', this.agent);
      this.search = '';
    },
    validate() {
      return this.selectedAgents.length > 0;
    },
    photo(link) {
      const getOnlyPhoto = link.split('?')[0];
      return getOnlyPhoto;
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

  .controls {
    display: flex;
    align-items: flex-end;
    gap: 1rem;

    .input {
      flex: 1 1;
    }
  }

  &__agents {
    display: flex;
    flex-direction: column;
    gap: $unnnic-spacing-stack-xs;
  }
}
</style>
