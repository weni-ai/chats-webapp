<template>
  <unnnic-tab v-model="tab" initialTab="sector" :tabs="tabs" class="sector-tabs">
    <template slot="tab-head-sector">
      <div class="form-tab">
        <span class="name">Setor</span>
      </div>
    </template>

    <template slot="tab-head-queues">
      <div class="form-tab">
        <span class="name">Filas</span>
      </div>
    </template>

    <template slot="tab-head-tags">
      <div class="form-tab">
        <span class="name">Tags</span>
      </div>
    </template>

    <template slot="tab-panel-sector">
      <slot name="sector" />
    </template>

    <template slot="tab-panel-queues">
      <slot name="queues" />
    </template>

    <template slot="tab-panel-tags">
      <slot name="tags" />
    </template>
  </unnnic-tab>
</template>

<script>
export default {
  name: 'SectorTabs',

  props: {
    value: {
      type: String,
      default: '',
    },
  },

  mounted() {
    const { tab } = this.$route.query;

    if (this.tabs.includes(tab)) this.tab = tab;
  },

  data: () => ({
    tabs: ['sector', 'queues', 'tags'],
  }),

  computed: {
    tab: {
      get() {
        return this.value;
      },
      set(tab) {
        this.$emit('input', tab);
      },
    },
  },
};
</script>

<style lang="scss" scoped>
.sector-tabs {
  .form-tab {
    display: flex;
    align-items: center;
    gap: $unnnic-spacing-stack-xs;

    .name {
      font-size: $unnnic-font-size-body-lg;
    }
  }
}
</style>
