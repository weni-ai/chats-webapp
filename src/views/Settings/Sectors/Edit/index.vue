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
          v-if="sector.uuid"
          v-model="sector"
          isEditing
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

    tabIds() {
      return this.tabs.map((tab) => tab.id);
    },
  },

  async created() {
    const { params, query } = this.$route;

    this.getCurrentSector(params.uuid).then(() => this.handlerSectorData());
    this.updateTab(query.tab);
  },

  unmounted() {
    useSettings().$patch({ currentSector: null });
  },

  methods: {
    ...mapActions(useSettings, ['getCurrentSector']),

    ...mapActions(useConfig, [
      'setCopilotActive',
      'setCopilotCustomRulesActive',
      'setCopilotCustomRules',
    ]),

    updateTab(newTab) {
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

    handlerSectorData() {
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
      } = this.currentSector;
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
