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
        actionText="Entrar"
        :name="sector.name"
        @action="
          navigate({
            name: 'sectors.view',
            params: { id: sector.id },
          })
        "
        :statuses="[
          {
            title: 'Filas',
            icon: 'hierarchy-3-2',
            scheme: 'brand-weni',
            count: sector.queues.length,
          },
          {
            title: 'Agentes',
            icon: 'headphones-customer-support-human-1-1',
            scheme: 'aux-purple',
            count: sector.agents.length,
          },
          {
            title: 'Contatos',
            icon: 'single-neutral-actions-1',
            scheme: 'aux-lemon',
            count: sector.contacts.count,
          },
        ]"
      >
      </unnnic-card-project>
    </section>
  </main>
</template>

<script>
import { mapState } from 'vuex';

export default {
  name: 'SettingsChats',

  computed: {
    ...mapState({
      sectors: (state) => state.settings.sectors,
    }),
  },

  methods: {
    navigate(params) {
      this.$router.push(params);
    },
  },
};
</script>

<style lang="scss" scoped>
.settings-chats {
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
