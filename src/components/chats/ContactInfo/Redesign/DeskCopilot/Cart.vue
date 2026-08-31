<template>
  <section
    class="desk-copilot-cart"
    data-testid="desk-copilot-cart"
  >
    <header class="desk-copilot-cart__header">
      <UnnnicButton
        type="tertiary"
        size="small"
        iconCenter="arrow_back"
        data-testid="desk-copilot-cart-back"
        :aria-label="$t('contact_info.desk_copilot.assistant.cart.back_action')"
        @click="emit('back')"
      />
      <CartBadge
        :count="totalQuantity"
        @click="emit('back')"
      />
    </header>

    <section class="desk-copilot-cart__content">
      <section
        class="desk-copilot-cart__items"
        data-testid="desk-copilot-cart-items"
      >
        <article
          v-for="item in items"
          :key="item.product_retailer_id"
          class="desk-copilot-cart__item"
          data-testid="desk-copilot-cart-item"
        >
          <section class="desk-copilot-cart__item-top">
            <section class="desk-copilot-cart__item-info">
              <section class="desk-copilot-cart__item-image-container">
                <img
                  v-if="item.image"
                  class="desk-copilot-cart__item-image"
                  :src="item.image"
                  :alt="item.name"
                />
                <UnnnicIcon
                  v-else
                  icon="image"
                  size="sm"
                  scheme="fg-muted"
                />
              </section>

              <section class="desk-copilot-cart__item-details">
                <h3 class="desk-copilot-cart__item-title">
                  {{ item.name }}
                </h3>
                <section class="desk-copilot-cart__item-price">
                  <span
                    v-if="hasSalePrice(item)"
                    class="desk-copilot-cart__item-price--original"
                  >
                    {{
                      formatPriceWithCurrency(item.price, itemCurrency(item))
                    }}
                  </span>
                  <span class="desk-copilot-cart__item-price--current">
                    {{
                      formatPriceWithCurrency(
                        hasSalePrice(item) ? item.sale_price : item.price,
                        itemCurrency(item),
                      )
                    }}
                  </span>
                </section>
              </section>
            </section>

            <UnnnicIcon
              icon="delete"
              size="sm"
              scheme="fg-critical"
              clickable
              data-testid="desk-copilot-cart-remove-item"
              :aria-label="
                $t(
                  'contact_info.desk_copilot.assistant.cart.remove_item_action',
                )
              "
              @click="emit('remove', item.product_retailer_id)"
            />
          </section>

          <section class="desk-copilot-cart__item-bottom">
            <ProductQuantityControls
              class="desk-copilot-cart__item-quantity"
              :quantity="item.quantity"
              @decrement="emit('decrement', item)"
              @increment="emit('increment', item)"
            />
            <p class="desk-copilot-cart__item-total">
              {{
                formatPriceWithCurrency(itemLineTotal(item), itemCurrency(item))
              }}
            </p>
          </section>
        </article>
      </section>

      <footer class="desk-copilot-cart__footer">
        <section class="desk-copilot-cart__summary">
          <section class="desk-copilot-cart__summary-row">
            <span>
              {{ $t('contact_info.desk_copilot.assistant.cart.subtotal') }}
            </span>
            <span>
              {{ formatPriceWithCurrency(subtotal, currency) }}
            </span>
          </section>
          <section
            v-if="discount > 0"
            class="desk-copilot-cart__summary-row"
          >
            <span>
              {{ $t('contact_info.desk_copilot.assistant.cart.discount') }}
            </span>
            <span>
              {{ formatPriceWithCurrency(discount, currency) }}
            </span>
          </section>
          <section
            class="desk-copilot-cart__summary-row desk-copilot-cart__summary-row--total"
          >
            <span>
              {{ $t('contact_info.desk_copilot.assistant.cart.total') }}
            </span>
            <span>
              {{ formatPriceWithCurrency(total, currency) }}
            </span>
          </section>
        </section>

        <UnnnicButton
          type="secondary"
          size="small"
          class="desk-copilot-cart__place-order"
          data-testid="desk-copilot-cart-place-order"
          @click="emit('placeOrder')"
        >
          {{
            $t('contact_info.desk_copilot.assistant.cart.place_order_action')
          }}
        </UnnnicButton>
      </footer>
    </section>
  </section>
