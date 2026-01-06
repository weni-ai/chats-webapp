<template>
  <AsideSlotTemplate
    class="search-messages-container"
    :close="() => $emit('close')"
  >
    <template #header>
      <header class="search-messages__header">
        <p>{{ $t('chats.search_messages.title') }}</p>
        <UnnnicButton
          iconCenter="close"
          type="tertiary"
          size="small"
          @click="$emit('close')"
        />
      </header>
    </template>
    <AsideSlotTemplateSection class="search-messages__content">
      <section class="search-messages__container">
        <UnnnicInput iconLeft="search-1" />
      </section>
    </AsideSlotTemplateSection>
  </AsideSlotTemplate>
</template>

<script>
import AsideSlotTemplate from '@/components/layouts/chats/AsideSlotTemplate/index.vue';
import AsideSlotTemplateSection from '@/components/layouts/chats/AsideSlotTemplate/Section.vue';

export default {
  name: 'SearchMessages',

  components: {
    AsideSlotTemplate,
    AsideSlotTemplateSection,
  },
  emits: ['close'],
  data() {
    return {
      isLoading: false,
    };
  },
};
</script>

<style lang="scss" scoped>
.search-messages {
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $unnnic-space-4 $unnnic-space-2;
    font: $unnnic-font-display-3;
    color: $unnnic-color-fg-emphasized;
    border-bottom: 1px solid $unnnic-color-border-soft;
  }
  &__content {
    height: 100%;
    width: 100%;

    display: flex;
    flex-direction: column;

    overflow: auto;
  }
  &__container {
    padding: $unnnic-space-3 $unnnic-space-2 $unnnic-space-2 $unnnic-space-2;
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-3;
  }
}
</style>
