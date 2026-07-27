import { defineStore } from 'pinia';
import { ref } from 'vue';
import { UnnnicToastManager } from '@weni/unnnic-system';

import i18n from '@/plugins/i18n';

export const useBulkMessageSend = defineStore('bulkMessageSend', () => {
  const sendingUuid = ref<string | null>(null);
  const isSending = ref<boolean>(false);
  const successTotal = ref<number>(0);
  const failedTotal = ref<number>(0);
  const totalToSend = ref<number>(0);
  const percentageSent = ref<number>(0);

  const showBulkSendView = ref<boolean>(false);
  const showShippingModal = ref<boolean>(false);

  const clearData = () => {
    sendingUuid.value = null;
    isSending.value = false;
    successTotal.value = 0;
    failedTotal.value = 0;
    totalToSend.value = 0;
    percentageSent.value = 0;
    showBulkSendView.value = false;
  };

  const showFinishedAlert = () => {
    if (successTotal.value === totalToSend.value && failedTotal.value === 0) {
      UnnnicToastManager.success(
        i18n.global.t('mass_message.toast.success.message', {
          count: totalToSend.value,
        }),
      );
    } else if (
      failedTotal.value === totalToSend.value &&
      successTotal.value === 0
    ) {
      UnnnicToastManager.error(
        i18n.global.t('mass_message.toast.error.message', {
          count: totalToSend.value,
        }),
      );
    } else {
      UnnnicToastManager.attention(
        i18n.global.t('mass_message.toast.partial_success.message', {
          success: successTotal.value,
          failed: failedTotal.value,
        }),
        '',
        {
          button: {
            text: i18n.global.t('mass_message.toast.partial_success.button'),
            action: () => (showShippingModal.value = true),
          },
        },
      );
    }

    clearData();
  };

  return {
    clearData,
    showFinishedAlert,
    sendingUuid,
    isSending,
    successTotal,
    failedTotal,
    totalToSend,
    percentageSent,
    showShippingModal,
    showBulkSendView,
  };
});
