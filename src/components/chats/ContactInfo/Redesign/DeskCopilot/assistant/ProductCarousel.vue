<template>
  <section
    class="product-carousel"
    data-testid="product-carousel"
  >
    <section
      ref="trackRef"
      class="product-carousel__track"
      data-testid="product-carousel-track"
    >
      <ProductCarouselCard
        v-for="product in visibleProducts"
        :key="product.product_retailer_id"
        :product="product"
        :quantity="getQuantity(product.product_retailer_id)"
        @add="emit('add', product)"
        @remove="handleRemove(product)"
        @increment="emit('increment', product)"
        @decrement="emit('decrement', product)"
      />
    </section>

    <section
      v-if="hasOverflow"
      class="product-carousel__nav"
      data-testid="product-carousel-nav"
    >
      <UnnnicButton
        class="product-carousel__nav-button product-carousel__nav-button--left"
        :class="{
          'product-carousel__nav-button--hidden': !canScrollLeft,
        }"
        type="secondary"
        size="small"
        iconCenter="keyboard_arrow_left"
        :disabled="!canScrollLeft"
        data-testid="product-carousel-scroll-left"
        :aria-label="
          $t('contact_info.desk_copilot.assistant.carousel_scroll_left_action')
        "
        @click="scrollTrack(-1)"
      />
      <UnnnicButton
        class="product-carousel__nav-button product-carousel__nav-button--right"
        :class="{
          'product-carousel__nav-button--hidden': !canScrollRight,
        }"
        type="secondary"
        size="small"
        iconCenter="keyboard_arrow_right"
        :disabled="!canScrollRight"
        data-testid="product-carousel-scroll-right"
        :aria-label="
          $t('contact_info.desk_copilot.assistant.carousel_scroll_right_action')
        "
        @click="scrollTrack(1)"
      />
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';

import type { ProductCarouselItem } from '@/services/assistant/types';
import ProductCarouselCard from './ProductCarouselCard.vue';

defineOptions({
  name: 'ProductCarousel',
});

const SCROLL_EDGE_THRESHOLD_PX = 1;

const props = withDefaults(
  defineProps<{
    products: ProductCarouselItem[];
    getQuantity: (productId: string) => number;
    dismissedIds?: string[];
  }>(),
  {
    dismissedIds: () => [],
  },
);

const emit = defineEmits<{
  add: [product: ProductCarouselItem];
  remove: [product: ProductCarouselItem];
  increment: [product: ProductCarouselItem];
  decrement: [product: ProductCarouselItem];
}>();

const trackRef = ref<HTMLElement | null>(null);
const canScrollLeft = ref(false);
const canScrollRight = ref(false);
const hasOverflow = ref(false);
let resizeObserver: ResizeObserver | null = null;

const visibleProducts = computed(() =>
  props.products.filter(
    (product) => !props.dismissedIds.includes(product.product_retailer_id),
  ),
);

function syncScrollState() {
  const el = trackRef.value;
  if (!el) {
    return;
  }

  const { scrollLeft, scrollWidth, clientWidth } = el;
  const overflow = scrollWidth - clientWidth > SCROLL_EDGE_THRESHOLD_PX;

  hasOverflow.value = overflow;
  canScrollLeft.value = overflow && scrollLeft > SCROLL_EDGE_THRESHOLD_PX;
  canScrollRight.value =
    overflow &&
    scrollLeft + clientWidth < scrollWidth - SCROLL_EDGE_THRESHOLD_PX;
}

function scrollTrack(direction: number) {
  const el = trackRef.value;
  if (!el) {
    return;
  }

  const card = el.querySelector('.product-carousel-card') as HTMLElement | null;
  if (!card) {
    return;
  }

  const gap = Number.parseFloat(getComputedStyle(el).gap) || 0;
  el.scrollBy({
    left: direction * (card.offsetWidth + gap),
    behavior: 'smooth',
  });
}

function handleRemove(product: ProductCarouselItem) {
  emit('remove', product);
}

onMounted(() => {
  const el = trackRef.value;
  if (!el) {
    return;
  }

  syncScrollState();
  el.addEventListener('scroll', syncScrollState, { passive: true });
  window.addEventListener('resize', syncScrollState);

  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(syncScrollState);
    resizeObserver.observe(el);
  }
});

onUnmounted(() => {
  const el = trackRef.value;
  el?.removeEventListener('scroll', syncScrollState);
  window.removeEventListener('resize', syncScrollState);
  resizeObserver?.disconnect();
  resizeObserver = null;
});

watch(
  visibleProducts,
  async () => {
    await nextTick();
    syncScrollState();
  },
  { deep: true },
);
</script>

<style lang="scss" scoped>
.product-carousel {
  position: relative;
  width: 100%;
  min-width: 0;
  max-width: 100%;

  &:hover .product-carousel__nav {
    opacity: 1;

    .product-carousel__nav-button:not(.product-carousel__nav-button--hidden) {
      pointer-events: auto;
    }
  }

  &__track {
    display: flex;
    gap: $unnnic-space-2;
    width: 100%;
    min-width: 0;
    padding-right: $unnnic-space-4;
    overflow-x: auto;
    overflow-y: hidden;
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
    touch-action: pan-x;
    overscroll-behavior-x: contain;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  &__nav {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.2s ease;
    z-index: 1;
  }

  &__nav-button {
    position: relative;
    z-index: 1;
    pointer-events: none;
    box-shadow: $unnnic-shadow-1;

    &--left {
      margin-left: $unnnic-space-1;
    }

    &--right {
      margin-right: $unnnic-space-5;
    }

    &--hidden {
      visibility: hidden;
    }
  }
}
</style>
