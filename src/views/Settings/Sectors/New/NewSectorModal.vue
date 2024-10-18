<template>
  <UnnnicDrawer
    ref="newSectorDrawer"
    class="new-sector-drawer"
    :modelValue="modelValue"
    closeIcon="arrow_back"
    size="xl"
    :title="$t('config_chats.new_sector')"
    :primaryButtonText="activePageIndex === 3 ? $t('save') : $t('continue')"
    :secondaryButtonText="activePageIndex === 0 ? $t('cancel') : $t('back')"
    @primary-button-click="
      activePageIndex === 3 ? finish() : (activePageIndex = activePageIndex + 1)
    "
    @secondary-button-click="
      activePageIndex === 0
        ? $refs.newSectorDrawer.close()
        : (activePageIndex = activePageIndex - 1)
    "
    @close="$emit('close')"
  >
    <template #content>
      <UnnnicNavigator
        :pages="newSectorPages"
        :activePage="activePage"
      />
    </template>
  </UnnnicDrawer>
</template>

<script>
export default {
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['close'],
  data() {
    return {
      activePageIndex: 0,
      newSectorPages: [
        this.$t('sector.general'),
        this.$t('sector.extra_options'),
        this.$t('sector.queues'),
        this.$t('quick_messages.title'),
      ],
    };
  },
  computed: {
    activePage() {
      return this.newSectorPages[this.activePageIndex];
    },
  },
  methods: {
    finish() {
      this.$refs.newSectorDrawer.close();
    },
  },
};
</script>

<style lang="scss" scoped>
.new-sector-drawer {
  :deep(.unnnic-navigator-pages__page) {
    max-width: 100%;
  }
}
</style>
