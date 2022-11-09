<template>
  <form @submit.prevent="$emit('submit')" class="form-sector">
    <section v-if="isEditing" class="form-section">
      <h2 v-if="sector.name" class="title--lg">{{ sector.name }}</h2>
    </section>

    <section v-else class="form-section">
      <h2 class="title">
        Adicionar novo setor
        <unnnic-tool-tip enabled :text="$t('new_sector.sector_tip')" side="right">
          <unnnic-icon-svg icon="information-circle-4" scheme="neutral-soft" size="sm" />
        </unnnic-tool-tip>
      </h2>

      <unnnic-input v-model="sector.name" label="Nome do setor" placeholder="Exemplo: Financeiro" />
    </section>

    <section class="form-section">
      <h2 class="title">
        {{ $t('sector.managers.title') }}
        <unnnic-tool-tip enabled :text="$t('new_sector.agent_tip')" side="right">
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
        <unnnic-button
          text="Selecionar"
          type="secondary"
          @click="addSectorManager"
          :disabled="!selectedManager"
        />
      </div>

      <section v-if="sector.managers.length > 0" class="form-sector__managers">
        <selected-member
          v-for="manager in sector.managers"
          :key="manager.uuid"
          :name="`${manager.user.first_name} ${manager.user.last_name}`"
          :email="manager.user.email"
          :avatar-url="manager.user.photo_url"
          @remove="removeManager(manager.uuid)"
          role-name="Gerente"
        />
      </section>
    </section>

    <section class="form-section">
      <h2 class="title">{{ $t('sector.managers.working_day.title') }}</h2>

      <section class="form-section__inputs">
        <unnnic-input
          v-model="sector.workingDay.start"
          :label="$t('sector.managers.working_day.start.label')"
          v-mask="'##:##'"
          placeholder="08:00"
        />
        <unnnic-input
          v-model="sector.workingDay.end"
          label="Horário de encerramento"
          v-mask="'##:##'"
          placeholder="18:00"
        />

        <unnnic-input
          v-model="sector.maxSimultaneousChatsByAgent"
          :label="$t('sector.managers.working_day.end.label')"
          placeholder="4"
          class="form-section__inputs--fill-w"
        />
      </section>
    </section>
  </form>
</template>

<script>
import SelectedMember from '@/components/settings/forms/SelectedMember';

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
  }),

  computed: {
    managersNames() {
      const managers = this.managers.map((manager) => {
        const { email, first_name, last_name } = manager.user;

        return first_name || last_name ? `${first_name} ${last_name}` : email;
      });

      return managers.filter((manager) => manager.includes(this.manager));
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
    addSectorManager() {
      const { selectedManager } = this;
      if (!selectedManager) return;

      const managers = [...this.sector.managers, selectedManager];
      this.sector = {
        ...this.sector,
        managers,
      };

      this.manager = '';
    },
    selectManager(selected) {
      const manager = this.managers.find((manager) => {
        const { first_name, last_name, email } = manager.user;
        const name = `${first_name} ${last_name}`;

        return name === selected || email === selected;
      });
      this.selectedManager = manager;
    },
    validate() {
      return this.areAllFieldsFilled();
    },
    areAllFieldsFilled() {
      const { name, managers, workingDay, maxSimultaneousChatsByAgent } = this.sector;

      return !!(
        name.trim() &&
        managers.length > 0 &&
        workingDay?.start &&
        workingDay?.end &&
        maxSimultaneousChatsByAgent
      );
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

  &__managers {
    margin-top: $unnnic-spacing-inline-md;
    display: flex;
    flex-direction: column;
    gap: $unnnic-spacing-stack-xs;
  }
  ::placeholder {
    color: #d1d4da;
  }
}
</style>
