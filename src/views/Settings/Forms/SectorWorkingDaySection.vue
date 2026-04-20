<template>
  <section
    :class="{
      'form-section': true,
      'group-mode': enableGroupsMode && isEditing,
    }"
  >
    <h2 class="form-section__title">
      {{ $t('sector.managers.working_day.title') }}
    </h2>
    <section class="form-section__inputs">
      <section class="form-section__inputs__workday-copy">
        <UnnnicSwitch
          v-model="copyWorkday"
          :textRight="$t('sector.managers.working_day.copy_workday')"
        />
        <UnnnicSelect
          v-if="copyWorkday"
          v-model="copyWorkdaySector"
          :options="sectorsOptions"
          :placeholder="$t('sector.managers.working_day.select_sector_to_copy')"
          returnObject
          clearable
          enableSearch
          :search="searchCopyWorkdaySector"
          @update:search="searchCopyWorkdaySector = $event"
        />
        <p class="form-section__subtitle">
          {{ $t('sector.managers.working_day.select_days') }}
        </p>
        <section class="form-section__inputs__workday-config">
          <section class="form-section__inputs__workday-tags">
            <UnnnicTag
              v-for="day in workdayDays"
              :key="day.value"
              class="form-section__inputs__workday-tags__tag"
              type="brand"
              clickable
              :text="day.label"
              :disabled="selectedWorkdayDays[day.value]"
              @click="
                () => {
                  selectWorkdayDay(day.value);
                  resetSelectedCopySector();
                }
              "
            />
          </section>
        </section>
        <p
          v-if="workdayDaysTimeOptions.length"
          class="form-section__subtitle"
        >
          {{ $t('sector.managers.working_day.set_hours') }}
        </p>
        <section
          v-if="Object.values(selectedWorkdayDays).some((enabled) => enabled)"
          class="form-section__inputs__workday-time-config"
        >
          <WorkdayTimeConfig
            v-model="selectedWorkdayDaysTime"
            :workdayDaysTimeOptions="workdayDaysTimeOptions"
            @reset-selected-copy-sector="resetSelectedCopySector"
          />
        </section>
        <p class="form-section__subtitle">
          {{ $t('sector.managers.working_day.add_holidays') }}
        </p>
        <section
          class="form-section__inputs__workday-time-config__holidays-container"
        >
          <UnnnicCheckbox
            :modelValue="selectAllCountryHolidays"
            :textRight="
              $t('country_holidays.title', {
                country: $t(`country.${countryCode || 'label'}`),
              })
            "
            @update:model-value="handleSelectAllCountryHolidays"
          />
          <UnnnicButton
            type="tertiary"
            :text="$t('sector.managers.working_day.see_all_holidays')"
            @click="handleModal('showCountryHolidaysModal', true)"
          />
        </section>
        <section
          class="form-section__inputs__workday-time-config__holidays-container"
        >
          <UnnnicButton
            class="form-section__inputs__workday-time-config__holidays-container__button"
            type="secondary"
            iconLeft="add-1"
            :text="$t('sector.managers.working_day.add_specific_dates')"
            @click="handleModal('showCreateCustomHolidayModal', true)"
          />
          <UnnnicButton
            class="form-section__inputs__workday-time-config__holidays-container__button"
            type="tertiary"
            :text="$t('sector.managers.working_day.see_all_specific_dates')"
            :disabled="!enableCustomHolidays.length"
            @click="handleModal('showCustomHolidaysModal', true)"
          />
        </section>
      </section>
      <section
        v-if="enableGroupsMode"
        class="form-section__inputs--fill-w"
      >
        <h2 class="form-section__title">
          {{ $t('sector.link.title') }}
        </h2>

        <UnnnicSelect
          v-model="selectedProject"
          :options="projectsNames"
          :label="$t('sector.link.label')"
          :placeholder="$t('sector.link.project_placeholder')"
          returnObject
          clearable
          enableSearch
          :search="searchProject"
          :disabled="isEditing"
          @update:search="searchProject = $event"
        />

        <UnnnicDisclaimer
          v-if="isEditing"
          class="link-project-disclaimer"
          :description="$t('sector.link.editing_disclaimer')"
          type="attention"
        />
        <UnnnicDisclaimer
          v-else-if="selectedProject && selectedProjectHasSectorIntegration"
          class="link-project-disclaimer"
          :description="$t('sector.link.has_linked_project')"
          type="attention"
        />
      </section>

      <UnnnicInput
        v-else
        v-model="roomsLimitModel"
        :label="$t('sector.managers.working_day.limit_agents.label')"
        placeholder="4"
        class="form-section__inputs--fill-w"
      />
    </section>
  </section>

  <CountryHolidaysModal
    v-if="showCountryHolidaysModal"
    :holidays="allCountryHolidays"
    :enableHolidays="enableCountryHolidays"
    :isEditing="isEditing"
    :sectorUuid="modelValue.uuid"
    @update:enable-holidays="enableCountryHolidays = $event"
    @update:disabled-holidays="disabledCountryHolidays = $event"
    @close="handleModal('showCountryHolidaysModal', false)"
  />
  <CustomHolidaysModal
    v-if="showCustomHolidaysModal"
    :holidays="enableCustomHolidays"
    :isEditing="isEditing"
    :sectorUuid="modelValue.uuid"
    @save="handleSaveCustomHolidays"
    @close="handleModal('showCustomHolidaysModal', false)"
  />
  <CreateCustomHolidayModal
    v-if="showCreateCustomHolidayModal"
    :isEditing="isEditing"
    :sectorUuid="modelValue.uuid"
    @add-custom-holidays="addCustomHolidays"
    @close="handleModal('showCreateCustomHolidayModal', false)"
  />
