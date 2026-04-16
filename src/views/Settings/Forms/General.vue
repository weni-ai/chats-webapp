<template>
  <section class="form-wrapper">
    <FillDefaultOption
      v-if="!isEditing"
      :modelValue="useDefaultSector"
      :customizedOptionText="$t('config_chats.custom_sector')"
      :defaultOptionText="$t('config_chats.default_sector.title')"
      @update:model-value="updateDefaultSectorValue"
    />
    <form
      class="form-sector-container"
      @submit.prevent="emit('submit')"
    >
      <section class="form-section">
        <h2 class="form-section__title">
          {{ $t('sector.add_name_and_managers') }}
        </h2>
        <section class="form-section__select-managers">
          <UnnnicInput
            v-model="sector.name"
            :label="$t('sector.name')"
            :placeholder="$t('sector.placeholder')"
          />
          <section
            v-if="!enableGroupsMode"
            class="form-section__select-managers__managers"
          >
            <UnnnicSelect
              v-model="selectedManager"
              :options="managersNames"
              :label="$t('sector.managers.add.label')"
              :placeholder="$t('sector.managers.add.placeholder')"
              :search="searchManager"
              returnObject
              clearable
              enableSearch
              @update:search="searchManager = $event"
            />
            <section
              v-if="sector.managers.length > 0"
              class="form-sector-container__managers"
            >
              <TagGroup
                :tags="managersTags"
                disabledTag
                hasCloseIcon
                @close="(manager) => removeManager(manager.uuid)"
              />
            </section>
          </section>
        </section>
      </section>
      <SectorWorkingDaySection
        ref="workingDaySection"
        v-model="sector"
        :isEditing="isEditing"
        @sync-workday-state="workdayState = $event"
        @initial-load-complete="onSectorWorkingDayInitialLoadComplete"
      />
    </form>
  </section>
</template>

<script setup>
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';

import { useForm } from '@/composables/useForm';

import Sector from '@/services/api/resources/settings/sector';
import Project from '@/services/api/resources/settings/project';
import TagGroup from '@/components/TagGroup.vue';
import FillDefaultOption from './FillDefaultOption.vue';
import SectorWorkingDaySection from './SectorWorkingDaySection.vue';

import { useProfile } from '@/store/modules/profile';
import { useConfig } from '@/store/modules/config';

import i18n from '@/plugins/i18n';

import { UnnnicCallAlert } from '@weni/unnnic-system';
import { removeDuplicatedItems } from '@/utils/array';

defineOptions({
  name: 'FormSector',
});

const emit = defineEmits([
  'update:modelValue',
  'submit',
  'changeIsValid',
  'hasChangesWorkday',
  'sectorFormInitialSync',
]);

const props = defineProps({
  isEditing: {
    type: Boolean,
    default: false,
  },
  modelValue: {
    type: Object,
    required: true,
  },
});

const router = useRouter();

const { me } = storeToRefs(useProfile());
const { enableGroupsMode } = storeToRefs(useConfig());

const t = (...args) => i18n.global.t(...args);

const workdayState = ref({
  workdayDaysTimeOptions: [],
  selectedWorkdayDays: {},
  selectedWorkdayDaysTime: {},
  selectedProject: null,
  selectedProjectHasSectorIntegration: false,
});

const { hasChanges: hasWorkdayChanges, resetBaseline: resetWorkdayBaseline } =
  useForm({
    source: workdayState,
  });

watch(
  hasWorkdayChanges,
  (dirty) => {
    emit('hasChangesWorkday', dirty);
  },
  { immediate: true },
);

const useDefaultSector = ref(0);
const selectedManager = ref(null);
const removedManagers = ref([]);
const managers = ref([]);
const searchManager = ref('');
const managersPage = ref(0);
const managersLimitPerPage = 20;
const projectUsersPage = ref(0);
const projectUsersPerPage = 50;

const workingDaySection = ref(null);

