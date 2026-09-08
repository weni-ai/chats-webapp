<template>
  <section
    class="product-quantity-controls"
    data-testid="product-quantity-controls"
  >
    <UnnnicButton
      type="secondary"
      size="small"
      iconCenter="remove"
      data-testid="product-quantity-decrement"
      :aria-label="
        $t('contact_info.desk_copilot.assistant.decrease_quantity_action')
      "
      @click.stop="emit('decrement')"
    />
    <p
      class="product-quantity-controls__value"
      data-testid="product-quantity-value"
    >
      {{ quantity }}
    </p>
    <UnnnicButton
      type="secondary"
      size="small"
      iconCenter="add"
      data-testid="product-quantity-increment"
      :aria-label="
        $t('contact_info.desk_copilot.assistant.increase_quantity_action')
      "
      @click.stop="emit('increment')"
    />
  </section>
</template>

<script setup lang="ts">
defineOptions({
  name: 'ProductQuantityControls',
});

defineProps<{
  quantity: number;
}>();

const emit = defineEmits<{
  decrement: [];
  increment: [];
}>();
</script>

<style lang="scss" scoped>
.product-quantity-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $unnnic-space-2;
  width: 100%;

  &__value {
    flex: 1;
    min-width: 0;
    text-align: center;
    font: $unnnic-font-body;
    color: $unnnic-color-fg-emphasized;
  }
}
</style>
