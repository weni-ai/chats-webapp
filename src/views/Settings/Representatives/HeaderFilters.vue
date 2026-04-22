<template>
  <section class="settings-representatives-header-filters">
    <section class="settings-representatives-header-filters__title-container">
      <h1 class="settings-representatives-header-filters__title">
        {{ $t('config_chats.representatives.title') }}
      </h1>
      <UnnnicToolTip
        :text="$t('config_chats.representatives.description')"
        side="right"
        enabled
      >
        <UnnnicIcon
          icon="ri:question-line"
          scheme="gray-7"
          size="sm"
        />
      </UnnnicToolTip>
    </section>
    <section class="settings-representatives-header-filters__filters">
      <UnnnicMultiSelect
        v-model="selectedStatus"
        class="settings-representatives-header-filters__filter"
        :options="statusOptions"
        :label="$t('config_chats.representatives.filter.status.label')"
        :placeholder="$t('select')"
      />
      <UnnnicMultiSelect
        v-model="selectedRepresentatives"
        class="settings-representatives-header-filters__filter"
        :options="representativesOptions"
        :label="$t('config_chats.representatives.filter.representatives.label')"
        :placeholder="$t('select')"
      />
      <UnnnicMultiSelect
        v-model="selectedSectors"
        class="settings-representatives-header-filters__filter"
        :options="sectorsOptions"
        :label="$t('config_chats.representatives.filter.sectors.label')"
        :placeholder="$t('select')"
      />
      <UnnnicMultiSelect
        v-model="selectedQueues"
        class="settings-representatives-header-filters__filter"
        :options="queuesOptions"
        :disabled="disableQueuesFilter"
        :label="$t('config_chats.representatives.filter.queues.label')"
        :placeholder="$t('select')"
      />
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import { useConfig } from '@/store/modules/config';

import PauseStatusService from '@/services/api/resources/chats/pauseStatus';
import ProjectService from '@/services/api/resources/settings/project';
import SectorService from '@/services/api/resources/settings/sector';

import { removeDuplicatedItems } from '@/utils/array';

defineOptions({
  name: 'SettingsRepresentativesHeaderFilters',
});

const configStore = useConfig();
const projectUuid = computed(() => configStore.project?.uuid);

const selectedStatus = ref([]);
const statusOptions = ref([]);

const selectedRepresentatives = ref([]);
const representativesOptions = ref([]);

const selectedSectors = ref([]);
const sectorsOptions = ref([]);

const selectedQueues = ref([]);
const queuesOptions = ref([]);

const getStatusOptions = async () => {
  const { results } = await PauseStatusService.getCustomBreakStatusTypeList({
    projectUuid: projectUuid.value,
  });
  const baseStatuses = [
    { value: 'online', label: 'Online' },
    { value: 'offline', label: 'Offline', color: 'gray' },
  ];

  const formattedCustomStatuses = results.map(({ name }) => ({
    value: name,
    label: name,
  }));

  statusOptions.value = [...baseStatuses, ...formattedCustomStatuses];
};

const representativesPage = ref(0);
const getRepresentativesOptions = async () => {
  let hasNext = false;
  const { results, next } = await ProjectService.getRepresentatives({
    offset: representativesPage.value * 20,
    limit: 20,
  });
  const formattedResults = results.map((representative) => {
    const representativeName =
      `${representative.user.first_name} ${representative.user.last_name}`.trim();
    const representativeLabel = representativeName
      ? `${representativeName} (${representative.user.email})`
      : representative.user.email;
    return {
      label: representativeLabel,
      value: representative.user.email,
    };
  });
  representativesOptions.value = removeDuplicatedItems(
    [...representativesOptions.value, ...formattedResults],
    'value',
  );
  hasNext = next;
  if (hasNext) {
    representativesPage.value += 1;
    await getRepresentativesOptions();
  } else {
    representativesPage.value = 0;
  }
};

const sectorsPage = ref(0);
const getSectorsOptions = async () => {
  let hasNext = false;
  const { results, next } = await SectorService.list({
    offset: sectorsPage.value * 20,
    limit: 20,
  });
  const formattedResults = results.map((sector) => ({
    value: sector.uuid,
    label: sector.name,
  }));
  // TODO: translate 'All'
  sectorsOptions.value = removeDuplicatedItems(
    [
      { value: 'all', label: 'All' },
      ...sectorsOptions.value,
      ...formattedResults,
    ],
    'value',
  );
  hasNext = next;
  if (hasNext) {
    sectorsPage.value += 1;
    await getSectorsOptions();
  } else {
    sectorsPage.value = 0;
  }
};

const getQueuesOptions = async () => {
  // TODO: implement
};

const disableQueuesFilter = computed(() => {
  return selectedSectors.value.length === 0;
});

onMounted(async () => {
  getStatusOptions();
  getRepresentativesOptions();
  getSectorsOptions();
});
</script>

<style lang="scss" scoped>
.settings-representatives-header-filters {
  display: flex;
  flex-direction: column;
  gap: $unnnic-space-4;

  &__title {
    font: $unnnic-font-display-3;
    color: $unnnic-color-fg-emphasized;

    &-container {
      display: flex;
      gap: $unnnic-space-2;
    }
  }

  &__filters {
    display: flex;
    gap: $unnnic-space-4;
  }
  &__filter {
    flex: 1;
  }
}
</style>
