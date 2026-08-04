<template>
  <UnnnicDialogFooter class="shipping-history-modal__footer">
    <p class="shipping-history-modal__pagination-count">
      {{
        $t('pagination', {
          from,
          to,
          total,
        })
      }}
    </p>
    <UnnnicPagination
      v-if="max > 0"
      :modelValue="currentPage"
      :max="max"
      :show="show"
      data-testid="shipping-history-pagination"
      @update:model-value="emit('update:currentPage', $event)"
    />
  </UnnnicDialogFooter>
</template>

<script setup lang="ts">
defineOptions({
  name: 'ShippingHistoryFooter',
});

defineProps<{
  from: number;
  to: number;
  total: number;
  currentPage: number;
  max: number;
  show: number;
}>();

const emit = defineEmits<{
  'update:currentPage': [number];
}>();
</script>

<style scoped lang="scss">
.shipping-history-modal {
  &__footer {
    justify-content: space-between;
    width: 100%;
  }

  &__pagination-count {
    font: $unnnic-font-body;
    color: $unnnic-color-fg-emphasized;
    margin: 0;
  }
}
</style>
