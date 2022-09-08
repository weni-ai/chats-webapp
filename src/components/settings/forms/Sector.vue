<template>
  <form @submit.prevent="$emit('submit')" class="form-sector">
    <section v-if="isEditing" class="form-section">
      <h2 v-if="sector.name" class="title--lg">{{ sector.name }}</h2>
    </section>

    <section v-else class="form-section">
      <h2 class="title">
        Adicionar novo setor
        <unnnic-tool-tip
          enabled
          text="Crie um setor para gerenciar a operação de atendimento, adicionando gerentes, agentes e horário de funcionamento."
          side="right"
        >
          <unnnic-icon-svg icon="information-circle-4" scheme="neutral-soft" size="sm" />
        </unnnic-tool-tip>
      </h2>

      <unnnic-input v-model="sector.name" label="Nome do setor" placeholder="Exemplo: Financeiro" />
    </section>

    <section class="form-section">
      <h2 class="title">Gerentes de atendimento</h2>

      <div class="inline-input-and-button">
        <unnnic-autocomplete
          v-model="manager"
          label="Adicionar gerente"
          :data="managersNames"
          open-with-focus
          highlight
          placeholder="Pesquise pelo nome ou email"
          iconLeft="search-1"
          @choose="selectManager"
        />
        <unnnic-button text="Selecionar" type="secondary" @click="addSectorManager" />
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
      <h2 class="title">Definições da jornada de trabalho</h2>

      <section class="form-section__inputs">
        <unnnic-input
          v-model="sector.workingDay.start"
          label="Horário de início"
          placeholder="08:00"
        />
        <unnnic-input
          v-model="sector.workingDay.end"
          label="Horário de encerramento"
          placeholder="18:00"
        />

        <unnnic-select
          v-model="sector.workingDay.dayOfWeek"
          label="Dias de funcionamento"
          placeholder="Selecione"
        >
          <option value="week-days">Segunda à sexta</option>
        </unnnic-select>

        <unnnic-input
          v-model="sector.maxSimultaneousChatsByAgent"
          label="Limite de quantidade de atendimentos simultâneos por agente"
          placeholder="4"
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
      const managers = this.sector.managers.filter((manager) => manager.uuid !== managerUuid);
      this.sector = {
        ...this.sector,
        managers,
      };
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
        workingDay?.dayOfWeek &&
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
    }
  }

  &__managers {
    margin-top: $unnnic-spacing-inline-md;
    display: flex;
    flex-direction: column;
    gap: $unnnic-spacing-stack-xs;
  }
}
</style>
