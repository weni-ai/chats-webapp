<template>
  <UnnnicTab
    v-model:activeTab="tab"
    :initialTab="tab || 'sector'"
    :tabs="tabs"
    class="sector-tabs"
    @change="tab = $event"
  >
    <template #tab-head-sector>
      <div class="form-tab">
        <span class="name">{{ $t('sector.title') }}</span>
      </div>
    </template>

    <template #tab-head-queues>
      <div class="form-tab">
        <span class="name">{{ $t('queues.title') }}</span>
      </div>
    </template>

    <template #tab-head-messages>
      <div class="form-tab">
        <span class="name">{{ $t('settings.messages.title') }}</span>
      </div>
    </template>

    <template #tab-head-tags>
      <div class="form-tab">
        <span class="name">{{ $t('tags.title') }}</span>
      </div>
    </template>

    <template #tab-panel-sector>
      <slot name="sector" />
    </template>

    <template #tab-panel-queues>
      <slot name="queues" />
    </template>

    <template #tab-panel-messages>
      <slot name="messages" />
    </template>

    <template #tab-panel-tags>
      <slot name="tags" />
    </template>
  </UnnnicTab>
</template>

<script>
export default {
  name: 'SectorTabs',

  props: {
    modelValue: {
      type: String,
      default: '',
    },
  },

  data: () => ({
    tabs: ['sector', 'queues', 'messages', 'tags'],
  }),

  computed: {
    tab: {
      get() {
        return this.modelValue;
      },
      set(tab) {
        if (typeof tab === 'string') this.$emit('update:modelValue', tab);
      },
    },
  },

  mounted() {
    const { tab } = this.$route.query;

    if (this.tabs.includes(tab)) this.tab = tab;
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
