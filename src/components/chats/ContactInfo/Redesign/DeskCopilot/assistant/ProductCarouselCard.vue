<template>
  <article
    class="product-carousel-card"
    data-testid="product-carousel-card"
  >
    <section class="product-carousel-card__image-container">
      <img
        v-if="product.image"
        class="product-carousel-card__image"
        :src="product.image"
        :alt="product.name"
      />
      <UnnnicIcon
        v-else
        class="product-carousel-card__image-placeholder"
        icon="image"
        size="lg"
        scheme="fg-muted"
      />
    </section>

    <section class="product-carousel-card__content">
      <UnnnicToolTip
        :enabled="isTitleTruncated"
        side="top"
        :text="product.name"
      >
        <h3
          ref="titleRef"
          class="product-carousel-card__title"
          data-testid="product-carousel-card-title"
        >
          {{ product.name }}
        </h3>
      </UnnnicToolTip>

      <section class="product-carousel-card__price">
        <span
          v-if="hasSalePrice"
          class="product-carousel-card__price--original"
          data-testid="product-carousel-card-original-price"
        >
          {{ formatPriceWithCurrency(product.price, productCurrency) }}
        </span>
        <span
          class="product-carousel-card__price--current"
          data-testid="product-carousel-card-price"
        >
          {{
            formatPriceWithCurrency(
              hasSalePrice ? product.sale_price : product.price,
              productCurrency,
            )
          }}
        </span>
      </section>
    </section>

    <ProductQuantityControls
      v-if="quantity > 0"
      :quantity="quantity"
      @decrement="emit('decrement')"
      @increment="emit('increment')"
    />
    <section
      v-else
      class="product-carousel-card__actions"
    >
      <UnnnicButton
        type="secondary"
        size="small"
        iconCenter="shopping_cart"
        data-testid="product-carousel-card-add"
        :aria-label="
          $t('contact_info.desk_copilot.assistant.add_to_cart_action')
        "
        @click.stop="emit('add')"
      />
      <UnnnicToolTip
        enabled
        side="top"
        :text="
          $t('contact_info.desk_copilot.assistant.remove_suggestion_action')
        "
      >
        <UnnnicIcon
          icon="delete"
          size="sm"
          scheme="fg-critical"
          clickable
          data-testid="product-carousel-card-remove"
          :aria-label="
            $t('contact_info.desk_copilot.assistant.remove_suggestion_action')
          "
          @click.stop="emit('remove')"
        />
      </UnnnicToolTip>
    </section>
  </article>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';

import {
  formatPriceWithCurrency,
  parseProductPrice,
} from '@/services/assistant/currency';
import type { ProductCarouselItem } from '@/services/assistant/types';
import ProductQuantityControls from './ProductQuantityControls.vue';

defineOptions({
  name: 'ProductCarouselCard',
});

const props = defineProps<{
  product: ProductCarouselItem;
  quantity: number;
}>();

const emit = defineEmits<{
  add: [];
  remove: [];
  increment: [];
  decrement: [];
}>();

const titleRef = ref<HTMLElement | null>(null);
const isTitleTruncated = ref(false);
let resizeObserver: ResizeObserver | null = null;

const productCurrency = computed(() => props.product.currency || 'BRL');

const hasSalePrice = computed(() => {
  const salePrice = parseProductPrice(props.product.sale_price);
  const price = parseProductPrice(props.product.price);
  return salePrice > 0 && salePrice < price;
});

function syncTitleTruncation() {
  const title = titleRef.value;
  if (!title) {
    isTitleTruncated.value = false;
    return;
  }

  isTitleTruncated.value = title.scrollHeight - title.clientHeight > 1;
}

onMounted(() => {
  syncTitleTruncation();
  const title = titleRef.value;
  if (!title || typeof ResizeObserver === 'undefined') {
    return;
  }

  resizeObserver = new ResizeObserver(() => {
    syncTitleTruncation();
  });
  resizeObserver.observe(title);
});

onUnmounted(() => {
  resizeObserver?.disconnect();
  resizeObserver = null;
});

watch(
  () => props.product.name,
  async () => {
    await nextTick();
    syncTitleTruncation();
  },
);
</script>

<style lang="scss" scoped>
.product-carousel-card {
  display: flex;
  flex-direction: column;
  gap: $unnnic-space-2;
  flex-shrink: 0;
  width: 136px;
  padding: $unnnic-space-2;
  border-radius: $unnnic-radius-2;
  background-color: $unnnic-color-bg-base;

  &__image-container {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 120px;
    height: 120px;
    border-radius: $unnnic-radius-2;
    overflow: hidden;
    background-color: $unnnic-color-bg-soft;
  }

  &__image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__image-placeholder {
    flex-shrink: 0;
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-1;
    width: 100%;
    min-width: 0;
  }

  &__title {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    max-height: 40px;
    font: $unnnic-font-action;
    color: $unnnic-color-fg-emphasized;
    word-break: break-word;
  }

  &__price {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: $unnnic-space-1;
    width: 100%;
    font: $unnnic-font-caption-2;
    color: $unnnic-color-fg-base;

    &--original {
      text-decoration: line-through;
    }

    &--current {
      color: $unnnic-color-fg-base;
    }
  }

  &__actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
  }
}
</style>
