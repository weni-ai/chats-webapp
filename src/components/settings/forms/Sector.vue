<!-- eslint-disable vuejs-accessibility/form-control-has-label -->
<template>
  <form @submit.prevent="$emit('submit')" class="form-sector">
    <section v-if="isEditing" class="form-section">
      <h2 v-if="sector.name" class="title--lg">{{ sector.name }}</h2>
    </section>

    <section v-else class="form-section">
      <h2 class="title">
        Adicionar novo setor
        <unnnic-tool-tip enabled :text="$t('new_sector.sector_tip')" side="right" maxWidth="21rem">
          <unnnic-icon-svg icon="information-circle-4" scheme="neutral-soft" size="sm" />
        </unnnic-tool-tip>
      </h2>

      <unnnic-input v-model="sector.name" label="Nome do setor" placeholder="Exemplo: Financeiro" />
    </section>

    <section class="form-section">
      <h2 class="title">
        {{ $t('sector.managers.title') }}
        <unnnic-tool-tip enabled :text="$t('new_sector.agent_tip')" side="right" maxWidth="15rem">
          <unnnic-icon-svg icon="information-circle-4" scheme="neutral-soft" size="sm" />
        </unnnic-tool-tip>
      </h2>

      <div class="inline-input-and-button">
        <unnnic-autocomplete
          v-model="manager"
          :label="$t('sector.managers.add.label')"
          :data="managersNames"
          open-with-focus
          highlight
          :placeholder="$t('sector.managers.add.placeholder')"
          iconLeft="search-1"
          @choose="selectManager"
        />
        <!-- <unnnic-button
          text="Selecionar"
          type="secondary"
          @click="addSectorManager"
          :disabled="!selectedManager"
        /> -->
      </div>

      <section v-if="sector.managers.length > 0" class="form-sector__managers">
        <selected-member
          v-for="manager in sector.managers"
          :key="manager.uuid"
          :name="`${manager.user.first_name} ${manager.user.last_name}`"
          :email="manager.user.email"
          :avatar-url="photo(manager.user.photo_url)"
          @remove="removeManager(manager.uuid)"
          role-name="Gerente"
        />
      </section>
    </section>

    <section class="form-section">
      <div style="margin-bottom: 29px">
        <h2 class="title">
          {{ $t('sector.template_message.title') }}
          <unnnic-tool-tip
            enabled
            :text="$t('sector.template_message.switch_tip')"
            side="right"
            maxWidth="25rem"
          >
            <unnnic-icon-svg icon="information-circle-4" scheme="neutral-soft" size="sm" />
          </unnnic-tool-tip>
        </h2>
        <unnnicSwitch
          v-model="sector.can_trigger_flows"
          :textRight="
            sector.can_trigger_flows
              ? $t('sector.template_message.switch_title_active')
              : $t('sector.template_message.switch_title_disabled')
          "
        />
      </div>
      <div>
        <h2 class="title">{{ $t('sector.managers.working_day.title') }}</h2>

        <section class="form-section__inputs">
          <div>
            <span class="label-working-day">{{
              $t('sector.managers.working_day.start.label')
            }}</span>
            <input
              class="input-time"
              type="time"
              v-model="sector.workingDay.start"
              min="00:00"
              max="23:00"
            />
            <span v-show="!this.validHour" style="font-size: 12px; color: #ff4545">{{
              this.message
            }}</span>
          </div>
          <div>
            <span class="label-working-day">{{ $t('sector.managers.working_day.end.label') }}</span>
            <input
              class="input-time"
              type="time"
              v-model="sector.workingDay.end"
              min="00:01"
              max="23:59"
            />
          </div>
          <unnnic-input
            v-model="sector.maxSimultaneousChatsByAgent"
            :label="$t('sector.managers.working_day.limit_agents.label')"
            placeholder="4"
            class="form-section__inputs--fill-w"
          />
        </section>
      </div>
    </section>
  </form>
</template>

<script>
import SelectedMember from '@/components/settings/forms/SelectedMember';
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
    value: {
      type: Object,
      default: () => ({}),
    },
  },

  data: () => ({
    manager: '',
    selectedManager: null,
    message: '',
    validHour: false,
  }),

  computed: {
    managersNames() {
      const managers = this.managers.map((manager) => {
        const { email, first_name, last_name } = manager.user;

        return first_name || last_name ? `${first_name} ${last_name}` : email;
      });
      const filterDuplicateNames = managers.filter(
        (item, index) => managers.indexOf(item) === index,
      );
      // const mapped = filterDuplicateNames.map((el, i) => ({ index: i, value: el.toLowerCase() }));
      // const sort = mapped.sort((a, b) => +(a.value > b.value) || +(a.value === b.value) - 1);
      // const result = sort.map((el) => filterDuplicateNames[el.index]);
      return filterDuplicateNames;
      // return managers.filter((manager) => manager.includes(this.manager));
    },

    sector: {
      get() {
        return this.value;
      },
      set(sector) {
        this.$emit('input', sector);
      },
    },
  },

  methods: {
    removeManager(managerUuid) {
      this.$emit('remove-manager', managerUuid);
    },

    // switchTemplateMessage() {
    //   this.sector.can_trigger_flows = this.sector.can_trigger_flows;
    // },

    photo(link) {
      const getOnlyPhoto = link.split('?')[0];
      return getOnlyPhoto;
    },

    addSectorManager() {
      const { selectedManager } = this;
      if (!selectedManager) return;

      const managers = [...this.sector.managers, selectedManager];
      this.sector = {
        ...this.sector,
        managers,
      };
      if (this.isEditing) this.addManager(selectedManager);
      this.manager = null;
      this.selectedManager = null;
    },

    async addManager(manager) {
      await Sector.addManager(this.sector.uuid, manager.uuid);
      this.getManagers();
    },

    async getManagers() {
      const managers = await Sector.managers(this.sector.uuid);
      this.sector.managers = managers.results.map((manager) => ({ ...manager, removed: false }));
    },

    selectManager(selected) {
      const manager = this.managers.find((manager) => {
        const { first_name, last_name, email } = manager.user;
        const name = `${first_name} ${last_name}`;

        return name === selected || email === selected;
      });
      this.selectedManager = manager;
      this.addSectorManager();
    },

    validate() {
      return this.areAllFieldsFilled();
    },

    areAllFieldsFilled() {
      const { name, managers, workingDay, maxSimultaneousChatsByAgent } = this.sector;
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

    &__inputs {
      display: grid;
      gap: $unnnic-spacing-stack-sm;
      grid-template-columns: 1fr 1fr;

      &--fill-w {
        grid-column: span 2;
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
