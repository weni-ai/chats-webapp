<template>
  <section class="form-wrapper">
    <section
      v-if="!isEditing"
      class="form-wrapper__radios"
    >
      <UnnnicRadio
        size="sm"
        :modelValue="useDefaultSector"
        :value="0"
        data-testid="disable-default-sector-config"
        @update:model-value="updateDefaultSectorValue"
      >
        {{ $t('config_chats.custom_sector') }}
      </UnnnicRadio>
      <UnnnicRadio
        :modelValue="useDefaultSector"
        size="sm"
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
            <UnnnicLabel :label="$t('sector.managers.add.label')" />
            <UnnnicSelectSmart
              v-model="selectedManager"
              :options="managersNames"
              autocomplete
              autocompleteIconLeft
              autocompleteClearOnFocus
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
      <section class="form-section">
        <h2 class="form-section__title">
          {{ $t('sector.managers.working_day.title') }}
        </h2>
        <section class="form-section__inputs">
          <fieldset>
            <p class="label-working-day">
              {{ $t('sector.managers.working_day.start.label') }}
            </p>
            <input
              v-model="sector.workingDay.start"
              class="input-time"
              type="time"
              min="00:00"
              max="23:59"
            />
            <span
              v-show="!validHour"
              class="error-message"
            >
              {{ message }}
            </span>
          </fieldset>
          <fieldset>
            <p class="label-working-day">
              {{ $t('sector.managers.working_day.end.label') }}
            </p>
            <input
              v-model="sector.workingDay.end"
              class="input-time"
              type="time"
              min="00:00"
              max="23:59"
            />
          </fieldset>
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
                :options="[]"
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
              :text="$t('sector.link.editing_disclaimer')"
              iconColor="feedback-yellow"
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
        :disabled="!validForm"
        data-testid="general-save-button"
        @click.stop="saveSector()"
      />
    </section>
  </section>
</template>

<script>
import { mapActions, mapState } from 'pinia';
import { useSettings } from '@/store/modules/settings';
import unnnic from '@weni/unnnic-system';
import SelectedMember from '@/components/settings/forms/SelectedMember.vue';
import Sector from '@/services/api/resources/settings/sector';
import Project from '@/services/api/resources/settings/project';
import { useProfile } from '@/store/modules/profile';
import { useConfig } from '@/store/modules/config';

