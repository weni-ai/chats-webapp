<template>
  <section class="settings-representatives-list">
    <RepresentativeCard
      v-for="representative in formattedRepresentatives"
      :key="representative.email"
      :selected="props.selectedRepresentatives.includes(representative.email)"
      :representative="representative"
      @update:selected="
        handleSelectedRepresentative(representative.email, $event)
      "
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
  selectedRepresentatives: string[];
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

const handleSelectedRepresentative = (email: string, selected: boolean) => {
  if (selected) {
    emit('update:selectedRepresentatives', [
      ...props.selectedRepresentatives,
      email,
    ]);
  } else {
    emit(
      'update:selectedRepresentatives',
      props.selectedRepresentatives.filter(
        (selectedRepresentativeEmail) => selectedRepresentativeEmail !== email,
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
