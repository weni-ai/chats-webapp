<template>
  <UnnnicDrawer
    ref="editProjectGroupDrawer"
    :modelValue="show"
    :title="$t('config_chats.groups.new.title')"
    :primaryButtonText="$t('save')"
    :secondaryButtonText="$t('cancel')"
    size="xl"
    @primary-button-click="finish()"
    @secondary-button-click="$refs.editProjectGroupDrawer.close()"
    @close="$emit('close')"
  >
    <template #content>
      <UnnnicTab
        :tabs="tabsIds"
        :activeTab="activeTab?.id"
        @change="updateTab"
      >
        <template
          v-for="tab in tabs"
          #[`tab-head-${tab.id}`]
          :key="`tab-head-${tab.id}`"
        >
          {{ tab.name }}
        </template>

        <template #tab-panel-general>
          <General />
        </template>
        <template #tab-panel-projects>
          <Projects />
        </template>
        <template #tab-panel-agents>
          <Agents />
        </template>
      </UnnnicTab>
    </template>
  </UnnnicDrawer>
</template>

<script>
import General from './Forms/General.vue';
import Projects from './Forms/Projects.vue';
import Agents from './Forms/Agents.vue';

export default {
  name: 'EditProjectGroupDrawer',
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
    projectGroup: {
      type: Object,
      required: true,
    },
  },
  emits: ['close'],
  data() {
    return {
      activeTab: { id: 'general' },
    };
  },
  computed: {
    tabs() {
      return [
        { name: this.$t('config_chats.groups.general'), id: 'general' },
        { name: this.$t('config_chats.groups.projects'), id: 'projects' },
        { name: this.$t('config_chats.groups.agents'), id: 'agents' },
      ];
    },
    tabsIds() {
      return this.tabs.map((tab) => tab.id);
    },
  },
  methods: {
    updateTab(newTab) {
      const newActiveTab = this.tabs.find((tab) =>
        [tab.name, tab.id].includes(newTab),
      );

      if (!newActiveTab) return;

      this.activeTab = newActiveTab;
    },
    finish() {},
  },
};
</script>

<style lang="scss" scoped></style>
