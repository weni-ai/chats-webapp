<template>
  <main class="settings-chats">
    <header>
      <h1 class="title">Gerenciar Chats</h1>
      <p class="description">
        Adicione, visualize e gerencie os setores, filas, gestores e agentes dentro da sua
        organização.
      </p>
    </header>

    <section class="sectors">
      <div @click="navigate('chats/sectors/new')" @keypress.enter="navigate('sectors/new')">
        <unnnic-card type="blank" text="Novo setor" icon="add-1" class="new-sector-card" />
      </div>

      <unnnic-card-project
        v-for="sector in sectors"
        :key="sector.id"
        actionText="Abrir"
        :name="sector.name"
        @action="
          navigate({
            name: 'sectors.edit',
            params: { uuid: sector.uuid },
          })
        "
        :statuses="[
          {
            title: 'Agentes',
            icon: 'headphones-customer-support-human-1-1',
            scheme: 'aux-purple',
            count: sector.agents,
          },
          {
            title: 'Contatos',
            icon: 'single-neutral-actions-1',
            scheme: 'aux-lemon',
            count: sector.contacts,
          },
        ]"
      />
    </section>
  </main>
</template>

<script>
import Sector from '@/services/api/resources/settings/sector';

export default {
  name: 'SettingsChats',

  beforeMount() {
    this.listSectors();
  },

  data: () => ({
    sectors: [],
  }),

  methods: {
    navigate(params) {
      this.$router.push(params);
    },
    async listSectors() {
      const sectors = await Sector.list();
      this.sectors = sectors.results;
    },
  },
};
</script>

<style lang="scss" scoped>
.settings-chats {
  overflow-y: auto;
  padding-right: 1rem;
  margin-right: 0.5rem;

  header {
    margin-bottom: 1.5rem;

    .title {
      color: $unnnic-color-neutral-black;
      font-family: $unnnic-font-family-primary;
      font-size: 1.5rem;
      line-height: 2rem;
      margin-bottom: 0.5rem;
    }

    .description {
      line-height: 1.5rem;
      color: $unnnic-color-neutral-dark;
    }
  }

  .sectors {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;

    .new-sector-card {
      height: 100%;
    }
  }
}
</style>
