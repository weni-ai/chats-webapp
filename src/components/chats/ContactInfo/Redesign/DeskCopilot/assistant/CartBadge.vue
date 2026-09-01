<template>
  <UnnnicButton
    type="primary"
    size="small"
    iconLeft="shopping_cart"
    data-testid="assistant-cart-badge"
    :aria-label="$t('contact_info.desk_copilot.assistant.cart.title')"
    @click="emit('click')"
  >
    {{ count }}
  </UnnnicButton>
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