const sector = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit('update:modelValue', value);
  },
});

const managersTags = computed(() =>
  sector.value.managers.map((manager) => {
    const {
      user: { first_name, last_name, email },
    } = manager;
    const managerName = `${first_name} ${last_name}`.trim();
    const formattedName = managerName ? `${managerName} (${email})` : email;
    return { uuid: manager.uuid, name: formattedName };
  }),
);

const managersNames = computed(() =>
  managers.value.map((manager) => {
    const {
      user: { email, first_name, last_name },
      uuid,
    } = manager;

    return {
      uuid,
      value: email,
      label: first_name || last_name ? `${first_name} ${last_name}` : email,
    };
  }),
);

const isFormValid = computed(() => {
  const { name, managers: sectorManagers, rooms_limit } = sector.value;

  const {
    workdayDaysTimeOptions,
    selectedWorkdayDays,
    selectedWorkdayDaysTime,
    selectedProject,
    selectedProjectHasSectorIntegration,
  } = workdayState.value;

  const hasWorkday = workdayDaysTimeOptions.length >= 1;

  const selectedDaysWorkdayTimes = workdayDaysTimeOptions
    .map((day) => {
      if (selectedWorkdayDays[day]) {
        return selectedWorkdayDaysTime[day];
      }
      return [];
    })
    .flat();

  const validAllWorkdayTime = selectedDaysWorkdayTimes.every(
    (time) => time.valid,
  );

  const commonValid = !!(name.trim() && validAllWorkdayTime && hasWorkday);

  const groupValid =
    !!selectedProject &&
    (props.isEditing || !selectedProjectHasSectorIntegration);

  const singleValid = !!(sectorManagers.length > 0 && rooms_limit);

  return enableGroupsMode.value
    ? commonValid && groupValid
    : commonValid && singleValid;
});

watch(isFormValid, (valid) => emit('changeIsValid', valid), {
  immediate: true,
});

watch(selectedManager, (option) => {
  if (option?.uuid) {
    addSelectedManager(option);
  }
});

function onSectorWorkingDayInitialLoadComplete() {
  nextTick(() => {
    resetWorkdayBaseline();
    emit('sectorFormInitialSync');
  });
}

function updateDefaultSectorValue(activate) {
  useDefaultSector.value = activate;
  const defaultWorkTime = { start: '08:00', end: '18:00', valid: true };
  if (activate) {
    workingDaySection.value?.applyDefaultWorkdayActivate(defaultWorkTime);
    workingDaySection.value?.handleSelectAllCountryHolidays(true);
    const meManager = managers.value.find(
      (manager) => manager.user.email === me.value.email,
    );
    sector.value = {
      ...sector.value,
      name: t('config_chats.default_sector.name'),
      rooms_limit: enableGroupsMode.value ? '' : '4',
      managers: enableGroupsMode.value ? [] : [meManager],
    };
  } else {
    workingDaySection.value?.applyDefaultWorkdayDeactivate();
    workingDaySection.value?.handleSelectAllCountryHolidays(false);
    sector.value = {
      ...sector.value,
      name: '',
      rooms_limit: '',
      managers: [],
    };
  }
}

async function getSectorManagers() {
  let hasNext = false;
  try {
    const offset = managersPage.value * managersLimitPerPage;
    const { next, results } = await Sector.managers(
      sector.value.uuid,
      offset,
      managersLimitPerPage,
    );
    hasNext = next;
    managersPage.value += 1;
    const concatManagers = sector.value.managers.concat(
      results.map((manager) => ({
        ...manager,
        removed: false,
      })),
    );
    sector.value.managers = removeDuplicatedItems(concatManagers, 'uuid');
  } finally {
    if (hasNext) {
      await getSectorManagers();
    }
  }
}

async function removeManager(managerUuid) {
  if (props.isEditing) await Sector.removeManager(managerUuid);

  removeManagerFromTheList(managerUuid);
}

