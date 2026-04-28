<template>
  <section
    v-if="props.representatives.length > 0"
    class="settings-representatives-list"
  >
    <RepresentativeCard
      v-for="representative in props.representatives"
      :key="representative.email"
      :selected="
        props.selectedRepresentatives.some(
          (selectedRepresentative) =>
            selectedRepresentative.email === representative.email,
        )
      "
      :representative="representative"
      @update:selected="handleSelectedRepresentative(representative, $event)"
      @click="emit('click:representative', representative)"
    />
  </section>
  <section
    v-else
    class="settings-representatives-list--empty"
  >
    <p class="settings-representatives-list--empty__title">
      {{
        emptyRepresentatives
          ? $t('config_chats.representatives.empty_list')
          : $t('config_chats.representatives.not_found_list')
      }}
    </p>
  </section>
</template>

<script setup lang="ts">
import RepresentativeCard from './RepresentativeCard.vue';

import type { Representative } from '../types';

defineOptions({
  name: 'SettingsRepresentativesList',
});

interface Props {
  representatives: Representative[];
  selectedRepresentatives: Representative[];
  emptyRepresentatives?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  emptyRepresentatives: false,
});

const emit = defineEmits<{
  'update:selectedRepresentatives': [value: Representative[]];
  'click:representative': [value: Representative];
}>();

const handleSelectedRepresentative = (
  representative: Representative,
  selected: boolean,
) => {
  if (selected) {
    emit('update:selectedRepresentatives', [
      ...props.selectedRepresentatives,
      representative,
    ]);
  } else {
    emit(
      'update:selectedRepresentatives',
      props.selectedRepresentatives.filter(
        (filterRepresentative) =>
          filterRepresentative.email !== representative.email,
      ),
    );
  }
};
</script>

<style lang="scss" scoped>
.settings-representatives-list {
  display: flex;
  flex-direction: column;
  gap: $unnnic-space-4;
  &--empty {
    &__title {
      font: $unnnic-font-body;
      color: $unnnic-color-fg-base;
    }
  }
}
</style>
