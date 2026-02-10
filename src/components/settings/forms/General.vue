<template>
  <section class="form-wrapper">
    <section
      v-if="!isEditing"
      class="form-wrapper__radios"
    >
      <UnnnicRadio
        :modelValue="useDefaultSector"
        :value="0"
        data-testid="disable-default-sector-config"
        @update:model-value="updateDefaultSectorValue"
      >
        {{ $t('config_chats.custom_sector') }}
      </UnnnicRadio>
      <UnnnicRadio
        :modelValue="useDefaultSector"
        :value="1"
        data-testid="enable-default-sector-config"
        @update:model-value="updateDefaultSectorValue"
      >
        {{ $t('config_chats.default_sector.title') }}
      </UnnnicRadio>
    </section>

    <form
      class="form-sector-container"
      @submit.prevent="$emit('submit')"
    >
      <section class="form-section">
        <h2
          v-if="!isEditing"
          class="form-section__title"
        >
          {{ $t('sector.add') }}
        </h2>
        <h2
          v-else-if="!enableGroupsMode && isEditing"
          class="form-section__title"
        >
          {{ $t('sector.managers.title') }}
        </h2>
        <section class="form-section__select-managers">
          <UnnnicInput
            v-if="!isEditing"
            v-model="sector.name"
            :label="$t('sector.name')"
            :placeholder="$t('sector.placeholder')"
          />
          <fieldset v-if="!enableGroupsMode">
            <UnnnicLabel
              class="form-section__label"
              :label="$t('sector.managers.add.label')"
            />
            <UnnnicSelectSmart
              v-model="selectedManager"
              :options="managersNames"
              autocomplete
              autocompleteIconLeft
              autocompleteClearOnFocus
              :enableSearchByValue="true"
              @update:model-value="selectManager"
            />
          </fieldset>
        </section>

        <section
          v-if="sector.managers.length > 0"
          class="form-sector-container__managers"
        >
          <SelectedMember
            v-for="manager in sector.managers"
            :key="manager.uuid"
            :name="`${manager.user.first_name} ${manager.user.last_name}`"
            :email="manager.user.email"
            :avatarUrl="photo(manager.user.photo_url)"
            :roleName="$t('manager')"
            @remove="removeManager(manager.uuid)"
          />
        </section>
      </section>
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
            <UnnnicSelectSmart
              v-if="copyWorkday"
              :modelValue="copyWorkdaySector"
              :options="sectorsOptions"
              autocomplete
              autocompleteIconLeft
              autocompleteClearOnFocus
              @update:model-value="selectCopyWorkdaySector"
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
            <section class="form-section__inputs__workday-time-config">
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
            <fieldset>
              <UnnnicLabel :label="$t('sector.link.label')" />
              <UnnnicSelectSmart
                v-model="selectedProject"
                :options="projectsNames"
                autocomplete
                autocompleteIconLeft
                autocompleteClearOnFocus
                :disabled="isEditing"
                @update:model-value="selectProject"
              />
            </fieldset>
            <UnnnicDisclaimer
              v-if="isEditing"
              class="link-project-disclaimer"
              :description="$t('sector.link.editing_disclaimer')"
              type="attention"
            />
            <UnnnicDisclaimer
              v-else-if="
                selectedProject.length && selectedProjectHasSectorIntegration
              "
              class="link-project-disclaimer"
              :description="$t('sector.link.has_linked_project')"
              type="attention"
            />
          </section>

          <UnnnicInput
            v-else
            v-model="sector.maxSimultaneousChatsByAgent"
            :label="$t('sector.managers.working_day.limit_agents.label')"
            placeholder="4"
            class="form-section__inputs--fill-w"
          />
        </section>
      </section>
    </form>
    <section
      v-show="isEditing"
      class="form-actions"
    >
      <UnnnicButton
        :text="$t('cancel')"
        type="tertiary"
        data-testid="cancel-button"
        @click.stop="$router.push('/settings')"
      />
      <UnnnicButton
        :text="$t('save')"
        :disabled="initialFormState || !validForm"
        data-testid="general-save-button"
        @click.stop="saveSector()"
      />
    </section>
    <CountryHolidaysModal
      v-if="showCountryHolidaysModal"
      :holidays="allCountryHolidays"
      :enableHolidays="enableCountryHolidays"
      :isEditing="isEditing"
      :sectorUuid="sector.uuid"
      @update:enable-holidays="enableCountryHolidays = $event"
      @update:disabled-holidays="disabledCountryHolidays = $event"
      @close="handleModal('showCountryHolidaysModal', false)"
    />
    <CustomHolidaysModal
      v-if="showCustomHolidaysModal"
      :holidays="enableCustomHolidays"
      :isEditing="isEditing"
      :sectorUuid="sector.uuid"
      @save="handleSaveCustomHolidays"
      @close="handleModal('showCustomHolidaysModal', false)"
    />
    <CreateCustomHolidayModal
      v-if="showCreateCustomHolidayModal"
      :isEditing="isEditing"
      :sectorUuid="sector.uuid"
      @add-custom-holidays="addCustomHolidays"
      @close="handleModal('showCreateCustomHolidayModal', false)"
    />
  </section>