function removeManagerFromTheList(managerUuid) {
  const manager = sector.value.managers.find((m) => m.uuid === managerUuid);

  removedManagers.value.push(manager);
  sector.value.managers = sector.value.managers.filter(
    (m) => m.uuid !== managerUuid,
  );
}

function addSelectedManager(option) {
  if (option?.uuid) {
    const manager = managers.value.find((m) => m.uuid === option.uuid);
    addSectorManager(manager);
    selectedManager.value = null;
  }
}

function addSectorManager(manager) {
  if (manager) {
    const nextManagers = sector.value.managers.some(
      (mappedManager) => mappedManager.user.email === manager.user.email,
    )
      ? sector.value.managers
      : [...sector.value.managers, manager];

    sector.value.managers = nextManagers;

    if (props.isEditing) addManager(manager);

    selectedManager.value = null;
  }
}

async function addManager(manager) {
  await Sector.addManager(sector.value.uuid, manager.uuid);
  getSectorManagers();
}

async function listProjectManagers() {
  let hasNext = false;
  try {
    const offset = projectUsersPage.value * projectUsersPerPage;
    const { results, next } = await Project.managers(
      offset,
      projectUsersPerPage,
    );
    projectUsersPage.value += 1;
    managers.value = managers.value.concat(results);

    hasNext = next;
  } finally {
    if (hasNext) {
      await listProjectManagers();
    }
  }
}

async function saveSector() {
  const {
    uuid,
    name,
    can_trigger_flows,
    can_edit_custom_fields,
    config,
    sign_messages,
    rooms_limit,
    is_csat_enabled,
  } = sector.value;

  const payload = {
    name,
    can_trigger_flows,
    can_edit_custom_fields,
    config,
    sign_messages,
    rooms_limit,
    is_csat_enabled,
  };

  try {
    await Sector.update(uuid, payload);
    await saveWorkingDays();
    UnnnicCallAlert({
      props: {
        text: t('sector_update_success'),
        type: 'success',
      },
      seconds: 5,
    });
    router.push('/settings');
  } catch (error) {
    UnnnicCallAlert({
      props: {
        text: t('sector_update_error'),
        type: 'error',
      },
      seconds: 5,
    });
    console.log(error);
  }
}

async function saveWorkingDays() {
  const requestBody =
    workingDaySection.value?.getWorkingDaysRequestBody() ?? {};

  await Sector.setSectorWorkingDays(sector.value.uuid, requestBody);
}

async function initCountryHolidays() {
  await workingDaySection.value?.initCountryHolidays();
}

async function createCustomHolidays() {
  await workingDaySection.value?.createCustomHolidays();
}

onMounted(async () => {
  const isDefaultSector =
    sector.value.name === i18n.global.t('config_chats.default_sector.name');

  if (props.isEditing && !enableGroupsMode.value) {
    getSectorManagers();
  } else if (isDefaultSector) {
    useDefaultSector.value = 1;
  }

  if (!enableGroupsMode.value) await listProjectManagers();
});

defineExpose({
  saveSector,
  saveWorkingDays,
  initCountryHolidays,
  createCustomHolidays,
});
</script>

<style lang="scss" scoped>
.form-wrapper {
  display: flex;
  flex-direction: column;
  gap: $unnnic-space-4;
  min-height: 600px;
  margin-bottom: $unnnic-space-4;
}

.form-sector-container {
  display: flex;
  flex-direction: column;
  gap: $unnnic-space-4;
  flex: 1;
  overflow-y: auto;

  .form-section {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-4;

    &__select-managers {
      display: flex;
      flex-direction: column;
      gap: $unnnic-space-4;
      &__managers {
        display: flex;
        flex-direction: column;
        gap: $unnnic-space-2;
      }
    }

    &__title {
      font: $unnnic-font-display-3;
      color: $unnnic-color-fg-emphasized;
    }
  }

  &__managers {
    margin-top: $unnnic-spacing-nano;
  }
}
</style>
