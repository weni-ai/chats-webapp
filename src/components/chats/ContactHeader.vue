<template>
  <section class="contact-header">
    <section
      :class="['contact-header__container', { clickable }]"
      @click="clickable ? emit('click') : null"
    >
      <UnnnicChatsUserAvatar :username="contactName" />
      <section class="contact-header__name">
        <p>
          {{ contactName || `[${$t('unnamed_contact')}]` }}
        </p>
      </section>
    </section>
    <slot
      v-if="hasActionsSlot"
      name="actions"
    />
  </section>
</template>

<script setup>
import { computed, useSlots } from 'vue';

defineProps({
  contactName: {
    type: String,
    default: '',
  },
  clickable: {
    type: Boolean,
    default: false,
  },
});
const emit = defineEmits(['click']);
const slots = useSlots();

const hasActionsSlot = computed(() => !!slots.actions?.());
</script>

<style lang="scss" scoped>
.clickable {
  cursor: pointer;
}
.contact-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $unnnic-space-2 $unnnic-space-4;
  width: 100%;
  border-bottom: 1px solid $unnnic-color-border-soft;

  &__name {
    font: $unnnic-font-action;
    color: $unnnic-color-fg-emphasized;
  }

  &__container {
    display: flex;
    align-items: center;
    gap: $unnnic-space-1;
  }
}
</style>
