import { defineStore } from 'pinia';
import { ref } from 'vue';
import { UnnnicToastManager } from '@weni/unnnic-system';

import i18n from '@/plugins/i18n';

export const useBulkQuickMessageSend = defineStore(
  'bulkQuickMessageSend',
  () => {
    const sendingUuid = ref<string | null>(null);
    const isSending = ref<boolean>(false);
    const successTotal = ref<number>(0);
    const failedTotal = ref<number>(0);
    const totalToSend = ref<number>(0);
    const percentageSent = ref<number>(0);

    const clearData = () => {
      sendingUuid.value = null;
      isSending.value = false;
      successTotal.value = 0;
      failedTotal.value = 0;
      totalToSend.value = 0;
      percentageSent.value = 0;
    };

    const showFinishedAlert = () => {
      if (successTotal.value === totalToSend.value && failedTotal.value === 0) {
        UnnnicToastManager.success(
          i18n.global.t('quick_messages.bulk.toast.success.message', {
            count: totalToSend.value,
          }),
        );
      } else if (
        failedTotal.value === totalToSend.value &&
        successTotal.value === 0
      ) {
        UnnnicToastManager.error(
          i18n.global.t('quick_messages.bulk.toast.error.message'),
        );
      } else {
        UnnnicToastManager.attention(
          i18n.global.t('quick_messages.bulk.toast.partial_success.message', {
            success: successTotal.value,
            failed: failedTotal.value,
          }),
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
    };
  },
);
