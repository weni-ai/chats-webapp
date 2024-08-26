<template>
  <section
    v-if="currentSector"
    class="sector-edit-view"
  >
    <SectorEditHeader
      data-testid="sector-edit-view-header"
      :sectorName="currentSector.name"
    />

    <UnnnicTab
      data-testid="sector-edit-view-tab-list"
      :tabs="tabIds"
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
        <FormSector
          v-model="sector"
          isEditing
          :managers="projectManagers"
          @remove-manager="removeManager"
          @validate="isSectorFormValid = $event"
        />
      </template>
      <template #tab-panel-extra_options> </template>
      <template #tab-panel-queues> </template>
      <template #tab-panel-quick_messages> </template>
    </UnnnicTab>
  </section>
</template>

<script>
import { mapActions, mapState } from 'pinia';

import { useSettings } from '@/store/modules/settings';

import SectorEditHeader from './SectorEditHeader.vue';
import FormSector from '@/components/settings/forms/Sector.vue';

import { useConfig } from '@/store/modules/config';

import Sector from '@/services/api/resources/settings/sector';
import Project from '@/services/api/resources/settings/project';

export default {
  name: 'EditSector',

  components: {
    SectorEditHeader,
    FormSector,
  },

  data() {
    return {
      activeTab: '',
      sector: {
        uuid: '',
        name: '',
        can_trigger_flows: '',
        can_edit_custom_fields: '',
        sign_messages: '',
        workingDay: {
          start: '',
          end: '',
          dayOfWeek: 'week-days',
        },
        managers: [],
        maxSimultaneousChatsByAgent: '',
      },
      projectManagers: [],
      removedManagers: [],
    };
  },

  computed: {
    ...mapState(useSettings, ['currentSector']),

    tabs() {
      const { $t } = this;
      return [
        { name: $t('sector.general'), id: 'general' },
        { name: $t('sector.extra_options'), id: 'extra_options' },
        { name: $t('sector.queues'), id: 'queues' },
        { name: $t('quick_message'), id: 'quick_messages' },
      ];
    },

    tabNames() {
      return this.tabs.map((tab) => tab.name);
    },
    tabIds() {
      return this.tabs.map((tab) => tab.id);
    },
  },

  created() {
    const { params, query } = this.$route;

    this.getCurrentSector(params.uuid);
    this.updateTab(query.tab);

    this.getSector();
    this.getManagers().then(() => {
      this.initialSectorEdit = JSON.stringify(this.sector);
    });
    this.listProjectManagers();
  },

  beforeMount() {},

  methods: {
    ...mapActions(useSettings, ['getCurrentSector']),

    ...mapActions(useConfig, [
      'setCopilotActive',
      'setCopilotCustomRulesActive',
      'setCopilotCustomRules',
    ]),

    updateTab(newTab) {
      // Click chegando aqui quando o select ta aberto
      const newActiveTab = this.tabs.find((tab) =>
        [tab.name, tab.id].includes(newTab),
      );

      if (!newActiveTab) return;

      this.activeTab = newActiveTab;

      if (this.activeTab) {
        this.$router.replace({
          name: this.$route.name,
          query: {
            tab: this.activeTab.id,
          },
        });
      }
    },

    normalizeTime(time) {
      const timeFormat = /^(?<time>(\d\d):(\d\d))/;
      return time.match(timeFormat)?.groups?.time || time;
    },

    async getManagers() {
      const sectorUuid = this.$route.params.uuid;
      const managers = await Sector.managers(sectorUuid);
      this.sector.managers = managers.results.map((manager) => ({
        ...manager,
        removed: false,
      }));
    },

    async listProjectManagers() {
      const managers = (await Project.managers()).results.concat(
        (await Project.admins()).results,
      );
      this.projectManagers = managers;
    },
    async removeManager(managerUuid) {
      await Sector.removeManager(managerUuid);
      this.removeManagerFromTheList(managerUuid);
    },
    removeManagerFromTheList(managerUuid) {
      const manager = this.sector.managers.find(
        (manager) => manager.uuid === managerUuid,
      );
      if (!manager) return;

      this.removedManagers.push(manager);
      this.sector.managers = this.sector.managers.filter(
        (manager) => manager.uuid !== managerUuid,
      );
    },
    async getSector() {
      const sectorUuid = this.$route.params.uuid;
      const sector = await Sector.find(sectorUuid);
      const {
        name,
        can_trigger_flows,
        can_edit_custom_fields,
        config,
        sign_messages,
        rooms_limit,
        uuid,
        work_end,
        work_start,
      } = sector;
      this.sector = {
        ...this.sector,
        uuid,
        name,
        can_trigger_flows,
        can_edit_custom_fields,
        config,
        sign_messages,
        workingDay: {
          start: this.normalizeTime(work_start),
          end: this.normalizeTime(work_end),
        },
        maxSimultaneousChatsByAgent: rooms_limit.toString(),
      };
      this.setCopilotActive(this.sector.config?.can_use_chat_completion);
      this.setCopilotCustomRulesActive(this.sector.config?.can_input_context);
      this.setCopilotCustomRules(this.sector.config?.completion_context);
    },
  },
};
</script>

<style lang="scss" scoped>
.sector-edit-view {
  display: grid;
  gap: $unnnic-spacing-sm;
}
</style>