</template>

<script setup lang="ts">
import {
  formatPriceWithCurrency,
  parseProductPrice,
} from '@/services/assistant/currency';
import type { CartProductItem } from '@/services/assistant/types';
import CartBadge from './assistant/CartBadge.vue';
import ProductQuantityControls from './assistant/ProductQuantityControls.vue';

defineOptions({
  name: 'DeskCopilotCart',
});

defineProps<{
  items: CartProductItem[];
  totalQuantity: number;
  currency: string;
  subtotal: number;
  discount: number;
  total: number;
}>();

const emit = defineEmits<{
  back: [];
  remove: [productId: string];
  increment: [item: CartProductItem];
  decrement: [item: CartProductItem];
  placeOrder: [];
}>();

function itemCurrency(item: CartProductItem) {
  return item.currency || 'BRL';
}

function hasSalePrice(item: CartProductItem) {
  const salePrice = parseProductPrice(item.sale_price);
  const price = parseProductPrice(item.price);
  return salePrice > 0 && salePrice < price;
}

function itemLineTotal(item: CartProductItem) {
  const unitPrice = hasSalePrice(item)
    ? parseProductPrice(item.sale_price)
    : parseProductPrice(item.price);
  return unitPrice * item.quantity;
}
</script>

<style lang="scss" scoped>
.desk-copilot-cart {
  display: flex;
  flex-direction: column;
  gap: $unnnic-space-3;
  height: 100%;
  min-height: 0;
  padding: $unnnic-space-2;
  background-color: $unnnic-color-bg-base;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
  }

  &__content {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: $unnnic-space-3;
    min-height: 0;
    overflow: hidden;
  }

  &__items {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: $unnnic-space-3;
    min-height: 0;
    overflow: auto;
  }

  &__item {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-2;
    width: 100%;
    padding: $unnnic-space-2;
    border: 1px solid $unnnic-color-border-base;
    border-radius: $unnnic-radius-2;
    background-color: $unnnic-color-bg-base;
  }

  &__item-top {
    display: flex;
    align-items: flex-start;
    gap: $unnnic-space-2;
    width: 100%;
  }

  &__item-info {
    display: flex;
    flex: 1;
    gap: $unnnic-space-2;
    align-items: flex-start;
    min-width: 0;
  }

  &__item-image-container {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    overflow: hidden;
    border-radius: $unnnic-radius-2;
    background-color: $unnnic-color-bg-base-soft;
  }

  &__item-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__item-details {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: $unnnic-space-1;
    min-width: 0;
  }

  &__item-title {
    font: $unnnic-font-action;
    color: $unnnic-color-fg-emphasized;
    word-break: break-word;
    white-space: pre-wrap;
  }

  &__item-price {
    display: flex;
    flex-wrap: wrap;
    gap: $unnnic-space-1;
    font: $unnnic-font-caption-2;
    color: $unnnic-color-fg-base;

    &--original {
      text-decoration: line-through;
    }
  }

  &__item-bottom {
    display: flex;
    align-items: flex-end;
    gap: $unnnic-space-2;
    width: 100%;
  }

  &__item-quantity {
    flex: 1;
    min-width: 0;
  }

  &__item-total {
    flex: 1;
    min-width: 0;
    text-align: right;
    font: $unnnic-font-action;
    color: $unnnic-color-fg-emphasized;
  }

  &__footer {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-3;
    width: 100%;
  }

  &__summary {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-1;
    width: 100%;
  }

  &__summary-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    font: $unnnic-font-body;
    color: $unnnic-color-fg-base;

    &--total {
      font: $unnnic-font-action;
      color: $unnnic-color-fg-emphasized;
    }
  }

  &__place-order {
    width: 100%;
  }
}
</style>
