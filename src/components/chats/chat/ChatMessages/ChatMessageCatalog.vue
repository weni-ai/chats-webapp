<template>
  <section
    v-if="products.length"
    class="chat-message-catalog"
    data-testid="chat-message-catalog"
  >
    <p
      v-if="catalog.header"
      class="chat-message-catalog__header"
      data-testid="chat-message-catalog-header"
    >
      {{ catalog.header }}
    </p>
    <ProductCarousel
      :products="products"
      :getQuantity="getQuantity"
      readOnly
    />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import ProductCarousel from '@/components/chats/ContactInfo/Redesign/DeskCopilot/assistant/ProductCarousel.vue';
import type { CatalogPayload } from '@/services/assistant/buildCatalogPayload';
import type { ProductCarouselItem } from '@/services/assistant/types';

defineOptions({
  name: 'ChatMessageCatalog',
});

const props = defineProps<{
  catalog: CatalogPayload;
}>();

const products = computed<ProductCarouselItem[]>(() =>
  (props.catalog?.products || []).flatMap((group) =>
    (group.product_retailer_info || []).map((item) => ({
      product_retailer_id: item.retailer_id,
      name: item.name,
      price: item.price,
      image: item.image || '',
      sale_price: item.sale_price,
      currency: item.currency,
      description: item.description,
      seller_id: item.seller_id,
      product_url: item.product_url,
    })),
  ),
);

function getQuantity() {
  return 0;
}
</script>

<style lang="scss" scoped>
.chat-message-catalog {
  display: flex;
  flex-direction: column;
  gap: $unnnic-space-2;
  width: 100%;
  min-width: 0;
  margin-top: $unnnic-space-2;

  &__header {
    margin: 0;
    font: $unnnic-font-action;
    color: $unnnic-color-fg-emphasized;
  }
}
</style>
