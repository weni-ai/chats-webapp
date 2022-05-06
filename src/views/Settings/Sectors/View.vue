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

      <template #queues>
        <section class="sector-tab">
          <h2 class="name">{{ sector.name }}</h2>

          <section class="info-group">
            <list-sector-queues :queues="sector.queues" :sector="sector.name" />
          </section>
        </section>
      </template>

      <template #agents>
        <section class="sector-tab">
          <h2 class="name">{{ sector.name }}</h2>

          <section class="info-group">
            <list-sector-agents
              :agents="sector.agents"
              :queues="sector.queues"
              :sector="sector.name"
            />
          </section>
        </section>
      </template>
    </sector-tabs>
    <section class="actions">
      <template v-if="tab === 'sector'">
        <unnnic-button text="Voltar" type="secondary" @click="navigate('/settings/chats')" />
        <unnnic-button text="Editar" @click="navigate(`/settings/chats/sectors/${id}/edit`)" />
      </template>

      <template v-else-if="tab === 'queues'">
        <unnnic-button text="Adicionar nova fila" type="secondary" iconRight="add-circle-1" />
      </template>

      <template v-if="tab === 'agents'">
        <unnnic-button text="Voltar" type="secondary" @click="navigate('/settings/chats')" />
        <unnnic-button
          text="Adicionar novo agente"
          iconRight="add-circle-1"
          @click="navigate(`/settings/chats/sectors/${id}/edit`)"
        />
      </template>
    </section>
  </section>
</template>

<script>
import ListSectorAgents from '@/components/settings/lists/ListSectorAgents';
import ListSectorQueues from '@/components/settings/lists/ListSectorQueues';
import SectorTabs from '@/components/settings/SectorTabs';

export default {
  name: 'ViewSector',

  components: {
    ListSectorAgents,
    ListSectorQueues,
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
      return `${name.replaceAll(/(\s[a-z]{2}\s)|(\s)/g, '.').toLowerCase()}@email.com`;
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
