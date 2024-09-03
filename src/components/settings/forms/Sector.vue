<template>
  <section class="form-wrapper">
    <form
      class="form-sector-container"
      @submit.prevent="$emit('submit')"
    >
      <section
        v-if="!isEditing"
        class="form-section"
        data-testid="sector-name-section"
      >
        <h2 class="title">
          {{ $t('sector.add') }}
          <UnnnicToolTip
            enabled
            :text="$t('new_sector.sector_tip')"
            side="right"
            maxWidth="21rem"
          >
            <UnnnicIconSvg
              icon="information-circle-4"
              scheme="neutral-soft"
              size="sm"
            />
          </UnnnicToolTip>
        </h2>

        <UnnnicInput
          v-model="sector.name"
          :label="$t('sector.name')"
          :placeholder="$t('sector.placeholder')"
        />
      </section>

      <section class="form-section">
        <h2 class="form-section__title">
          {{ $t('sector.managers.title') }}
        </h2>

        <section class="form-section__select-managers">
          <UnnnicLabel :label="$t('sector.managers.add.label')" />
          <UnnnicSelectSmart
            v-model="selectedManager"
            :options="managersNames"
            autocomplete
            autocompleteIconLeft
            autocompleteClearOnFocus
            @update:model-value="selectManager"
          />
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

          <!-- New field will be inserted here -->
          <fieldset></fieldset>

          <UnnnicInput
            v-model="sector.maxSimultaneousChatsByAgent"
            :label="$t('sector.managers.working_day.limit_agents.label')"
            placeholder="4"
            class="form-section__inputs--fill-w"
          />
        </section>
        <section class="form-section__handlers">
          <UnnnicButton
            v-if="isEditing"
            :text="$t('delete_sector')"
            type="tertiary"
            iconLeft="delete"
            size="small"
            data-testid="open-modal-delete-button"
            @click.stop="openModalDelete = true"
          />
        </section>
        <UnnnicModalNext
          v-if="openModalDelete"
          type="alert"
          icon="alert-circle-1"
          scheme="feedback-red"
          :title="$t('delete_sector') + ` ${sector.name}`"
          :description="$t('cant_revert')"
          :validate="`${sector.name}`"
          :validatePlaceholder="`${sector.name}`"
          :validateLabel="$t('confirm_typing') + ` &quot;${sector.name}&quot;`"
          :actionPrimaryLabel="$t('confirm')"
          :actionSecondaryLabel="$t('cancel')"
          data-testid="modal-delete-sector"
          @click-action-primary="deleteSector(sector.uuid)"
          @click-action-secondary="openModalDelete = false"
        />
      </section>
    </form>
    <section class="form-actions">
      <UnnnicButton
        :text="$t('cancel')"
        type="tertiary"
        @click.stop="$router.push('/settings')"
      />
      <UnnnicButton
        :text="$t('save')"
        :disabled="!validForm"
        data-testid="save-button"
        @click.stop="saveSector()"
      />
    </section>
  </section>
</template>

<script>
import { mapActions } from 'pinia';
import { useSettings } from '@/store/modules/settings';
import unnnic from '@weni/unnnic-system';
import SelectedMember from '@/components/settings/forms/SelectedMember.vue';
import Sector from '@/services/api/resources/settings/sector';
import Project from '@/services/api/resources/settings/project';

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
      default: () => ({}),
    },
  },
  emits: ['update:modelValue', 'submit'],

  data() {
    return {
      selectedManager: [],
      removedManagers: [],
      message: '',
      managers: [],
      validHour: false,
      openModalDelete: false,
    };
  },

  computed: {
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

      return !!(
        name.trim() &&
        managers.length > 0 &&
        workingDay?.start &&
        workingDay?.end &&
        this.validHour &&
        maxSimultaneousChatsByAgent
      );
    },
  },

  mounted() {
    if (this.isEditing) {
      console.log('aq');
      this.getSectorManagers();
    }

    this.listProjectManagers();
  },

  methods: {
    ...mapActions(useSettings, {
      actionDeleteSector: 'deleteSector',
    }),

    async getSectorManagers() {
      const managers = await Sector.managers(this.sector.uuid);
      this.sector.managers = managers.results.map((manager) => ({
        ...manager,
        removed: false,
      }));
    },

    async removeManager(managerUuid) {
      await Sector.removeManager(managerUuid);
      this.removeManagerFromTheList(managerUuid);
    },

    removeManagerFromTheList(managerUuid) {
      const manager = this.sector.managers.find(
        (manager) => manager.uuid === managerUuid,
      );

      if (!manager) return;

      this.removedManagers.push(manager);
      this.sector.managers = this.sector.managers.filter(
        (manager) => manager.uuid !== managerUuid,
      );
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

        this.sector = {
          ...this.sector,
          managers,
        };
        if (this.isEditing) this.addManager(manager);
        this.selectedManager = [this.managersNames[0]];
      }
    },

    async addManager(manager) {
      await Sector.addManager(this.sector.uuid, manager.uuid);
      this.getSectorManagers();
    },

    async listProjectManagers() {
      // Currently these requests return the same data because of their disabled filters

      // const managers = (await Project.managers()).results.concat(
      //   (await Project.admins()).results,
      // );

      const managers = await Project.managers();

      this.managers = managers.results;
    },

    hourValidate(hour) {
      const inicialHour = hour.start;
      const finalHour = hour.end;
      if (inicialHour >= finalHour) {
        this.validHour = false;
        this.message =
          'Horário de início não pode ser maior/igual que horário final';
      } else {
        this.validHour = true;
      }
    },

    async deleteSector(sectorUuid) {
      try {
        await this.actionDeleteSector(sectorUuid);
        this.openModalDelete = false;
        this.$router.push({ name: 'sectors' });
        unnnic.unnnicCallAlert({
          props: {
            text: this.$t('sector_deleted_success'),
            type: 'success',
          },
          seconds: 5,
        });
      } catch (error) {
        console.log(error);
        this.openModalDelete = false;
        unnnic.unnnicCallAlert({
          props: {
            text: this.$t('sector_delete_error'),
            type: 'error',
          },
          seconds: 5,
        });
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
.form-wrapper {
  display: flex;
  flex-direction: column;
}

.form-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  background-color: white;
  padding-top: $unnnic-spacing-md;

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

    &__title {
      font-weight: $unnnic-font-weight-bold;
      color: $unnnic-color-neutral-dark;
      font-size: $unnnic-font-size-body-lg;
      line-height: $unnnic-line-height-large * 1.5;
    }

    &__inputs {
      display: grid;
      gap: $unnnic-spacing-ant $unnnic-spacing-stack-sm;
      grid-template-columns: 1fr 1fr;

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
    margin-top: $unnnic-spacing-inline-md;
    display: flex;
    flex-direction: column;
    gap: $unnnic-spacing-stack-xs;
  }

  ::placeholder {
    color: #d1d4da;
  }

  input::-webkit-datetime-edit {
    min-width: 100%;
    width: 100%;
  }
}
</style>
