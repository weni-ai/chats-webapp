<!-- eslint-disable vuejs-accessibility/form-control-has-label -->
<template>
  <form
    class="form-sector"
    @submit.prevent="$emit('submit')"
  >
    <section
      v-if="isEditing"
      class="form-section"
    >
      <h2
        v-if="sector.name"
        class="title--lg"
      >
        {{ sector.name }}
      </h2>
    </section>

    <section
      v-else
      class="form-section"
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
      <h2 class="title">
        {{ $t('sector.managers.title') }}
        <UnnnicToolTip
          enabled
          :text="$t('new_sector.agent_tip')"
          side="right"
          maxWidth="15rem"
        >
          <UnnnicIconSvg
            icon="information-circle-4"
            scheme="neutral-soft"
            size="sm"
          />
        </UnnnicToolTip>
      </h2>

      <div class="inline-input-and-button">
        <div>
          <UnnnicLabel :label="$t('sector.managers.add.label')" />
          <UnnnicSelectSmart
            v-model="selectedManager"
            :options="managersNames"
            autocomplete
            autocompleteIconLeft
            autocompleteClearOnFocus
            @update:model-value="selectManager"
          />
        </div>
        <!-- <unnnic-button
          text="Selecionar"
          type="secondary"
          @click="addSectorManager"
          :disabled="!selectedManager"
        /> -->
      </div>

      <section
        v-if="sector.managers.length > 0"
        class="form-sector__managers"
      >
        <SelectedMember
          v-for="manager in sector.managers"
          :key="manager.uuid"
          :name="`${manager.user.first_name} ${manager.user.last_name}`"
          :email="manager.user.email"
          :avatarUrl="photo(manager.user.photo_url)"
          roleName="Gerente"
          @remove="removeManager(manager.uuid)"
        />
      </section>
    </section>

    <section class="form-section">
      <div style="margin-bottom: 29px">
        <h2 class="title">
          {{ $t('sector.additional_options.title') }}
        </h2>
        <UnnnicSwitch
          v-model="sector.can_trigger_flows"
          :textRight="
            sector.can_trigger_flows
              ? $t('sector.additional_options.template_message.switch_active')
              : $t('sector.additional_options.template_message.switch_disabled')
          "
        />
        <div class="form-section__switch__container">
          <UnnnicSwitch
            v-model="sector.sign_messages"
            :textRight="
              sector.sign_messages
                ? $t('sector.additional_options.agents_signature.switch_active')
                : $t(
                    'sector.additional_options.agents_signature.switch_disabled',
                  )
            "
          />
          <UnnnicToolTip
            enabled
            :text="$t('sector.additional_options.agents_signature.tooltip')"
            side="right"
            maxWidth="15rem"
          >
            <UnnnicIconSvg
              icon="information-circle-4"
              scheme="neutral-soft"
              size="sm"
            />
          </UnnnicToolTip>
        </div>

        <UnnnicSwitch
          v-model="sector.can_edit_custom_fields"
          :textRight="$t('sector.additional_options.edit_custom_fields')"
        />
      </div>
      <div>
        <h2 class="title">{{ $t('sector.managers.working_day.title') }}</h2>

        <section class="form-section__inputs">
          <div>
            <span class="label-working-day">
              {{ $t('sector.managers.working_day.start.label') }}
            </span>
            <input
              v-model="sector.workingDay.start"
              class="input-time"
              type="time"
              min="00:00"
              max="23:00"
            />
            <span
              v-show="!validHour"
              style="font-size: 12px; color: #ff4545"
            >
              {{ message }}
            </span>
          </div>
          <div>
            <span class="label-working-day">
              {{ $t('sector.managers.working_day.end.label') }}
            </span>
            <input
              v-model="sector.workingDay.end"
              class="input-time"
              type="time"
              min="00:01"
              max="23:59"
            />
          </div>
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
            type="warning"
            iconLeft="delete"
            size="small"
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
          @click-action-primary="deleteSector(sector.uuid)"
          @click-action-secondary="openModalDelete = false"
        />
      </div>
    </section>
  </form>
</template>

<script>
import { mapActions } from 'pinia';
import { useSettings } from '@/store/modules/settings';
import unnnic from '@weni/unnnic-system';
import SelectedMember from '@/components/settings/forms/SelectedMember.vue';
import Sector from '@/services/api/resources/settings/sector';

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
    managers: {
      type: Array,
      default: () => [],
    },
    modelValue: {
      type: Object,
      default: () => ({}),
    },
  },
  emits: ['update:modelValue', 'remove-manager', 'validate', 'submit'],

  data: () => ({
    selectedManager: [],
    message: '',
    validHour: false,
    openModalDelete: false,
  }),

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
  },
  watch: {
    sector: {
      deep: true,
      immediate: true,
      handler() {
        this.$emit('validate', this.validate());
      },
    },
  },

  methods: {
    ...mapActions(useSettings, {
      actionDeleteSector: 'deleteSector',
    }),

    removeManager(managerUuid) {
      this.$emit('remove-manager', managerUuid);
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
      this.getManagers();
    },

    async getManagers() {
      const managers = await Sector.managers(this.sector.uuid);
      this.sector.managers = managers.results.map((manager) => ({
        ...manager,
        removed: false,
      }));
    },

    validate() {
      return this.areAllFieldsFilled();
    },

    areAllFieldsFilled() {
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

    hourValidate(hour) {
      const inicialHour = hour.start;
      const finalHour = hour.end;
      if (inicialHour > finalHour) {
        this.validHour = false;
        this.message = 'Horário de início não pode ser maior que horário final';
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
  },
};
</script>

<style lang="scss" scoped>
.form-sector {
  .form-section {
    & + .form-section {
      margin-top: 1.5rem;
    }

    & .inline-input-and-button {
      & *:first-child {
        flex: 1 1;
      }

      display: flex;
      gap: $unnnic-spacing-stack-sm;
      align-items: flex-end;
    }

    .title {
      &--lg {
        font-size: $unnnic-font-size-title-sm;
      }

      font-weight: $unnnic-font-weight-bold;
      color: $unnnic-color-neutral-dark;
      font-size: $unnnic-font-size-body-lg;
      line-height: 1.5rem;

      margin-bottom: 1rem;
    }

    &__switch__container {
      display: flex;
      align-items: center;

      .unnnic-tooltip {
        display: flex;
      }
    }

    &__inputs {
      display: grid;
      gap: $unnnic-spacing-stack-sm;
      grid-template-columns: 1fr 1fr;

      &--fill-w {
        grid-column: span 2;
      }
    }

    .unnnic-switch {
      align-items: center;
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
    border: 0.0625rem solid #e2e6ed;
    border-radius: 0.25rem;
    color: #4e5666;
    font-weight: 400;
    font-family: Lato;
    box-sizing: border-box;
    width: 100%;
    font-size: 0.875rem;
    line-height: 1.375rem;
    padding: 0.75rem 1rem;
    cursor: text;
  }
  .label-working-day {
    font-weight: 400;
    line-height: 1.375rem;
    font-size: 0.875rem;
    color: #67738b;
    margin: 0.5rem 0;
  }

  input:focus {
    outline-color: #9caccc;
    outline: 1px solid #9caccc;
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