</template>

<script>
import { mapActions, mapState } from 'pinia';
import { useSettings } from '@/store/modules/settings';

import SelectedMember from '@/components/settings/forms/SelectedMember.vue';
import Sector from '@/services/api/resources/settings/sector';
import Project from '@/services/api/resources/settings/project';
import Group from '@/services/api/resources/settings/group';

import WorkdayTimeConfig from '@/components/settings/forms/WorkdayTimeConfig.vue';
import CountryHolidaysModal from './modals/CountryHolidaysModal.vue';
import CustomHolidaysModal from './modals/CustomHolidaysModal.vue';
import CreateCustomHolidayModal from './modals/CreateCustomHolidayModal.vue';

import { useProfile } from '@/store/modules/profile';
import { useConfig } from '@/store/modules/config';

import i18n from '@/plugins/i18n';

import unnnic from '@weni/unnnic-system';
import { removeDuplicatedItems } from '@/utils/array';

const emptyWorkdayTime = {
  start: '',
  end: '',
  valid: false,
};

export default {
  name: 'FormSector',

  components: {
    SelectedMember,
    CountryHolidaysModal,
    CustomHolidaysModal,
    CreateCustomHolidayModal,
    WorkdayTimeConfig,
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
  emits: ['update:modelValue', 'submit', 'changeIsValid'],

  data() {
    return {
      useDefaultSector: 0,
      selectedManager: [],
      selectedProject: [],
      removedManagers: [],
      managers: [],
      projects: [],
      openModalDelete: false,
      managersPage: 0,
      managersLimitPerPage: 20,
      projectUsersPage: 0,
      projectUsersPerPage: 50,
      secondaryProjectsPage: 0,
      secondaryProjectsLimitPerPage: 50,
      copyWorkday: false,
      copyWorkdaySector: [],
      selectedWorkdayDays: {
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: false,
        saturday: false,
        sunday: false,
      },
      selectedWorkdayDaysTime: {
        monday: [JSON.parse(JSON.stringify(emptyWorkdayTime))],
        tuesday: [JSON.parse(JSON.stringify(emptyWorkdayTime))],
        wednesday: [JSON.parse(JSON.stringify(emptyWorkdayTime))],
        thursday: [JSON.parse(JSON.stringify(emptyWorkdayTime))],
        friday: [JSON.parse(JSON.stringify(emptyWorkdayTime))],
        saturday: [JSON.parse(JSON.stringify(emptyWorkdayTime))],
        sunday: [JSON.parse(JSON.stringify(emptyWorkdayTime))],
      },
      showCountryHolidaysModal: false,
      showCustomHolidaysModal: false,
      showAddCustomHolidaysModal: false,
      countryCode: '',
      selectAllCountryHolidays: false,
      allCountryHolidays: [],
      enableCountryHolidays: [],
      disabledCountryHolidays: [],
      enableCustomHolidays: [],
      showCreateCustomHolidayModal: false,
      initialFormState: true,
      isInitializing: true,
    };
  },

  computed: {
    ...mapState(useProfile, ['me']),
    ...mapState(useConfig, ['enableGroupsMode', 'project']),
    ...mapState(useSettings, ['sectors']),

    sectorPlaceholder() {
      return {
        value: '',
        label: this.$t('sector.managers.working_day.select_sector_to_copy'),
      };
    },

    sectorsOptions() {
      return [
        this.sectorPlaceholder,
        ...this.sectors.map((sector) => ({
          value: sector.uuid,
          label: sector.name,
        })),
      ];
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
      if (this.selectedProject?.[0]?.value) {
        const project = this.projects.find(
          (project) => this.selectedProject[0].value === project.uuid,
        );

        return !!project?.has_sector_integration;
      }
      return false;
    },

    managersNames() {
      const managersNames = [
        {
          value: '',
          label: this.$t('sector.managers.add.placeholder'),
        },
      ];

      this.managers.forEach((manager) => {
        const {
          user: { email, first_name, last_name },
          uuid,
        } = manager;

        managersNames.push({
          uuid,
          value: email,
          label: first_name || last_name ? `${first_name} ${last_name}` : email,
        });
      });

      return managersNames;
    },

    projectsNames() {
      const projectsNames = [
        {
          value: '',
          label: this.$t('sector.link.project_placeholder'),
        },
      ];

      this.projects.forEach((project) => {
        const { name, uuid } = project;
        projectsNames.push({ value: uuid, label: name });
      });

      return projectsNames;
    },

    sector: {
      get() {
        return this.modelValue;
      },
      set(sector) {
        this.$emit('update:modelValue', sector);
      },
    },

    validForm() {
      const { name, managers, maxSimultaneousChatsByAgent } = this.sector;

      const hasWorkday = this.workdayDaysTimeOptions.length >= 1;

      const selectedDaysWorkdayTimes = this.workdayDaysTimeOptions
        .map((day) => {
          if (this.selectedWorkdayDays[day]) {
            return this.selectedWorkdayDaysTime[day];
          }
          return [];
        })
        .flat();

      const validAllWorkdayTime = selectedDaysWorkdayTimes.every(
        (time) => time.valid,
      );

      const commonValid = !!(name.trim() && validAllWorkdayTime && hasWorkday);

      const groupValid =
        !!this.selectedProject.length &&
        (this.isEditing || !this.selectedProjectHasSectorIntegration);

      const singleValid = !!(
        managers.length > 0 && maxSimultaneousChatsByAgent
      );

      const valid = this.enableGroupsMode
        ? commonValid && groupValid
        : commonValid && singleValid;

      return valid;
    },
  },

  watch: {
    modelValue: {
      deep: true,
      handler() {
        this.handleFormChange();
      },
    },
    selectedWorkdayDays: {
      deep: true,
      handler() {
        this.handleFormChange();
      },
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
        this.handleFormChange();
      },
    },
    selectedProject: {
      deep: true,
      handler() {
        this.handleFormChange();
      },
    },
    copyWorkday(value) {
      this.copyWorkdaySector = [];
      if (!value && !this.copyWorkdaySector[0]?.value) {
        this.selectedWorkdayDays = {
          monday: false,
          tuesday: false,
          wednesday: false,
          thursday: false,
          friday: false,
          saturday: false,
          sunday: false,
        };
        this.selectedWorkdayDaysTime = JSON.parse(
          JSON.stringify({
            monday: [emptyWorkdayTime],
            tuesday: [emptyWorkdayTime],
            wednesday: [emptyWorkdayTime],
            thursday: [emptyWorkdayTime],
            friday: [emptyWorkdayTime],
            saturday: [emptyWorkdayTime],
            sunday: [emptyWorkdayTime],
          }),
        );
      }
      this.handleFormChange();
    },
    copyWorkdaySector: {
      deep: true,
      handler() {
        this.handleFormChange();
      },
    },
    enableCountryHolidays: {
      deep: true,
      handler(value) {
        this.handleFormChange();
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
    enableCustomHolidays: {
      deep: true,
      handler() {
        this.handleFormChange();
      },
    },
    validForm() {
      this.$emit('changeIsValid', this.validForm);
    },
  },

  async mounted() {
    await this.getCountryHolidays();

    if (this.sectors.length === 0) {
      await this.getSectors(true);
    }

    if (!this.isEditing) {
      await this.handleSelectAllCountryHolidays(true);
    } else {
      await this.getSectorAllHolidays();
      await this.getSectorWorktimes(this.sector.uuid);
    }

    const isDefaultSector =
      this.sector.name === i18n.global.t('config_chats.default_sector.name');

    if (this.isEditing && !this.enableGroupsMode) {
      await this.getSectorManagers();
    } else if (isDefaultSector) {
      this.useDefaultSector = 1;
    }

    if (!this.enableGroupsMode) await this.listProjectManagers();
    else {
      await this.listSecondaryProjects().then(() => {
        if (this.isEditing) {
          const secondaryProjectUuid = this.sector.config?.secondary_project;
          const selectedProject = this.projectsNames.find(
            (project) => project.value === secondaryProjectUuid,
          );
          if (selectedProject) this.selectedProject = [selectedProject];
        }
      });
    }
    this.$nextTick(() => {
      this.isInitializing = false;
    });
  },

  methods: {
    ...mapActions(useSettings, {
      actionDeleteSector: 'deleteSector',
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

    handleFormChange() {
      if (this.isEditing && !this.isInitializing) {
        this.initialFormState = false;
      }
    },

    async getCountryHolidays() {
      const { holidays, country_code } = await Sector.getCountryHolidays();
      this.countryCode = country_code;
      this.allCountryHolidays = holidays;
    },

    resetSelectedCopySector() {
      this.copyWorkdaySector = [this.sectorPlaceholder];
    },

    updateDefaultSectorValue(activate) {
      this.useDefaultSector = activate;
      const defaultWorkTime = { start: '08:00', end: '18:00', valid: true };
      if (activate) {
        this.selectedWorkdayDays = {
          monday: true,
          tuesday: true,
          wednesday: true,
          thursday: true,
          friday: true,
          saturday: false,
          sunday: false,
        };
        this.selectedWorkdayDaysTime = JSON.parse(
          JSON.stringify({
            monday: [defaultWorkTime],
            tuesday: [defaultWorkTime],
            wednesday: [defaultWorkTime],
            thursday: [defaultWorkTime],
            friday: [defaultWorkTime],
            saturday: [emptyWorkdayTime],
            sunday: [emptyWorkdayTime],
          }),
        );
        this.handleSelectAllCountryHolidays(true);
        const meManager = this.managers.find(
          (manager) => manager.user.email === this.me.email,
        );
        this.sector = {
          ...this.sector,
          name: this.$t('config_chats.default_sector.name'),
          maxSimultaneousChatsByAgent: this.enableGroupsMode ? '' : '4',
          managers: this.enableGroupsMode ? [] : [meManager],
        };
      } else {
        this.selectedWorkdayDays = {
          monday: false,
          tuesday: false,
          wednesday: false,
          thursday: false,
          friday: false,
          saturday: false,
          sunday: false,
        };
        this.selectedWorkdayDaysTime = JSON.parse(
          JSON.stringify({
            monday: [emptyWorkdayTime],
            tuesday: [emptyWorkdayTime],
            wednesday: [emptyWorkdayTime],
            thursday: [emptyWorkdayTime],
            friday: [emptyWorkdayTime],
            saturday: [emptyWorkdayTime],
            sunday: [emptyWorkdayTime],
          }),
        );
        this.handleSelectAllCountryHolidays(false);
        this.sector = {
          ...this.sector,
          name: '',
          maxSimultaneousChatsByAgent: '',
          managers: [],
        };
      }
    },

    async getSectorAllHolidays() {
      try {
        const allHolidays = await Sector.getAllSectorHolidays(this.sector.uuid);

        const countryHolidays = allHolidays.filter(
          (holiday) => !holiday.its_custom,
        );

        countryHolidays.forEach((holiday) => {
          const countryHoliday = this.allCountryHolidays.find(
            (countryHoliday) => countryHoliday.date === holiday.date,
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

        // handle  country holidays
        this.enableCountryHolidays = activeCountryHolidays.map(
          (holiday) => holiday.date,
        );
        this.disabledCountryHolidays = inactiveCountryHolidays.map(
          (holiday) => holiday.date,
        );

        // handle custom holidays
        this.enableCustomHolidays = customHolidays;
      } catch (error) {
        console.log(error);
      }
    },

    async getSectorManagers() {
      let hasNext = false;
      try {
        const offset = this.managersPage * this.managersLimitPerPage;
        const { next, results } = await Sector.managers(
          this.sector.uuid,
          offset,
          this.managersLimitPerPage,
        );
        hasNext = next;
        this.managersPage += 1;
        const concatManagers = this.sector.managers.concat(
          results.map((manager) => ({
            ...manager,
            removed: false,
          })),
        );
        this.sector.managers = removeDuplicatedItems(concatManagers, 'uuid');
      } finally {
        if (hasNext) {
          this.getSectorManagers();
        }
      }
    },

    async getSectorWorktimes(sector) {
      const sectorWorktimes = await Sector.getWorkingTimes(sector);
      const schedules = sectorWorktimes?.working_hours?.schedules;

      if (schedules) {
        Object.keys(schedules).forEach((day) => {
          if (!schedules[day]) {
            this.selectedWorkdayDays[day] = false;
            this.selectedWorkdayDaysTime[day] = [emptyWorkdayTime];
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

    async selectCopyWorkdaySector([selectedSector]) {
      if (
        selectedSector.value &&
        selectedSector.value !== this.copyWorkdaySector?.[0]?.value
      ) {
        this.copyWorkdaySector = [selectedSector];
        await this.getSectorWorktimes(selectedSector.value);
      }
    },

    async removeManager(managerUuid) {
      if (this.isEditing) await Sector.removeManager(managerUuid);

      this.removeManagerFromTheList(managerUuid);
    },

    removeManagerFromTheList(managerUuid) {
      const manager = this.sector.managers.find(
        (manager) => manager.uuid === managerUuid,
      );

      this.removedManagers.push(manager);
      this.sector.managers = this.sector.managers.filter(
        (manager) => manager.uuid !== managerUuid,
      );
    },

    selectManager(selectedManager) {
      if (selectedManager.length > 0) {
        const manager = this.managers.find((manager) => {
          const { uuid } = manager;

          return uuid === selectedManager[0].uuid;
        });
        this.addSectorManager(manager);
      }
    },

    selectProject(selectedProject) {
      this.sector.config.secondary_project = selectedProject[0].value;
    },

    photo(link) {
      if (![null, undefined, ''].includes(link)) {
        const getOnlyPhoto = link.split('?')[0];
        return getOnlyPhoto;
      }
      return link;
    },

    addSectorManager(manager) {
      if (manager) {
        const managers = this.sector.managers.some(
          (mappedManager) => mappedManager.user.email === manager.user.email,
        )
          ? this.sector.managers
          : [...this.sector.managers, manager];

        this.sector.managers = managers;

        if (this.isEditing) this.addManager(manager);

        this.selectedManager = [];
      }
    },

    async addManager(manager) {
      await Sector.addManager(this.sector.uuid, manager.uuid);
      this.getSectorManagers();
    },

    async listProjectManagers() {
      let hasNext = false;
      try {
        const offset = this.projectUsersPage * this.projectUsersPerPage;
        const { results, next } = await Project.managers(
          offset,
          this.projectUsersPerPage,
        );
        this.projectUsersPage += 1;
        this.managers = this.managers.concat(results);

        hasNext = next;
      } finally {
        if (hasNext) {
          this.listProjectManagers();
        }
      }
    },

    async listSecondaryProjects() {
      let hasNext = false;
      try {
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

        hasNext = next;
      } catch (error) {
        console.error(error);
      } finally {
        if (hasNext) {
          this.listSecondaryProjects();
        }
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

    hourValidate(hour) {
      const inicialHour = hour.start;
      const finalHour = hour.end;

      if (inicialHour >= finalHour) {
        this.validHour = false;
        this.message =
          !inicialHour && !finalHour
            ? ''
            : this.$t('config_chats.edit_sector.invalid_hours');
      } else {
        this.validHour = true;
      }
    },

    async saveSector() {
      const {
        uuid,
        name,
        can_trigger_flows,
        can_edit_custom_fields,
        config,
        sign_messages,
        maxSimultaneousChatsByAgent,
        is_csat_enabled,
      } = this.sector;

      const sector = {
        name,
        can_trigger_flows,
        can_edit_custom_fields,
        config,
        sign_messages,
        rooms_limit: maxSimultaneousChatsByAgent,
        is_csat_enabled,
      };

      try {
        await Sector.update(uuid, sector);
        await this.saveWorkingDays();
        unnnic.unnnicCallAlert({
          props: {
            text: this.$t('sector_update_success'),
            type: 'success',
          },
          seconds: 5,
        });
        this.$router.push('/settings');
      } catch (error) {
        unnnic.unnnicCallAlert({
          props: {
            text: this.$t('sector_update_error'),
            type: 'error',
          },
          seconds: 5,
        });
        console.log(error);
      }
    },

    async saveWorkingDays() {
      const requestBody = {};

      Object.keys(this.selectedWorkdayDaysTime).forEach((day) => {
        requestBody[day] = this.selectedWorkdayDays[day]
          ? this.selectedWorkdayDaysTime[day].map((time) => ({
              start: time.start,
              end: time.end,
            }))
          : null;
      });

      await Sector.setSectorWorkingDays(this.sector.uuid, requestBody);
    },

    selectWorkdayDay(day) {
      this.selectedWorkdayDays[day] = !this.selectedWorkdayDays[day];
      if (!this.selectedWorkdayDays[day]) {
        this.selectedWorkdayDaysTime[day] = [emptyWorkdayTime];
      }
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
      await Sector.createCountryHolidays(this.sector.uuid, {
        enabled_holidays: this.enableCountryHolidays,
        disabled_holidays: this.disabledCountryHolidays,
      });
    },

    async createCustomHolidays() {
      const promisesCreateSectorHoliday = this.enableCustomHolidays.map(
        (holiday) =>
          Sector.createSectorHoliday(this.sector.uuid, {
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
fieldset {
  border: none;
  padding: 0;
  margin: 0;
}

.form-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 600px;

  &__radios {
    display: flex;
    gap: $unnnic-spacing-sm;
    margin-bottom: $unnnic-spacing-sm;
  }
}

.form-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  background-color: white;
  padding: $unnnic-spacing-sm;

  gap: $unnnic-spacing-sm;

  > * {
    flex: 1;
  }
}

.form-sector-container {
  flex: 1;
  overflow-y: auto;
  padding-bottom: $unnnic-spacing-awesome; // This padding is to prevent the content from being hidden

  .form-section {
    & + .form-section {
      margin-top: $unnnic-spacing-md;
    }

    &.group-mode {
      margin-top: 0px;
    }

    &__select-managers {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: $unnnic-spacing-sm;
    }

    &__title {
      font: $unnnic-font-display-3;
      color: $unnnic-color-gray-900;
    }

    &__subtitle {
      font-weight: $unnnic-font-weight-regular;
      color: $unnnic-color-neutral-dark;
      line-height: $unnnic-line-height-large * 1.5;
      font-family: $unnnic-font-family-secondary;
    }

    &__inputs {
      display: grid;
      gap: $unnnic-spacing-ant $unnnic-spacing-stack-sm;
      grid-template-rows: auto;
      grid-template-columns: 1fr 1fr;

      &__workday-copy {
        display: flex;
        flex-direction: column;
        gap: $unnnic-spacing-sm;
        margin-top: $unnnic-spacing-sm;
      }

      &__workday-tags {
        display: flex;
        gap: $unnnic-spacing-xs;
        &__tag {
          height: 32px;
        }
      }

      &__workday-time-config {
        display: flex;
        flex-direction: column;
        gap: $unnnic-spacing-sm;

        &__holidays-container {
          display: flex;
          align-items: center;
          gap: $unnnic-spacing-xs;

          &__button {
            max-width: 200px;
          }
        }
      }

      &--fill-w {
        grid-column: span 2;
      }
    }

    &__handlers {
      margin-top: $unnnic-spacing-md;
      button {
        width: 100%;
      }
    }
  }

  &__managers {
    margin-top: $unnnic-spacing-nano;
    display: flex;
    flex-direction: column;
    gap: $unnnic-spacing-nano;
    max-height: 250px;
    overflow-y: auto;
  }

  .link-project-disclaimer {
    display: flex;
    margin-top: $unnnic-spacing-ant;
  }
}

.form-section__label {
  margin-bottom: $unnnic-space-1;
}
</style>
