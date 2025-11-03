<template>
  <UnnnicChatsHeader
    class="header-quick-messages__header"
    data-testid="header-quick-messages"
    :title="$t('quick_messages.title')"
    avatarIcon="bolt"
    :close="() => $emit('close')"
  />
</template>

<script setup>
defineEmits(['close']);
</script>
