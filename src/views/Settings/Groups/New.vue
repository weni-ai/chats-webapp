<template>
  <UnnnicDrawer
    ref="newProjectGroupDrawer"
    :modelValue="show"
    :title="$t('config_chats.groups.new.title')"
    :primaryButtonText="activePageIndex === 2 ? $t('save') : $t('continue')"
    :secondaryButtonText="activePageIndex === 0 ? $t('cancel') : $t('back')"
    :disabledPrimaryButton="!isValid[activePageKey]"
    size="xl"
    @primary-button-click="
      activePageIndex === 2 ? finish() : (activePageIndex = activePageIndex + 1)
    "
    @secondary-button-click="
      activePageIndex === 0
        ? $refs.newProjectGroupDrawer.close()
        : (activePageIndex = activePageIndex - 1)
    "
    @close="$emit('close')"
  >
    <template #content>
      <UnnnicNavigator
        :pages="newGroupsPages"
        :activePage="activePage"
      />
      <section class="form">
        <General
          v-show="activePage === $t('config_chats.groups.general')"
          v-model="group"
          @change-valid="updateIsValid('general', $event)"
        />
        <Projects
          v-show="activePage === $t('config_chats.groups.projects')"
          v-model="group"
          @change-valid="updateIsValid('projects', $event)"
        />
        <Agents
          v-show="activePage === $t('config_chats.groups.agents')"
          v-model="group"
          @change-valid="updateIsValid('agents', $event)"
        />
      </section>
    </template>
  </UnnnicDrawer>
</template>

<script>
import General from './Forms/General.vue';
import Projects from './Forms/Projects.vue';
import Agents from './Forms/Agents.vue';

export default {
  name: 'NewProjectGroupDrawer',
  components: {
    General,
    Projects,
    Agents,
  },
  props: {
    show: {
      type: Boolean,
      required: true,
    },
  },
  emits: ['close'],
  data() {
    return {
      group: {
        name: '',
        managers: [],
        maxSimultaneousChatsByAgent: '',
        sectors: [],
        agents: [],
      },
      activePageIndex: 0,
      newGroupsPages: [
        this.$t('config_chats.groups.general'),
        this.$t('config_chats.groups.projects'),
        this.$t('config_chats.groups.agents'),
      ],
      isValid: {
        general: false,
        projects: false,
        agents: false,
      },
    };
  },
  computed: {
    activePage() {
      return this.newGroupsPages[this.activePageIndex];
    },
    activePageKey() {
      const mapper = {
        0: 'general',
        1: 'projects',
        2: 'agents',
      };
      return mapper[this.activePageIndex];
    },
  },
  methods: {
    updateIsValid(key, value) {
      this.isValid[key] = value;
    },
    finish() {},
  },
};
</script>

<style lang="scss" scoped>
:deep(.unnnic-navigator-pages__page) {
  max-width: 100%;
}
</style>
