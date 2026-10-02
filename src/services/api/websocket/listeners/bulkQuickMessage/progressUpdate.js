import { storeToRefs } from 'pinia';

import { useBulkQuickMessageSend } from '@/store/modules/chats/bulkQuickMessageSend';

export default (data, _ctx) => {
  const bulkQuickMessageSendStore = useBulkQuickMessageSend();
  const {
    sendingUuid,
    percentageSent,
    successTotal,
    failedTotal,
    totalToSend,
  } = storeToRefs(bulkQuickMessageSendStore);

  if (sendingUuid.value !== data.uuid) return;

  totalToSend.value = data.total_to_send;
  percentageSent.value = data.percentage;

  if (data.percentage === 100) {
    successTotal.value = data.success_total;
    failedTotal.value = data.failed_total;
    bulkQuickMessageSendStore.showFinishedAlert();
  }
};
