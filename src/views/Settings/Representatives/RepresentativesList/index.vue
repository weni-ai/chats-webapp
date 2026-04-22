<template>
  <section class="settings-representatives-list">
    <RepresentativeCard
      v-for="representative in props.representatives"
      :key="representative.email"
      :selected="props.selectedRepresentatives.includes(representative.email)"
      :representative="representative"
      @update:selected="
        handleSelectedRepresentative(representative.email, $event)
      "
    />
  </section>
</template>

<script setup lang="ts">
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
}>();

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
