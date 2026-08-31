<template>
  <button
    type="button"
    class="cart-badge"
    data-testid="assistant-cart-badge"
    :aria-label="$t('contact_info.desk_copilot.assistant.cart.title')"
    @click="emit('click')"
  >
    <UnnnicIcon
      icon="shopping_cart"
      size="sm"
      scheme="neutral-white"
    />
    <span class="cart-badge__count">{{ count }}</span>
  </button>
</template>

<script setup lang="ts">
defineOptions({
  name: 'AssistantCartBadge',
});

defineProps<{
  count: number;
}>();

const emit = defineEmits<{
  click: [];
}>();
</script>

<style lang="scss" scoped>
.cart-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: $unnnic-space-1;
  align-self: flex-end;
  height: 37px;
  padding: $unnnic-space-3 $unnnic-space-4;
  border: 0;
  border-radius: $unnnic-radius-2;
  background-color: $unnnic-color-bg-accent-strong;
  color: $unnnic-color-fg-on-primary;
  cursor: pointer;

  &:hover {
    background-color: $unnnic-color-teal-11;
  }

  &:active {
    background-color: $unnnic-color-teal-12;
  }

  &__count {
    font: $unnnic-font-action;
    color: $unnnic-color-fg-on-primary;
  }
}
</style>
