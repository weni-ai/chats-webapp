<template>
  <section class="new-sector">
    <unnnic-tab v-model="tab" initialTab="sector" :tabs="tabs">
      <template slot="tab-head-sector">
        <div class="form-tab">
          <span class="name">Novo Setor</span>
          <unnnic-tool-tip enabled text="Setor é uma área dentro da sua organização" side="right">
            <unnnic-icon-svg icon="information-circle-4" scheme="neutral-soft" size="sm" />
          </unnnic-tool-tip>
        </div>
      </template>

      <template slot="tab-head-queue">
        <div class="form-tab">
          <span class="name">Filas</span>
          <unnnic-icon-svg icon="information-circle-4" scheme="neutral-soft" size="sm" />
        </div>
      </template>

      <template slot="tab-head-agents">
        <div class="form-tab">
          <span class="name">Agentes</span>
          <unnnic-icon-svg icon="information-circle-4" scheme="neutral-soft" size="sm" />
        </div>
      </template>

      <template slot="tab-panel-sector">
        <form-sector @submit="tab = 'queue'" />
      </template>

      <template slot="tab-panel-queue">
        <section class="new-sector-tab-content">
          <p class="title">Adicionar nova Fila</p>

          <section class="inputs">
            <unnnic-input label="Nome da fila" placeholder="Suporte nivel III" class="input" />
            <unnnic-button type="secondary" text="Adicionar fila" />
          </section>
        </section>
      </template>

      <template slot="tab-panel-agents">
        <section></section>
      </template>
    </unnnic-tab>
  </section>
</template>

<script>
import FormSector from '@/components/settings/forms/Sector';

export default {
  name: 'NewSector',

  components: {
    FormSector,
  },

  data: () => ({
    tab: '',
    tabs: ['sector', 'queue', 'agents'],
  }),
};
</script>

<style lang="scss" scoped>
.new-sector {
  .form-tab {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .new-sector-tab-content {
    .title {
      font-weight: $unnnic-font-weight-bold;
      color: $unnnic-color-neutral-dark;
      font-size: $unnnic-font-size-body-lg;
      line-height: 1.5rem;

      margin-bottom: 1rem;
    }

    .inputs {
      display: flex;
      align-items: flex-end;
      gap: 1.5rem;

      .input {
        flex: 1 1;
      }
    }
  }
}
</style>
