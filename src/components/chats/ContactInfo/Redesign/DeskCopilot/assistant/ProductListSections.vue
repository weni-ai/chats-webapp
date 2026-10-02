<template>
  <section
    class="product-list-sections"
    data-testid="product-list-sections"
  >
    <h3
      v-if="header"
      class="product-list-sections__header"
      data-testid="product-list-sections-header"
    >
      {{ header }}
    </h3>

    <section
      v-for="(section, index) in sections"
      :key="`${section.title}-${index}`"
      class="product-list-sections__section"
      data-testid="product-list-section"
    >
      <h4
        v-if="section.title"
        class="product-list-sections__title"
        data-testid="product-list-section-title"
      >
        {{ section.title }}
      </h4>

      <ProductCarousel
        :products="section.items"
        :getQuantity="getQuantity"
        :dismissedIds="dismissedIds"
        :readOnly="readOnly"
        @add="emit('add', $event)"
        @remove="emit('remove', $event)"
        @increment="emit('increment', $event)"
        @decrement="emit('decrement', $event)"
      />
    </section>
  </section>
</template>

<script setup lang="ts">
import type {
  ProductCarouselItem,
  ProductListSection,
} from '@/services/assistant/types';
import ProductCarousel from './ProductCarousel.vue';

defineOptions({
  name: 'ProductListSections',
});

withDefaults(
  defineProps<{
    sections: ProductListSection[];
    header?: string;
    getQuantity: (productId: string) => number;
    dismissedIds?: string[];
    readOnly?: boolean;
  }>(),
  {
    header: undefined,
    dismissedIds: () => [],
    readOnly: false,
  },
);

const emit = defineEmits<{
  add: [product: ProductCarouselItem];
  remove: [product: ProductCarouselItem];
  increment: [product: ProductCarouselItem];
  decrement: [product: ProductCarouselItem];
}>();
</script>

<style lang="scss" scoped>
.product-list-sections {
  display: flex;
  flex-direction: column;
  gap: $unnnic-space-4;
  width: 100%;
  min-width: 0;

  &__header {
    margin: 0;
    padding-right: $unnnic-space-4;
    font: $unnnic-font-action;
    color: $unnnic-color-fg-emphasized;
  }

  &__section {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-2;
    width: 100%;
    min-width: 0;
  }

  &__title {
    margin: 0;
    padding-right: $unnnic-space-4;
    font: $unnnic-font-emphasis;
    color: $unnnic-color-fg-emphasized;
  }
}
</style>
