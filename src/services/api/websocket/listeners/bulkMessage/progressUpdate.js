import { useBulkMessageSend } from '@/store/modules/chats/bulkMessageSend';
import { storeToRefs } from 'pinia';

export default (data, _ctx) => {
  const bulkMessageSendStore = useBulkMessageSend();
  const {
    sendingUuid,
    percentageSent,
    successTotal,
    failedTotal,
    totalToSend,
  } = storeToRefs(bulkMessageSendStore);

  if (sendingUuid.value !== data.uuid) return;

  totalToSend.value = data.total_to_send;
  percentageSent.value = data.percentage;

  if (data.percentage === 100) {
    successTotal.value = data.success_total;
    failedTotal.value = data.failed_total;
    bulkMessageSendStore.showFinishedAlert();
  }
};
