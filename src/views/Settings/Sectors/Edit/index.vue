<template>
  <template v-if="currentSector">
    <SectorEditHeader :sectorName="currentSector.name" />
  </template>
</template>

<script>
import { mapActions, mapState } from 'pinia';

import { useSettings } from '@/store/modules/settings';

import SectorEditHeader from './SectorEditHeader.vue';

export default {
  name: 'EditSector',

  components: {
    SectorEditHeader,
  },

  computed: {
    ...mapState(useSettings, ['currentSector']),
  },

  created() {
    this.getCurrentSector(this.$route.params.uuid);
  },

  methods: {
    ...mapActions(useSettings, ['getCurrentSector']),
  },
};
</script>