</template>

<script>
import { mapActions, mapState } from 'pinia';

import { cloneDeep } from 'lodash';

import { useSettings } from '@/store/modules/settings';
import { useConfig } from '@/store/modules/config';

import Group from '@/services/api/resources/settings/group';
import Sector from '@/services/api/resources/settings/sector';

import WorkdayTimeConfig from './WorkdayTimeConfig.vue';
import CountryHolidaysModal from './modals/CountryHolidaysModal.vue';
import CustomHolidaysModal from './modals/CustomHolidaysModal.vue';
import CreateCustomHolidayModal from './modals/CreateCustomHolidayModal.vue';

const emptyWorkdayTime = {
  start: '',
  end: '',
  valid: false,
};

const defaultEmptyWorkdayState = () => ({
  monday: [cloneDeep(emptyWorkdayTime)],
  tuesday: [cloneDeep(emptyWorkdayTime)],
  wednesday: [cloneDeep(emptyWorkdayTime)],
  thursday: [cloneDeep(emptyWorkdayTime)],
  friday: [cloneDeep(emptyWorkdayTime)],
  saturday: [cloneDeep(emptyWorkdayTime)],
  sunday: [cloneDeep(emptyWorkdayTime)],
});

export default {
  name: 'SectorWorkingDaySection',

  components: {
    WorkdayTimeConfig,
    CountryHolidaysModal,
    CustomHolidaysModal,
    CreateCustomHolidayModal,
  },

  props: {
    isEditing: {
      type: Boolean,
      default: false,
    },
    modelValue: {
      type: Object,
      required: true,
    },
  },

  emits: ['update:modelValue', 'sync-workday-state', 'initial-load-complete'],

  data() {
    return {
      selectedProject: null,
      projects: [],
      searchProject: '',
      copyWorkday: false,
      copyWorkdaySector: null,
      searchCopyWorkdaySector: '',
      selectedWorkdayDays: {
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: false,
        saturday: false,
        sunday: false,
      },
      selectedWorkdayDaysTime: defaultEmptyWorkdayState(),
      secondaryProjectsPage: 0,
      secondaryProjectsLimitPerPage: 50,
      showCountryHolidaysModal: false,
      showCustomHolidaysModal: false,
      showCreateCustomHolidayModal: false,
      countryCode: '',
      selectAllCountryHolidays: false,
      allCountryHolidays: [],
      enableCountryHolidays: [],
      disabledCountryHolidays: [],
      enableCustomHolidays: [],
    };
  },

  computed: {
    ...mapState(useSettings, ['sectors']),
    ...mapState(useConfig, ['enableGroupsMode', 'project']),

    sectorsOptions() {
      return this.sectors.map((sector) => ({
        value: sector.uuid,
        label: sector.name,
      }));
    },

    workdayDays() {
      return [
        { label: this.$t('week_days.monday.short'), value: 'monday' },
        { label: this.$t('week_days.tuesday.short'), value: 'tuesday' },
        { label: this.$t('week_days.wednesday.short'), value: 'wednesday' },
        { label: this.$t('week_days.thursday.short'), value: 'thursday' },
        { label: this.$t('week_days.friday.short'), value: 'friday' },
        { label: this.$t('week_days.saturday.short'), value: 'saturday' },
        { label: this.$t('week_days.sunday.short'), value: 'sunday' },
      ];
    },

    workdayDaysTimeOptions() {
      return Object.entries(this.selectedWorkdayDays)
        .filter(([_key, value]) => !!value)
        .map(([key, _value]) => key);
    },

    selectedProjectHasSectorIntegration() {
      if (this.selectedProject?.value) {
        const project = this.projects.find(
          (p) => this.selectedProject.value === p.uuid,
        );

        return !!project?.has_sector_integration;
      }
      return false;
    },

    projectsNames() {
      return this.projects.map((project) => {
        const { name, uuid } = project;
        return { value: uuid, label: name };
      });
    },

    roomsLimitModel: {
      get() {
        return this.modelValue.rooms_limit;
      },
      set(rooms_limit) {
        this.$emit('update:modelValue', { ...this.modelValue, rooms_limit });
      },
    },

    syncPayload() {
      return {
        workdayDaysTimeOptions: this.workdayDaysTimeOptions,
        selectedWorkdayDays: this.selectedWorkdayDays,
        selectedWorkdayDaysTime: this.selectedWorkdayDaysTime,
        selectedProject: this.selectedProject,
        selectedProjectHasSectorIntegration:
          this.selectedProjectHasSectorIntegration,
      };
    },
  },

  watch: {
    selectedProject(option) {
      this.applySelectedProject(option);
    },
    copyWorkdaySector(option) {
      if (option?.value) {
        this.applyCopyWorkdaySector(option);
      }
    },
    selectedWorkdayDaysTime: {
      deep: true,
      handler() {
        const daysTimes = Object.entries(this.selectedWorkdayDaysTime);
        daysTimes.forEach(([day, timesConfig]) => {
          timesConfig.forEach((_timeConfig, index) => {
            this.validateWorkdayTime(day, index);
          });
        });
      },
    },
    copyWorkday(value) {
      this.copyWorkdaySector = null;
      if (!value) {
        this.selectedWorkdayDays = {
          monday: false,
          tuesday: false,
          wednesday: false,
          thursday: false,
          friday: false,
          saturday: false,
          sunday: false,
        };
        this.selectedWorkdayDaysTime = defaultEmptyWorkdayState();
      }
    },
    enableCountryHolidays: {
      deep: true,
      handler(value) {
        const enableCountryHolidaysLength = value.length;
        const allCountryHolidaysLength = this.allCountryHolidays.length;
        if (
          enableCountryHolidaysLength > 0 &&
          enableCountryHolidaysLength < allCountryHolidaysLength
        ) {
          this.selectAllCountryHolidays = 'less';
        }

        if (enableCountryHolidaysLength === allCountryHolidaysLength) {
          this.selectAllCountryHolidays = true;
        }

        if (enableCountryHolidaysLength === 0) {
          this.selectAllCountryHolidays = false;
        }
      },
    },
    syncPayload: {
      deep: true,
      handler() {
        this.$emit('sync-workday-state', this.syncPayload);
      },
      immediate: true,
    },
  },

  async mounted() {
    await this.getCountryHolidays();

    if (this.sectors.length === 0) {
      await this.getSectors(true);
    }

    if (!this.isEditing) {
      this.handleSelectAllCountryHolidays(true);
    } else if (this.modelValue.uuid) {
      await this.getSectorAllHolidays();
      await this.$nextTick();
      await this.loadWorktimesFromSector(this.modelValue.uuid);
    }

    if (this.enableGroupsMode) {
      await this.listSecondaryProjects();
      if (this.isEditing) {
        const secondaryProjectUuid = this.modelValue.config?.secondary_project;
        const projectOption = this.projectsNames.find(
          (p) => p.value === secondaryProjectUuid,
        );
        if (projectOption) {
          this.selectedProject = projectOption;
        }
      }
    }

    await this.$nextTick();
    await this.$nextTick();
    this.$emit('initial-load-complete');
  },

  methods: {
    ...mapActions(useSettings, {
      getSectors: 'getSectors',
    }),

    handleConnectOverlay(active) {
      window.parent.postMessage({ event: 'changeOverlay', data: active }, '*');
    },

    handleModal(modal, open) {
      this.handleConnectOverlay(open);
      this[modal] = open;
    },

    handleSelectAllCountryHolidays(value) {
      this.selectAllCountryHolidays = value;
      if (value) {
        this.enableCountryHolidays = this.allCountryHolidays.map(
          (holiday) => holiday.date,
        );
        this.disabledCountryHolidays = [];
      } else {
        this.enableCountryHolidays = [];
        this.disabledCountryHolidays = this.allCountryHolidays.map(
          (holiday) => holiday.date,
        );
      }
    },

    async getCountryHolidays() {
      const { holidays, country_code } = await Sector.getCountryHolidays();
      this.countryCode = country_code;
      this.allCountryHolidays = holidays;
    },

    async getSectorAllHolidays() {
      try {
        const allHolidays = await Sector.getAllSectorHolidays(
          this.modelValue.uuid,
        );

        const countryHolidays = allHolidays.filter(
          (holiday) => !holiday.its_custom,
        );

        countryHolidays.forEach((holiday) => {
          const countryHoliday = this.allCountryHolidays.find(
            (ch) => ch.date === holiday.date,
          );
          if (countryHoliday) {
            countryHoliday.name = holiday.description;
            countryHoliday.uuid = holiday.uuid;
          }
        });

        const { activeCountryHolidays, inactiveCountryHolidays } =
          this.allCountryHolidays.reduce(
            (accumulator, countryHoliday) => {
              accumulator[
                countryHoliday.uuid
                  ? 'activeCountryHolidays'
                  : 'inactiveCountryHolidays'
              ].push(countryHoliday);

              return accumulator;
            },
            {
              activeCountryHolidays: [],
              inactiveCountryHolidays: [],
            },
          );

        const customHolidays = allHolidays.filter(
          (holiday) => holiday.its_custom,
        );

        this.enableCountryHolidays = activeCountryHolidays.map(
          (holiday) => holiday.date,
        );
        this.disabledCountryHolidays = inactiveCountryHolidays.map(
          (holiday) => holiday.date,
        );

        this.enableCustomHolidays = customHolidays;
      } catch (error) {
        console.log(error);
      }
    },

    resetSelectedCopySector() {
      this.copyWorkdaySector = null;
    },

    applySelectedProject(option) {
      this.$emit('update:modelValue', {
        ...this.modelValue,
        config: {
          ...this.modelValue.config,
          secondary_project: option?.value ?? null,
        },
      });
    },

    async applyCopyWorkdaySector(selectedSector) {
      if (selectedSector?.value) {
        await this.loadWorktimesFromSector(selectedSector.value);
      }
    },

    async loadWorktimesFromSector(sectorUuid) {
      const sectorWorktimes = await Sector.getWorkingTimes(sectorUuid);
      const schedules = sectorWorktimes?.working_hours?.schedules;

      if (schedules) {
        Object.keys(schedules).forEach((day) => {
          if (!schedules[day]) {
            this.selectedWorkdayDays[day] = false;
            this.selectedWorkdayDaysTime[day] = [cloneDeep(emptyWorkdayTime)];
          } else {
            this.selectedWorkdayDays[day] = true;
            this.selectedWorkdayDaysTime[day] = schedules[day].map((time) => ({
              ...time,
              valid: true,
            }));
          }
        });
      }
    },

    validateWorkdayTime(day, index) {
      const { start, end } = this.selectedWorkdayDaysTime[day][index];

      if (index === 1) {
        const firstTime = this.selectedWorkdayDaysTime[day][0];
        if (start < firstTime.end) {
          this.selectedWorkdayDaysTime[day][index].valid = false;
          return;
        }
      }

      if (start >= end) {
        this.selectedWorkdayDaysTime[day][index].valid = false;
      } else {
        this.selectedWorkdayDaysTime[day][index].valid = true;
      }
    },

    async listSecondaryProjects() {
      try {
        let hasNext = true;

        while (hasNext) {
          const offset =
            this.secondaryProjectsPage * this.secondaryProjectsLimitPerPage;

          const { results, next } = await Group.listProjects({
            orgUuid: this.project.org,
            limit: this.secondaryProjectsLimitPerPage,
            offset,
            params: { its_principal: false },
          });

          this.secondaryProjectsPage += 1;
          this.projects = this.projects.concat(results);

          hasNext = !!next;
        }
      } catch (error) {
        console.error(error);
      }
    },

    selectWorkdayDay(day) {
      this.selectedWorkdayDays[day] = !this.selectedWorkdayDays[day];
      if (!this.selectedWorkdayDays[day]) {
        this.selectedWorkdayDaysTime[day] = [cloneDeep(emptyWorkdayTime)];
      }
    },

    getWorkingDaysRequestBody() {
      const requestBody = {};

      Object.keys(this.selectedWorkdayDaysTime).forEach((day) => {
        requestBody[day] = this.selectedWorkdayDays[day]
          ? this.selectedWorkdayDaysTime[day].map((time) => ({
              start: time.start,
              end: time.end,
            }))
          : null;
      });

      return requestBody;
    },

    applyDefaultWorkdayActivate(defaultWorkTime) {
      this.selectedWorkdayDays = {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: false,
        sunday: false,
      };
      this.selectedWorkdayDaysTime = cloneDeep({
        monday: [defaultWorkTime],
        tuesday: [defaultWorkTime],
        wednesday: [defaultWorkTime],
        thursday: [defaultWorkTime],
        friday: [defaultWorkTime],
        saturday: [emptyWorkdayTime],
        sunday: [emptyWorkdayTime],
      });
    },

    applyDefaultWorkdayDeactivate() {
      this.selectedWorkdayDays = {
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: false,
        saturday: false,
        sunday: false,
      };
      this.selectedWorkdayDaysTime = defaultEmptyWorkdayState();
    },

    async addCustomHolidays(holidays) {
      holidays.forEach((holiday) => {
        this.enableCustomHolidays.push({
          ...holiday,
          uuid:
            holiday.uuid ||
            `${new Date().getTime()}-${holiday.date.start}-${holiday.date.end}`,
        });
      });
    },

    async handleSaveCustomHolidays({ holidays }) {
      this.enableCustomHolidays = holidays;
    },

    async initCountryHolidays() {
      await Sector.createCountryHolidays(this.modelValue.uuid, {
        enabled_holidays: this.enableCountryHolidays,
        disabled_holidays: this.disabledCountryHolidays,
      });
    },

    async createCustomHolidays() {
      const promisesCreateSectorHoliday = this.enableCustomHolidays.map(
        (holiday) =>
          Sector.createSectorHoliday(this.modelValue.uuid, {
            ...holiday,
            uuid: undefined,
          }),
      );
      await Promise.all(promisesCreateSectorHoliday);
    },
  },
};
</script>

<style lang="scss" scoped>
.form-section {
  display: flex;
  flex-direction: column;
  gap: $unnnic-space-4;

  &.group-mode {
    margin-top: 0px;
  }

  &__title {
    font: $unnnic-font-display-3;
    color: $unnnic-color-fg-emphasized;
  }

  &__subtitle {
    font: $unnnic-font-body;
  }

  &__inputs {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-4;

    &__workday-copy {
      display: flex;
      flex-direction: column;
      gap: $unnnic-space-4;
    }

    &__workday-tags {
      display: flex;
      gap: $unnnic-space-2;
      &__tag {
        height: $unnnic-space-8;
      }
    }

    &__workday-time-config {
      display: flex;
      flex-direction: column;
      gap: $unnnic-space-4;

      &__holidays-container {
        display: flex;
        align-items: center;
        gap: $unnnic-space-2;

        &__button {
          max-width: 240px;
        }
      }
    }

    &--fill-w {
      grid-column: span 2;
    }
  }
}

.link-project-disclaimer {
  display: flex;
  margin-top: $unnnic-space-3;
}
</style>