export default {
  name: 'FormSector',

  components: {
    SelectedMember,
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
      managersPage: 0,
      selectedManager: [],
      selectedProject: [],
      removedManagers: [],
      message: '',
      managers: [],
      validHour: false,
      openModalDelete: false,
      agentsLimitPerPage: 50,
    };
  },

  computed: {
    ...mapState(useProfile, ['me']),
    ...mapState(useConfig, ['enableGroupsMode']),
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
          value: uuid,
          label: first_name || last_name ? `${first_name} ${last_name}` : email,
        });
      });

      return managersNames;
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
      const { name, managers, workingDay, maxSimultaneousChatsByAgent } =
        this.sector;

      this.hourValidate(workingDay);

      const commonValid = !!(
        name.trim() &&
        workingDay?.start &&
        workingDay?.end &&
        this.validHour
      );

      const groupValid = !!this.selectedProject.length;

      const singleValid = !!(
        managers.length > 0 && maxSimultaneousChatsByAgent
      );

      const valid = this.enableGroupsMode
        ? commonValid && groupValid
        : commonValid && singleValid;

      this.$emit('changeIsValid', valid);

      return valid;
    },
  },

  mounted() {
    if (this.isEditing) {
      if (!this.enableGroupsMode) this.getSectorManagers();
    } else if (
      this.sector.name === this.$t('config_chats.default_sector.name')
    ) {
      this.useDefaultSector = 1;
    }
    if (!this.enableGroupsMode) this.listProjectManagers();
  },

  methods: {
    ...mapActions(useSettings, {
      actionDeleteSector: 'deleteSector',
    }),
    updateDefaultSectorValue(activate) {
      this.useDefaultSector = activate;
      if (activate) {
        const meManager = this.managers.find(
          (manager) => manager.user.email === this.me.email,
        );
        this.sector = {
          ...this.sector,
          name: this.$t('config_chats.default_sector.name'),
          workingDay: {
            start: '08:00',
            end: '18:00',
            dayOfWeek: 'week-days',
          },
          maxSimultaneousChatsByAgent: this.enableGroupsMode ? '' : '4',
          managers: this.enableGroupsMode ? [] : [meManager],
        };
      } else {
        this.sector = {
          ...this.sector,
          name: '',
          workingDay: {
            start: '',
            end: '',
            dayOfWeek: '',
          },
          maxSimultaneousChatsByAgent: '',
          managers: [],
        };
      }
    },

    async getSectorManagers() {
      const managers = await Sector.managers(this.sector.uuid);
      this.sector.managers = managers.results.map((manager) => ({
        ...manager,
        removed: false,
      }));
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

    selectProject(selectedProject) {
      // TODO
    },

    selectManager(selectedManager) {
      if (selectedManager.length > 0) {
        const manager = this.managers.find((manager) => {
          const { uuid } = manager;

          return uuid === selectedManager[0].value;
        });
        this.addSectorManager(manager);
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

        this.selectedManager = [this.managersNames[0]];
      }
    },

    async addManager(manager) {
      await Sector.addManager(this.sector.uuid, manager.uuid);
      this.getSectorManagers();
    },

    async listProjectManagers() {
      let hasNext = false;
      try {
        const offset = this.managersPage * this.agentsLimitPerPage;
        const { results, next } = await Project.managers(
          offset,
          this.agentsLimitPerPage,
        );
        this.managersPage += 1;
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

    saveSector() {
      const {
        uuid,
        name,
        can_trigger_flows,
        can_edit_custom_fields,
        config,
        sign_messages,
        workingDay,
        maxSimultaneousChatsByAgent,
      } = this.sector;

      const sector = {
        name,
        can_trigger_flows,
        can_edit_custom_fields,
        config,
        sign_messages,
        work_start: workingDay.start,
        work_end: workingDay.end,
        rooms_limit: maxSimultaneousChatsByAgent,
      };

      Sector.update(uuid, sector)
        .then(() => {
          unnnic.unnnicCallAlert({
            props: {
              text: this.$t('sector_update_success'),
              type: 'success',
            },
            seconds: 5,
          });
          this.$router.push('/settings');
        })
        .catch((error) => {
          unnnic.unnnicCallAlert({
            props: {
              text: this.$t('sector_update_error'),
              type: 'error',
            },
            seconds: 5,
          });
          console.log(error);
        });
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

    &__select-managers {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: $unnnic-spacing-sm;
    }

    &__title {
      font-weight: $unnnic-font-weight-bold;
      color: $unnnic-color-neutral-dark;
      font-size: $unnnic-font-size-body-lg;
      line-height: $unnnic-line-height-large * 1.5;
    }

    &__inputs {
      display: grid;
      gap: $unnnic-spacing-ant $unnnic-spacing-stack-sm;
      grid-template-rows: auto;
      grid-template-columns: 1fr 1fr;

      &--fill-w {
        grid-column: span 2;
      }

      > fieldset {
        border: none;
        padding: 0;
        margin: 0;
        & .error-message {
          font-size: $unnnic-font-size-body-md;
          color: $unnnic-color-feedback-red;
        }
      }
    }

    &__handlers {
      margin-top: $unnnic-spacing-md;
      button {
        width: 100%;
      }
    }
  }

  .input-time {
    background: #fff;
    border: 1px solid $unnnic-color-neutral-soft;
    border-radius: $unnnic-border-radius-sm;
    color: $unnnic-color-neutral-dark;
    box-sizing: border-box;
    width: 100%;
    font-size: $unnnic-font-size-body-gt;
    line-height: $unnnic-line-height-large * 1.375;
    padding: $unnnic-spacing-ant $unnnic-spacing-sm;
    cursor: text;
  }

  .label-working-day {
    line-height: $unnnic-line-height-large * 1.375;
    font-size: $unnnic-font-size-body-gt;
    color: $unnnic-color-neutral-cloudy;
    margin: $unnnic-spacing-xs 0;
  }

  input:focus {
    outline-color: $unnnic-color-neutral-clean;
    outline: 1px solid $unnnic-color-neutral-clean;
  }

  &__managers {
    margin-top: $unnnic-spacing-nano;
    display: flex;
    flex-direction: column;
    gap: $unnnic-spacing-nano;
  }

  ::placeholder {
    color: #d1d4da;
  }

  input::-webkit-datetime-edit {
    min-width: 100%;
    width: 100%;
  }

  .link-project-disclaimer {
    display: flex;
    margin-top: $unnnic-spacing-ant;
  }
}
</style>
