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

    <ul class="chat-message-catalog__list">
      <li
        v-for="product in products"
        :key="product.retailer_id"
        class="chat-message-catalog__item"
        :data-testid="`chat-message-catalog-item-${product.retailer_id}`"
      >
        <section class="chat-message-catalog__image-container">
          <img
            v-if="product.image"
            class="chat-message-catalog__image"
            :src="product.image"
            :alt="product.name"
            referrerpolicy="no-referrer"
            data-testid="chat-message-catalog-image"
          />
          <UnnnicIcon
            v-else
            icon="image"
            size="md"
            scheme="fg-muted"
            data-testid="chat-message-catalog-image-placeholder"
          />
        </section>

        <section class="chat-message-catalog__content">
          <p
            class="chat-message-catalog__name"
            data-testid="chat-message-catalog-name"
          >
            {{ product.name }}
          </p>
          <section class="chat-message-catalog__price">
            <span
              v-if="hasSalePrice(product)"
              class="chat-message-catalog__price--original"
              data-testid="chat-message-catalog-original-price"
            >
              {{ formatPriceWithCurrency(product.price, product.currency) }}
            </span>
            <span
              class="chat-message-catalog__price--current"
              data-testid="chat-message-catalog-price"
            >
              {{
                formatPriceWithCurrency(
                  hasSalePrice(product) ? product.sale_price : product.price,
                  product.currency,
                )
              }}
            </span>
          </section>
        </section>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import {
  formatPriceWithCurrency,
  parseProductPrice,
} from '@/services/assistant/currency';
import type {
  CatalogPayload,
  CatalogProductInfo,
} from '@/services/assistant/buildCatalogPayload';

defineOptions({
  name: 'ChatMessageCatalog',
});

const props = defineProps<{
  catalog: CatalogPayload;
}>();

const products = computed<CatalogProductInfo[]>(() =>
  (props.catalog?.products || []).flatMap(
    (group) => group.product_retailer_info || [],
  ),
);

function hasSalePrice(product: CatalogProductInfo): boolean {
  const salePrice = parseProductPrice(product.sale_price);
  const price = parseProductPrice(product.price);
  return salePrice > 0 && salePrice < price;
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

  &__list {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-2;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: $unnnic-space-2;
    min-width: 0;
  }

  &__image-container {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: $unnnic-space-12;
    height: $unnnic-space-12;
    overflow: hidden;
    border-radius: $unnnic-radius-2;
    background-color: $unnnic-color-bg-base-soft;
  }

  &__image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-1;
    min-width: 0;
  }

  &__name {
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font: $unnnic-font-action;
    color: $unnnic-color-fg-emphasized;
  }

  &__price {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: $unnnic-space-1;
    font: $unnnic-font-caption-2;
    color: $unnnic-color-fg-base;

    &--original {
      text-decoration: line-through;
    }
  }
}
</style>
