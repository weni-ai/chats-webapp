import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { UnnnicToastManager } from '@weni/unnnic-system';

import { useBulkMessageSend } from '@/store/modules/chats/bulkMessageSend';

vi.mock('@weni/unnnic-system', async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    UnnnicToastManager: {
      ...mod.UnnnicToastManager,
      success: vi.fn(),
      error: vi.fn(),
      attention: vi.fn(),
    },
  };
});

describe('useBulkMessageSend', () => {
  let store;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useBulkMessageSend();
    vi.clearAllMocks();
  });

  describe('clearData', () => {
    it('should reset all sending state', () => {
      store.sendingUuid = 'uuid-1';
      store.isSending = true;
      store.successTotal = 5;
      store.failedTotal = 2;
      store.totalToSend = 7;
      store.percentageSent = 80;
      store.showBulkSendView = true;
      store.showShippingModal = true;

      store.clearData();

      expect(store.sendingUuid).toBeNull();
      expect(store.isSending).toBe(false);
      expect(store.successTotal).toBe(0);
      expect(store.failedTotal).toBe(0);
      expect(store.totalToSend).toBe(0);
      expect(store.percentageSent).toBe(0);
      expect(store.showBulkSendView).toBe(false);
      expect(store.showShippingModal).toBe(false);
    });
  });

  describe('showFinishedAlert', () => {
    it('should show success toast when all messages succeed', () => {
      store.totalToSend = 10;
      store.successTotal = 10;
      store.failedTotal = 0;
      store.sendingUuid = 'uuid-1';
      store.isSending = true;

      store.showFinishedAlert();

      expect(UnnnicToastManager.success).toHaveBeenCalled();
      expect(UnnnicToastManager.error).not.toHaveBeenCalled();
      expect(UnnnicToastManager.attention).not.toHaveBeenCalled();
      expect(store.sendingUuid).toBeNull();
      expect(store.isSending).toBe(false);
    });

    it('should show error toast when all messages fail', () => {
      store.totalToSend = 5;
      store.successTotal = 0;
      store.failedTotal = 5;

      store.showFinishedAlert();

      expect(UnnnicToastManager.error).toHaveBeenCalled();
      expect(UnnnicToastManager.success).not.toHaveBeenCalled();
      expect(UnnnicToastManager.attention).not.toHaveBeenCalled();
    });

    it('should show attention toast with action for partial success', () => {
      store.totalToSend = 10;
      store.successTotal = 7;
      store.failedTotal = 3;

      store.showFinishedAlert();

      expect(UnnnicToastManager.attention).toHaveBeenCalled();
      const attentionArgs = UnnnicToastManager.attention.mock.calls[0];
      expect(attentionArgs[2].button).toBeDefined();

      attentionArgs[2].button.action();

      expect(store.showBulkSendView).toBe(true);
      expect(store.showShippingModal).toBe(true);
    });
  });
});
