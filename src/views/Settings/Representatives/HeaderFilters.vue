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
        v-model="filters.status"
        class="settings-representatives-header-filters__filter"
        :options="statusOptions"
        :label="$t('config_chats.representatives.filter.status.label')"
        :placeholder="$t('select')"
        clearable
      />
      <UnnnicMultiSelect
        v-model="filters.representatives"
        class="settings-representatives-header-filters__filter"
        :options="representativesOptions"
        :label="$t('config_chats.representatives.filter.representatives.label')"
        :placeholder="$t('select')"
        clearable
      />
      <UnnnicMultiSelect
        :modelValue="filters.sectors"
        class="settings-representatives-header-filters__filter"
        :options="sectorsOptionsFiltered"
        :label="$t('config_chats.representatives.filter.sectors.label')"
        :placeholder="$t('select')"
        clearable
        @update:model-value="onSelectSectors"
      />
      <UnnnicMultiSelect
        v-model="filters.queues"
        class="settings-representatives-header-filters__filter"
        :options="queuesOptions"
        :disabled="disableQueuesFilter"
        :label="$t('config_chats.representatives.filter.queues.label')"
        :placeholder="$t('select')"
        clearable
      />
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { watchDebounced } from '@vueuse/core';

import { useConfig } from '@/store/modules/config';

import PauseStatusService from '@/services/api/resources/chats/pauseStatus';
import ProjectService from '@/services/api/resources/settings/project';
import SectorService from '@/services/api/resources/settings/sector';
import QueueService from '@/services/api/resources/settings/queue';

import { removeDuplicatedItems } from '@/utils/array';

defineOptions({
  name: 'SettingsRepresentativesHeaderFilters',
});

interface Props {
  modelValue: {
    status: string[];
    representatives: string[];
    sectors: string[];
    queues: string[];
  };
}
const props = defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: Props['modelValue']];
  requestData: [void];
}>();

const filters = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const configStore = useConfig();
const projectUuid = computed(() => configStore.project?.uuid);

const statusOptions = ref([]);

const representativesOptions = ref([]);

const sectorsOptions = ref([]);
const sectorsOptionsFiltered = computed(() => {
  if (filters.value.sectors.includes('all')) {
    return sectorsOptions.value.map((sectorOption) => {
      if (sectorOption.value === 'all') {
        return sectorOption;
      }
      return { ...sectorOption, disabled: true };
    });
  }
  return sectorsOptions.value;
});

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
    const representativeLabel = representativeName || representative.user.email;
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

const queuesPage = ref(0);
const getQueuesOptions = async () => {
  let hasNext = false;
  const { results, next } = await QueueService.listAllQueues({
    limit: 20,
    offset: queuesPage.value * 20,
    filters: {
      sectors: filters.value.sectors.filter((sector) => sector !== 'all'),
    },
  });
  const formattedResults = results.flatMap((sector) => {
    return sector.queues.map((queue) => ({
      value: queue.uuid,
      label: queue.name,
    }));
  });
  queuesOptions.value = removeDuplicatedItems(
    [...queuesOptions.value, ...formattedResults],
    'value',
  );
  hasNext = next;
  if (hasNext) {
    queuesPage.value += 1;
    await getQueuesOptions();
  } else {
    queuesPage.value = 0;
  }
};

const onSelectSectors = async (sectors: string[]) => {
  const isAllOptionsSelected = sectors.includes('all');

  filters.value.sectors = isAllOptionsSelected ? ['all'] : sectors;

  queuesOptions.value = [];
  getQueuesOptions();
};

const disableQueuesFilter = computed(() => {
  return filters.value.sectors.length === 0;
});

onMounted(async () => {
  getStatusOptions();
  getRepresentativesOptions();
  getSectorsOptions();
});

watchDebounced(
  filters.value,
  () => {
    emit('requestData');
  },
  { debounce: 1000, maxWait: 2000, deep: true },
);
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
