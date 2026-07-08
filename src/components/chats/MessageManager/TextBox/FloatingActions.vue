<template>
  <Transition name="floating-actions">
    <section
      v-if="visible"
      class="floating-actions"
    >
      <UnnnicToolTip
        enabled
        side="top"
        :text="$t('chats.message_input_floating_actions.copy')"
      >
        <UnnnicIconSvg
          icon="content_copy"
          size="ant"
          scheme="fg-base"
          clickable
          data-testid="floating-actions-copy"
          @click="handleCopyInputMessageToClipboard"
        />
      </UnnnicToolTip>
      <UnnnicToolTip
        enabled
        side="top"
        :text="$t('chats.message_input_floating_actions.clear')"
      >
        <UnnnicIconSvg
          icon="close"
          size="ant"
          scheme="fg-critical"
          clickable
          data-testid="floating-actions-clear"
          @click="handleClearInputs"
        />
      </UnnnicToolTip>
    </section>
  </Transition>
</template>

<script setup lang="ts">
import { useMessageManager } from '@/store/modules/chats/messageManager';
import { UnnnicCallAlert } from '@weni/unnnic-system';

import i18n from '@/plugins/i18n';

const { t } = i18n.global;

defineOptions({
  name: 'MessageManagerTextBoxFloatingActions',
});

defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
});

const { clearInputs, copyInputMessageToClipboard } = useMessageManager();

const handleCopyInputMessageToClipboard = () => {
  copyInputMessageToClipboard();
  UnnnicCallAlert({
    props: {
      text: t('chats.message_input_floating_actions.copy_alert_success'),
      type: 'success',
    },
  });
};

const handleClearInputs = () => {
  clearInputs();
  UnnnicCallAlert({
    props: {
      type: 'success',
      text: t('chats.message_input_floating_actions.clear_alert_success'),
    },
  });
};
</script>

<style scoped lang="scss">
.floating-actions {
  display: flex;
  align-items: center;
  gap: $unnnic-space-4;
  padding: $unnnic-space-2 $unnnic-space-4;

  border-radius: $unnnic-radius-2;
  border: 1px solid $unnnic-color-border-base;
  background: $unnnic-color-bg-base;
  box-shadow: $unnnic-shadow-1;

  position: absolute;
  right: 0;
  bottom: calc(100% + $unnnic-space-2);
  z-index: 1;
}

.floating-actions-enter-active {
  transition:
    transform 0.25s cubic-bezier(0, 0, 0.2, 1),
    opacity 0.25s cubic-bezier(0, 0, 0.2, 1);
}

.floating-actions-leave-active {
  transition:
    transform 0.22s cubic-bezier(0.4, 0, 1, 1),
    opacity 0.18s cubic-bezier(0.4, 0, 1, 1);
  pointer-events: none;
  will-change: transform, opacity;
}

.floating-actions-enter-from {
  opacity: 0;
  transform: translateY($unnnic-space-2);
}

.floating-actions-leave-to {
  opacity: 0;
  transform: translateY($unnnic-space-3);
}
</style>
