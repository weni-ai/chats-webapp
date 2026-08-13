<template>
  <section class="settings-page">
    <UnnnicPageHeader :title="$t('config_chats.title')">
      <template #actions>
        <UnnnicButton
          v-if="showNewSectorButton"
          :text="$t('config_chats.new_sector')"
          type="primary"
          iconLeft="add"
          @click="openNewSectorDrawer"
        />
        <UnnnicButton
          v-if="showNewGroupButton"
          :text="$t('config_chats.new_group')"
          type="primary"
          iconLeft="add"
          @click="openNewGroupDrawer"
        />
      </template>
      <template #tabs>
        <UnnnicTabs
          defaultValue="general"
          :modelValue="activeTab"
          class="settings-page__tabs"
          @update:model-value="updateTab"
        >
          <UnnnicTabsList>
            <UnnnicTabsTrigger
              v-for="tab in settingsTabs"
              :key="tab.value"
              :value="tab.value"
            >
              <span class="settings-page__tab-label">
                {{ tab.label }}
                <UnnnicTag
                  v-if="tab.value === 'desk_copilot' && showDeskCopilotNewBadge"
                  :text="$t('config_chats.desk_copilot.new_badge')"
                  type="next"
                  scheme="teal"
                  data-testid="desk-copilot-new-tag"
                />
              </span>
            </UnnnicTabsTrigger>
          </UnnnicTabsList>
          <UnnnicTabsContent value="general">
            <section class="settings-page__content">
              <SettingsProjectOptions />
              <CustomBreaks v-if="!isSecondaryProject" />
            </section>
          </UnnnicTabsContent>
          <UnnnicTabsContent value="sectors">
            <section class="settings-page__content">
              <SectorsList
                v-if="activeTab === 'sectors'"
                @open-new-sector-modal="openNewSectorDrawer"
              />
            </section>
          </UnnnicTabsContent>
          <UnnnicTabsContent value="groups">
            <section class="settings-page__content">
              <GroupsList @open-new-group-modal="openNewGroupDrawer" />
            </section>
          </UnnnicTabsContent>
          <UnnnicTabsContent value="representatives">
            <section class="settings-page__content">
              <RepresentativesSettings />
            </section>
          </UnnnicTabsContent>
          <UnnnicTabsContent value="desk_copilot">
            <section class="settings-page__content">
              <DeskCopilotSettings v-if="activeTab === 'desk_copilot'" />
            </section>
          </UnnnicTabsContent>
        </UnnnicTabs>
      </template>
    </UnnnicPageHeader>
    <NewSectorDrawer
      v-if="showNewSectorDrawer"
      v-model="showNewSectorDrawer"
      @close="showNewSectorDrawer = false"
    />
    <NewGroupDrawer
      v-if="showNewGroupDrawer"
      v-model="showNewGroupDrawer"
      @close="showNewGroupDrawer = false"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter, useRoute } from 'vue-router';

import { useConfig } from '@/store/modules/config';
import { useSettings } from '@/store/modules/settings';

import SettingsProjectOptions from '@/views/Settings/SettingsProjectOptions/index.vue';
import CustomBreaks from '@/views/Settings/CustomBreaks/index.vue';
import SectorsList from '@/views/Settings/Sectors/index.vue';
import GroupsList from '@/views/Settings/Groups/index.vue';
import RepresentativesSettings from '@/views/Settings/Representatives/index.vue';
import DeskCopilotSettings from '@/views/Settings/DeskCopilot/index.vue';
import NewSectorDrawer from '@/views/Settings/Sectors/New/NewSectorDrawer.vue';
import NewGroupDrawer from '@/views/Settings/Groups/New.vue';

import i18n from '@/plugins/i18n';
import { useFeatureFlag } from '@/store/modules/featureFlag';
import { useAssistedSalesFeatureFlag } from '@/composables/useAssistedSalesFeatureFlag';
import { useCopilotProject } from '@/composables/useCopilotProject';

defineOptions({
  name: 'SettingsPage',
});

const { t } = i18n.global;

const router = useRouter();
const route = useRoute();

const configStore = useConfig();
const { isSecondaryProject, enableGroupsMode } = storeToRefs(configStore);

const { featureFlags } = storeToRefs(useFeatureFlag());
const isAssistedSalesEnabled = computed(() =>
  useAssistedSalesFeatureFlag(featureFlags.value),
);

const { showNewBadge: showDeskCopilotNewBadge, fetchLinkedProject } =
  useCopilotProject();

const settingsStore = useSettings();
const { sectors, groups } = storeToRefs(settingsStore);

const activeTab = ref('');
const settingsTabs = computed(() => {
  const deskCopilotTab = isAssistedSalesEnabled.value
    ? [
        {
          label: t('config_chats.tabs.desk_copilot'),
          value: 'desk_copilot',
        },
      ]
    : [];

  if (isSecondaryProject.value) {
    return [
      { label: t('config_chats.tabs.general'), value: 'general' },
      ...deskCopilotTab,
    ];
  }

  const tabs = [
    { label: t('config_chats.tabs.general'), value: 'general' },
    { label: t('config_chats.tabs.sectors'), value: 'sectors' },
  ];

  if (enableGroupsMode.value) {
    tabs.push({ label: t('config_chats.tabs.groups'), value: 'groups' });
  }

  if (!enableGroupsMode.value) {
    tabs.push({
      label: t('config_chats.tabs.representatives'),
      value: 'representatives',
    });
  }

  return [...tabs, ...deskCopilotTab];
});

const updateTab = (newTab: string) => {
  const newActiveTab = settingsTabs.value.find((tab) =>
    [tab.label, tab.value].includes(newTab),
  );

  if (!newActiveTab) return;

  activeTab.value = newActiveTab.value;

  if (activeTab.value) {
    router.replace({
      name: route.name,
      query: {
        tab: activeTab.value,
      },
    });
  }
};

const showNewSectorButton = computed(() => {
  return activeTab.value === 'sectors' && sectors.value.length > 0;
});
const showNewGroupButton = computed(() => {
  return activeTab.value === 'groups' && groups.value.length > 0;
});

const showNewSectorDrawer = ref(false);
const showNewGroupDrawer = ref(false);

const openNewSectorDrawer = () => {
  showNewSectorDrawer.value = true;
};

const openNewGroupDrawer = () => {
  showNewGroupDrawer.value = true;
};

onMounted(() => {
  updateTab((route.query.tab as string) || 'general');

  if (isAssistedSalesEnabled.value) {
    fetchLinkedProject();
  }
});
</script>

<style lang="scss" scoped>
.settings-page {
  display: flex;
  flex-direction: column;
  padding: $unnnic-space-4;
  gap: $unnnic-space-6;

  &__content {
    margin-top: $unnnic-space-6;
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-6;
    width: 100%;
    overflow-y: auto;
  }

  &__tab-label {
    display: inline-flex;
    align-items: center;
    gap: $unnnic-space-2;
  }
}
</style>
