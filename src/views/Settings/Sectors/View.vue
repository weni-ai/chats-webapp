<template>
  <section v-if="sector" class="view-sector">
    <sector-tabs v-model="tab">
      <template #sector>
        <section class="sector-tab">
          <h2 class="name">{{ sector.name }}</h2>

          <section class="info-group">
            <p class="title">Gestor</p>

            <section class="info manager">
              <span>
                {{ sector.manager }}
              </span>
              <span>
                {{ nameToEmail(sector.manager) }}
              </span>
            </section>
          </section>

          <section class="info-group">
            <p class="title">Definições da jornada de trabalho</p>

            <section class="info working-day">
              <span>Horário início</span>
              <span>Horário encerramento</span>
              <span>Limite de atendimentos</span>
            </section>

            <section class="working-day working-day__content">
              <span>{{ sector.workingDay.start }}</span>
              <span>{{ sector.workingDay.end }}</span>
              <span>{{ sector.maxSimultaneousChatsByAgent }}</span>
            </section>
          </section>
        </section>
      </template>
    </sector-tabs>
    <section class="actions">
      <unnnic-button text="Voltar" type="secondary" @click="navigate('/settings/chats')" />
      <unnnic-button text="Editar" />
    </section>
  </section>
</template>

<script>
import SectorTabs from '@/components/settings/SectorTabs';

export default {
  name: 'EditSector',

  components: {
    SectorTabs,
  },

  props: {
    id: {
      type: [String, Number],
      default: '',
    },
  },

  created() {
    this.$store.commit('settings/setActiveSectorId', Number(this.id) || null);
  },

  data: () => ({
    tab: '',
  }),

  computed: {
    sector() {
      return this.$store.getters['settings/getActiveSector'];
    },
  },

  methods: {
    nameToEmail(name) {
      return `${name.replaceAll(' ', '.').toLowerCase()}@email.com`;
    },
    navigate(route) {
      this.$router.push(route);
    },
  },
};
</script>

<style lang="scss" scoped>
.view-sector {
  display: flex;
  flex-direction: column;
  height: 100%;

  .sector-tab {
    .name {
      font-size: $unnnic-font-size-title-sm;
      color: $unnnic-color-neutral-dark;
      line-height: 1.75rem;
      margin-bottom: $unnnic-spacing-stack-sm;
    }

    .info-group {
      margin-bottom: $unnnic-spacing-stack-md;

      .title {
        font-size: $unnnic-font-size-body-lg;
        font-weight: $unnnic-font-weight-bold;
        color: $unnnic-color-neutral-dark;
        line-height: 1.5rem;
        margin-bottom: $unnnic-spacing-stack-sm;
      }

      .info {
        background: $unnnic-color-neutral-light;
        border-radius: $unnnic-border-radius-sm;
        color: $unnnic-color-neutral-darkest;
      }

      .manager {
        padding: 1rem;
        display: grid;
        grid-template-columns: 1fr 1fr;
      }

      .working-day {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        padding: 1rem;
        font-size: $unnnic-font-size-body-gt;

        &__content {
          font-size: $unnnic-font-size-body-lg;
          color: $unnnic-color-neutral-cloudy;
        }
      }
    }
  }
  .actions {
    display: flex;
    align-items: center;
    gap: $unnnic-inset-sm;

    margin-top: auto;

    & > * {
      flex: 1 1;
    }
  }
}
</style>
