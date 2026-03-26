<template>
  <section class="warning-archived-messages__container">
    <UnnnicDisclaimer
      :title="$t('chats.summary.archived.disclaimer.title')"
      :description="$t('chats.summary.archived.disclaimer.description')"
      type="attention"
      class="warning-archived-messages"
    />
  </section>
</template>

<style lang="scss" scoped>
.warning-archived-messages__container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}
</style>
