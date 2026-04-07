<template>
  <section
    v-if="showSettings"
    class="settings-page"
  >
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
          v-model="activeTab"
          class="settings-page__tabs"
        >
          <UnnnicTabsList>
            <UnnnicTabsTrigger
              v-for="tab in settingsTabs"
              :key="tab.value"
              :value="tab.value"
            >
              {{ tab.label }}
            </UnnnicTabsTrigger>
          </UnnnicTabsList>
          <UnnnicTabsContent value="general">
            <section class="settings-page__content">
              <SettingsProjectOptions />
              <CustomBreaks />
            </section>
          </UnnnicTabsContent>
          <UnnnicTabsContent value="sectors">
            <section class="settings-page__content">
              <SectorsList @open-new-sector-modal="openNewSectorDrawer" />
            </section>
          </UnnnicTabsContent>
          <UnnnicTabsContent value="groups">
            <section class="settings-page__content">
              <GroupsList @open-new-group-modal="openNewGroupDrawer" />
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
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';

import { useConfig } from '@/store/modules/config';
import { useSettings } from '@/store/modules/settings';

import SettingsProjectOptions from '@/views/Settings/SettingsProjectOptions/index.vue';
import CustomBreaks from '@/views/Settings/CustomBreaks/index.vue';
import SectorsList from '@/views/Settings/Sectors/index.vue';
import GroupsList from '@/views/Settings/Groups/index.vue';
import NewSectorDrawer from '@/views/Settings/Sectors/New/NewSectorDrawer.vue';
import NewGroupDrawer from '@/views/Settings/Groups/New.vue';

import i18n from '@/plugins/i18n';

defineOptions({
  name: 'SettingsPage',
});

const { t } = i18n.global;

const configStore = useConfig();
const { isPrimaryProject, enableGroupsMode } = storeToRefs(configStore);

const settingsStore = useSettings();
const { sectors, groups } = storeToRefs(settingsStore);

const showSettings = computed(() => {
  return !enableGroupsMode.value || isPrimaryProject.value;
});

const activeTab = ref('general');
const settingsTabs = computed(() => {
  const tabs = [
    { label: t('config_chats.tabs.general'), value: 'general' },
    { label: t('config_chats.tabs.sectors'), value: 'sectors' },
  ];

  if (enableGroupsMode.value) {
    tabs.push({ label: t('config_chats.tabs.groups'), value: 'groups' });
  }

  return tabs;
});
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
}
</style>
