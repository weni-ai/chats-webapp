<template>
  <UnnnicChatsHeader
    :title="project.name"
    :subtitle="$t('flows_trigger.title')"
    :crumbs="crumbs"
    :close="() => $router.push({ name: 'home' })"
    avatarIcon="send-email-3-1"
    sectionIconScheme="weni-600"
    @crumb-click="handlerCrumbClick"
  >
    <UnnnicButton iconLeft="send-email-3-1">
      {{ $t('flows_trigger.fire') }}
    </UnnnicButton>
  </UnnnicChatsHeader>
</template>

<script>
import { mapState } from 'pinia';
import { useConfig } from '@/store/modules/config';

export default {
  name: 'FlowsTriggerView',
  computed: {
    ...mapState(useConfig, ['project']),
    crumbs() {
      return [
        { name: 'Chats', path: 'home' },
        { name: this.$t('flows_trigger.title'), path: 'flows-trigger' },
      ];
    },
  },
  methods: {
    handlerCrumbClick(crumb) {
      this.$router.push({ name: crumb.path });
    },
  },
};
</script>

<style lang="scss" scoped></style>
