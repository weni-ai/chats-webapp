<template>
  <component
    :is="componentToRender"
    :uuid="$route.params.uuid"
    :tab="$route.query.tab"
  />
</template>

<script>
import { useProfile } from '@/store/modules/profile';

import { mapState } from 'pinia';

import env from '@/utils/env';

import NewEdit from './index.vue';
import OldEdit from './EditOld.vue';

export default {
  components: { NewEdit, OldEdit },
  computed: {
    ...mapState(useProfile, ['me']),

    componentToRender() {
      const users = env('VITE_ENABLE_NEW_CONFIG_USERS').split(',');
      return users.includes(this.me.email) ? NewEdit : OldEdit;
    },
  },
};
</script>
