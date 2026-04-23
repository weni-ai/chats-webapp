<template>
  <section class="settings-representatives-list">
    <RepresentativeCard
      v-for="representative in formattedRepresentatives"
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
</template>

<script setup lang="ts">
import { computed } from 'vue';
import RepresentativeCard from './RepresentativeCard.vue';

defineOptions({
  name: 'SettingsRepresentativesList',
});

// TODO: type
interface Props {
  representatives: any[];
  selectedRepresentatives: any[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:selectedRepresentatives': [value: string[]];
  'click:representative': [value: any];
}>();

const formattedRepresentatives = computed(() => {
  return props.representatives.map((representative) => {
    const sanatizedSectors = representative.sector.filter(
      (sector) => sector.queues.length > 0,
    );
    return { ...representative, sector: sanatizedSectors };
  });
});

const handleSelectedRepresentative = (
  representative: any,
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
}
</style>
