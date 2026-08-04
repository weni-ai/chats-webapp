<template>
  <section class="last-messages">
    <UnnnicDisclaimer
      v-for="message in props.messages"
      :key="message.uuid"
      type="attention"
      :description="
        $t('mass_message.history.last_message_disclaimer', {
          text: message.text,
          time: DateFnsFormat(new Date(message.sent_at), 'HH:mm'),
        })
      "
    />
  </section>
</template>

<script setup lang="ts">
import { format as DateFnsFormat } from 'date-fns';

interface MessageSent {
  uuid: string;
  text: string;
  sent_at: string;
}

const props = defineProps<{
  messages: MessageSent[];
}>();
</script>

<style scoped lang="scss">
.last-messages {
  display: flex;
  flex-direction: column;
  gap: $unnnic-space-2;
}
</style>
