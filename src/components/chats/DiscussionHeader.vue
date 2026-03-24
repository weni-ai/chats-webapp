<template>
  <section class="discussion-header">
    <section
      :class="['discussion-header__container', { clickable }]"
      @click="clickable ? emit('click') : null"
    >
      <section class="discussion-header__avatar">
        <UnnnicIcon
          icon="communication"
          size="ant"
        />
      </section>
      <section class="discussion-header__info">
        <p class="discussion-header__info-subject">{{ discussionSubject }}</p>
        <p class="discussion-header__info-contact">{{ discussionContact }}</p>
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
  discussionContact: {
    type: String,
    required: true,
  },
  discussionSubject: {
    type: String,
    required: true,
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
.discussion-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $unnnic-space-2 $unnnic-space-4;
  width: 100%;
  border-bottom: 1px solid $unnnic-color-border-soft;

  &__avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    background-color: $unnnic-color-purple-200;
    border-radius: $unnnic-radius-full;
  }

  &__info {
    display: flex;
    flex-direction: column;

    &-subject {
      font: $unnnic-font-action;
      color: $unnnic-color-fg-emphasized;
    }

    &-contact {
      font: $unnnic-font-caption-2;
      color: $unnnic-color-fg-base;
    }
  }

  &__container {
    display: flex;
    align-items: center;
    gap: $unnnic-space-1;
  }
}
</style>
