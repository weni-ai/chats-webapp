<template>
  <div class="chat-header-send-flow">
    <p data-testid="send-flow-text">
      {{ $t('alert_last_message_date.message') }}
      <a
        class="chat-header-send-flow__trigger"
        data-testid="send-flow-trigger"
        @click="$emit('send-flow')"
        @keypress.enter="$emit('send-flow')"
      >
        {{ $t('alert_last_message_date.message_send_flow') }}
      </a>
    </p>
    <UnnnicToolTip
      enabled
      :text="$t('alert_last_message_date.tip')"
      side="bottom"
      maxWidth="20rem"
      data-testid="tooltip"
    >
      <UnnnicIconSvg
        icon="alert-circle-1-1"
        scheme="fg-on-primary"
        size="sm"
      />
    </UnnnicToolTip>
  </div>
</template>

<script>
export default {
  name: 'ChatHeaderSendFlow',
  emits: ['send-flow'],
};
</script>

<style lang="scss" scoped>
.chat-header-send-flow {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: $unnnic-space-1;

  padding: $unnnic-space-1;

  background-color: $unnnic-color-fg-base;

  color: $unnnic-color-fg-on-primary;
  font: $unnnic-font-body;

  &__trigger {
    text-decoration: underline;

    cursor: pointer;
  }
}
</style>
