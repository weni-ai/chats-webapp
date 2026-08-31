<template>
  <section
    class="cart-badge"
    data-testid="assistant-cart-badge"
  >
    <UnnnicIcon
      icon="shopping_cart"
      size="sm"
      scheme="neutral-white"
    />
    <span class="cart-badge__count">{{ count }}</span>
  </section>
</template>

<script setup lang="ts">
defineOptions({
  name: 'AssistantCartBadge',
});

defineProps<{
  count: number;
}>();
</script>

<style lang="scss" scoped>
.cart-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: $unnnic-space-1;
  align-self: flex-end;
  min-width: $unnnic-space-10;
  height: $unnnic-space-8;
  padding: 0 $unnnic-space-4;
  border-radius: $unnnic-radius-2;
  background-color: $unnnic-color-bg-accent-strong;
  color: $unnnic-color-fg-on-primary;

  &__count {
    font: $unnnic-font-action;
    color: $unnnic-color-fg-on-primary;
  }
}
</style>
