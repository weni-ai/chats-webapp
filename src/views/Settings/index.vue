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
      <span @click="navigate('chats/sectors/new')" @keypress.enter="navigate('sectors/new')">
        <unnnic-card type="blank" text="Novo setor" icon="add-1" />
      </span>

      <div
        v-for="sector in sectors"
        :key="sector.id"
        @click="
          navigate({
            name: 'sectors.edit',
            params: { id: sector.id },
          })
        "
        @keypress.enter="
          navigate({
            name: 'sectors.edit',
            params: { id: sector.id },
          })
        "
      >
        <unnnic-card :title="sector.name" type="default" clickable />
      </div>
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
  }
}
</style>
