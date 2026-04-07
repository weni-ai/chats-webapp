<template>
  <section class="sectors-list">Sectors list</section>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';

import { useSettings } from '@/store/modules/settings';

defineOptions({
  name: 'SectorsList',
});

const settingsStore = useSettings();
const { getSectors } = settingsStore;

onMounted(() => {
  getSectors(true);
});
</script>

<style lang="scss" scoped>
.sectors-list {
  display: flex;
}
</style>
