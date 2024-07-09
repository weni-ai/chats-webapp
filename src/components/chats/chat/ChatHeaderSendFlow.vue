<template>
  <div class="chat-header-send-flow">
    <p>
      {{ $t('alert_last_message_date.message') }}
      <a
        class="chat-header-send-flow__trigger"
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
    >
      <UnnnicIconSvg
        icon="alert-circle-1-1"
        scheme="neutral-white"
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
  gap: $unnnic-spacing-nano;

  padding: $unnnic-spacing-nano;

  background-color: $unnnic-color-neutral-cloudy;

  color: $unnnic-color-neutral-white;
  font-size: $unnnic-font-size-body-gt;
  line-height: $unnnic-font-size-body-gt + $unnnic-line-height-md;

  &__trigger {
    text-decoration: underline;

    cursor: pointer;
  }
}
</style>
