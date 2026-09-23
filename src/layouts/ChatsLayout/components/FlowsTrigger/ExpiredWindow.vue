<template>
  <section
    class="flows-trigger-expired-window"
    data-testid="flows-trigger-expired-window"
  >
    <header class="flows-trigger-expired-window__search">
      <UnnnicInput
        v-model="searchUrn"
        iconLeft="search-1"
        :placeholder="$t('chats.search_contact')"
        data-testid="flows-trigger-expired-search"
      />
    </header>
  </section>
</template>

<script>
export default {
  name: 'FlowsTriggerExpiredWindow',

  data: () => ({
    searchUrn: '',
  }),
};
</script>

<style lang="scss" scoped>
.flows-trigger-expired-window {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &__search {
    flex-shrink: 0;
  }
}
</style>
