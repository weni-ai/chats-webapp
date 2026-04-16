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
      @submit.prevent="$emit('submit')"
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

<script>
import { mapState } from 'pinia';
import { ref, watch } from 'vue';

import { useForm } from '@/composables/useForm';

import Sector from '@/services/api/resources/settings/sector';
import Project from '@/services/api/resources/settings/project';
import TagGroup from '@/components/TagGroup.vue';
import FillDefaultOption from './FillDefaultOption.vue';
import SectorWorkingDaySection from './SectorWorkingDaySection.vue';

import { useProfile } from '@/store/modules/profile';
import { useConfig } from '@/store/modules/config';

import i18n from '@/plugins/i18n';

import unnnic from '@weni/unnnic-system';
import { removeDuplicatedItems } from '@/utils/array';

export default {
  name: 'FormSector',

  components: {
    TagGroup,
    FillDefaultOption,
    SectorWorkingDaySection,
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
  emits: [
    'update:modelValue',
    'submit',
    'changeIsValid',
    'hasChangesWorkday',
    'sectorFormInitialSync',
  ],

  setup(_props, { emit }) {
    const workdayState = ref({
      workdayDaysTimeOptions: [],
      selectedWorkdayDays: {},
      selectedWorkdayDaysTime: {},
      selectedProject: null,
      selectedProjectHasSectorIntegration: false,
    });

    const {
      hasChanges: hasWorkdayChanges,
      resetBaseline: resetWorkdayBaseline,
    } = useForm({
      source: workdayState,
    });

    watch(
      hasWorkdayChanges,
      (dirty) => {
        emit('hasChangesWorkday', dirty);
      },
      { immediate: true },
    );

    return {
      workdayState,
      resetWorkdayBaseline,
    };
  },

  data() {
    return {
      useDefaultSector: 0,
      selectedManager: null,
      removedManagers: [],
      managers: [],
      searchManager: '',
      openModalDelete: false,
      managersPage: 0,
      managersLimitPerPage: 20,
      projectUsersPage: 0,
      projectUsersPerPage: 50,
    };
  },

  computed: {
    ...mapState(useProfile, ['me']),
    ...mapState(useConfig, ['enableGroupsMode', 'project']),

    managersTags() {
      return this.sector.managers.map((manager) => {
        const {
          user: { first_name, last_name, email },
        } = manager;
        const managerName = `${first_name} ${last_name}`.trim();
        const formattedName = managerName ? `${managerName} (${email})` : email;
        return { uuid: manager.uuid, name: formattedName };
      });
    },

    managersNames() {
      return this.managers.map((manager) => {
        const {
          user: { email, first_name, last_name },
          uuid,
        } = manager;

        return {
          uuid,
          value: email,
          label: first_name || last_name ? `${first_name} ${last_name}` : email,
        };
      });
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
      const { name, managers, rooms_limit } = this.sector;

      const {
        workdayDaysTimeOptions,
        selectedWorkdayDays,
        selectedWorkdayDaysTime,
        selectedProject,
        selectedProjectHasSectorIntegration,
      } = this.workdayState;

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
        (this.isEditing || !selectedProjectHasSectorIntegration);

      const singleValid = !!(managers.length > 0 && rooms_limit);

      const valid = this.enableGroupsMode
        ? commonValid && groupValid
        : commonValid && singleValid;

      this.$emit('changeIsValid', valid);

      return valid;
    },
  },

  watch: {
    selectedManager(option) {
      if (option?.uuid) {
        this.addSelectedManager(option);
      }
    },
  },

  async mounted() {
    const isDefaultSector =
      this.sector.name === i18n.global.t('config_chats.default_sector.name');

    if (this.isEditing && !this.enableGroupsMode) {
      this.getSectorManagers();
    } else if (isDefaultSector) {
      this.useDefaultSector = 1;
    }

    if (!this.enableGroupsMode) await this.listProjectManagers();
  },

  methods: {
    onSectorWorkingDayInitialLoadComplete() {
      this.$nextTick(() => {
        this.resetWorkdayBaseline();
        this.$emit('sectorFormInitialSync');
      });
    },

    updateDefaultSectorValue(activate) {
      this.useDefaultSector = activate;
      const defaultWorkTime = { start: '08:00', end: '18:00', valid: true };
      if (activate) {
        this.$refs.workingDaySection?.applyDefaultWorkdayActivate(
          defaultWorkTime,
        );
        this.$refs.workingDaySection?.handleSelectAllCountryHolidays(true);
        const meManager = this.managers.find(
          (manager) => manager.user.email === this.me.email,
        );
        this.sector = {
          ...this.sector,
          name: this.$t('config_chats.default_sector.name'),
          rooms_limit: this.enableGroupsMode ? '' : '4',
          managers: this.enableGroupsMode ? [] : [meManager],
        };
      } else {
        this.$refs.workingDaySection?.applyDefaultWorkdayDeactivate();
        this.$refs.workingDaySection?.handleSelectAllCountryHolidays(false);
        this.sector = {
          ...this.sector,
          name: '',
          rooms_limit: '',
          managers: [],
        };
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

    addSelectedManager(option) {
      if (option?.uuid) {
        const manager = this.managers.find((m) => m.uuid === option.uuid);
        this.addSectorManager(manager);
        this.selectedManager = null;
      }
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

        this.selectedManager = null;
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
        rooms_limit,
        is_csat_enabled,
      } = this.sector;

      const sector = {
        name,
        can_trigger_flows,
        can_edit_custom_fields,
        config,
        sign_messages,
        rooms_limit,
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
      const requestBody =
        this.$refs.workingDaySection?.getWorkingDaysRequestBody() ?? {};

      await Sector.setSectorWorkingDays(this.sector.uuid, requestBody);
    },

    async initCountryHolidays() {
      await this.$refs.workingDaySection?.initCountryHolidays();
    },

    async createCustomHolidays() {
      await this.$refs.workingDaySection?.createCustomHolidays();
    },
  },
};
</script>

<style lang="scss" scoped>
.form-wrapper {
  display: flex;
  flex-direction: column;
  gap: $unnnic-space-4;
  min-height: 600px;
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
}

.form-section__label {
  margin-bottom: $unnnic-space-1;
}
</style>
