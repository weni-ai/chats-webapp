import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useBulkMessageSend = defineStore('bulkMessageSend', () => {
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

  return {
    clearData,
    sendingUuid,
    isSending,
    successTotal,
    failedTotal,
    totalToSend,
    percentageSent,
  };
});
