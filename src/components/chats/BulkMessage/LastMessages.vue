<template>
  <section
    class="last-messages"
    data-testid="last-messages"
  >
    <UnnnicDisclaimer
      v-for="message in props.messages"
      :key="message.uuid"
      type="attention"
      data-testid="last-message-disclaimer"
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
  min-width: 0;
  max-width: 100%;

  :deep(.unnnic-disclaimer__content),
  :deep(.unnnic-disclaimer__description) {
    word-break: break-word;
  }
}
</style>
