<template>
  <main
    class="settings-chats"
    ref="sectorsSection"
    @scroll="onScroll"
  >
    <header>
      <h1 class="title">Gerenciar Chats</h1>
      <p class="description">
        Adicione, visualize e gerencie os setores, filas, gestores e agentes
        dentro da sua organização.
      </p>
    </header>

    <section class="sectors">
      <div
        @click="navigate('sectors.new')"
        @keypress.enter="navigate('sectors.new')"
      >
        <UnnnicCard
          type="blank"
          text="Novo setor"
          icon="add"
          class="new-sector-card"
        />
      </div>

      <UnnnicCardProject
        v-for="sector in sectors"
        class="sectors-list"
        :key="sector.id"
        actionText="Abrir"
        :name="sector.name"
        @action="navigate('sectors.edit', { uuid: sector.uuid })"
        :statuses="[
          {
            title: 'Agentes',
            icon: 'headphones',
            scheme: 'aux-purple',
            count: sector.agents,
          },
          {
            title: 'Contatos',
            icon: 'person',
            scheme: 'aux-lemon',
            count: sector.contacts,
          },
        ]"
      />
    </section>
    <div
      v-if="isLoading"
      class="weni-redirecting"
    >
      <img
        class="logo"
        src="@/assets/LogoWeniAnimada4.svg"
        alt=""
      />
    </div>
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
    isLoading: true,
    nextPage: null,
  }),

  methods: {
    navigate(name, params) {
      this.$router.push({
        name,
        params,
      });
    },
    async listSectors() {
      try {
        this.isLoading = true;
        const sectors = await Sector.list();
        this.nextPage = sectors.next;
        this.sectors = sectors.results;
        this.next = sectors.next;
        this.isLoading = false;
      } catch (error) {
        this.isLoading = false;
      }
    },

    async listMoreSectors() {
      if (this.isLoading || !this.nextPage) {
        return;
      }

      try {
        this.isLoading = true;
        const newSectors = await Sector.list(this.nextPage);
        this.nextPage = newSectors.next;
        this.sectors = [...this.sectors, ...newSectors.results];
        if (newSectors) {
          this.isLoading = false;
        }
      } catch (error) {
        this.isLoading = false;
      }
    },

    onScroll() {
      const sectorSection = this.$refs.sectorsSection;
      const isScrollInBottom =
        sectorSection.scrollTop + sectorSection.clientHeight >=
        sectorSection.scrollHeight;
      if (isScrollInBottom) {
        this.listMoreSectors();
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.settings-chats {
  overflow-y: auto;
  padding-right: 1rem;
  // margin-right: 0.5rem;

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
    .sectors-list {
      background-color: $unnnic-color-background-carpet;
    }
  }
  .weni-redirecting {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
    padding: 15px;
  }
  .logo {
    width: 10%;
    max-width: 40px;
    max-height: 40px;
  }
}
</style>
