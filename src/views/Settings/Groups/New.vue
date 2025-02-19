<template>
  <UnnnicDrawer
    v-show="!showConfirmDiscartChangesModal"
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
    @close="closeDrawer"
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

  <DiscartChangesModal
    :showModal="showConfirmDiscartChangesModal"
    :title="$t('config_chats.groups.discart.title')"
    :text="$t('config_chats.groups.discart.text')"
    data-testid="discart-changes-modal"
    @secondary-button-click="showConfirmDiscartChangesModal = false"
    @primary-button-click="$emit('close')"
  />
</template>

<script>
import General from './Forms/General.vue';
import Projects from './Forms/Projects.vue';
import Agents from './Forms/Agents.vue';

import DiscartChangesModal from '@/views/Settings/DiscartChangesModal.vue';

export default {
  name: 'NewProjectGroupDrawer',
  components: {
    General,
    Projects,
    Agents,
    DiscartChangesModal,
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
      showConfirmDiscartChangesModal: false,
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
    showDiscartQuestion() {
      const { name, managers, maxSimultaneousChatsByAgent, sectors, agents } =
        this.group;

      return !!(
        name ||
        sectors.length ||
        agents.length ||
        Number(maxSimultaneousChatsByAgent || 0) ||
        managers.length
      );
    },
  },
  methods: {
    updateIsValid(key, value) {
      this.isValid[key] = value;
    },
    closeDrawer(forceClose) {
      if (this.showDiscartQuestion && !forceClose) {
        this.showConfirmDiscartChangesModal = true;
      } else {
        this.$emit('close');
      }
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
