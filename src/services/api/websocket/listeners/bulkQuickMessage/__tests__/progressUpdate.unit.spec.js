import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

import progressUpdate from '../progressUpdate';
import { useBulkQuickMessageSend } from '@/store/modules/chats/bulkQuickMessageSend';

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

describe('bulkQuickMessage progressUpdate', () => {
  let store;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useBulkQuickMessageSend();
    store.clearData();
    store.sendingUuid = 'send-uuid';
    vi.clearAllMocks();
  });

  it('should ignore updates for a different uuid', () => {
    progressUpdate(
      {
        uuid: 'other-uuid',
        total_to_send: 10,
        percentage: 50,
      },
      {},
    );

    expect(store.totalToSend).toBe(0);
    expect(store.percentageSent).toBe(0);
  });

  it('should update progress totals for the current sending uuid', () => {
    progressUpdate(
      {
        uuid: 'send-uuid',
        total_to_send: 200,
        percentage: 50.12,
        success_total: 100,
        failed_total: 10,
      },
      {},
    );

    expect(store.totalToSend).toBe(200);
    expect(store.percentageSent).toBe(50.12);
  });

  it('should call showFinishedAlert when percentage reaches 100', () => {
    const showFinishedAlert = vi
      .spyOn(store, 'showFinishedAlert')
      .mockImplementation(() => {});

    progressUpdate(
      {
        uuid: 'send-uuid',
        total_to_send: 10,
        percentage: 100,
        success_total: 8,
        failed_total: 2,
      },
      {},
    );

    expect(store.successTotal).toBe(8);
    expect(store.failedTotal).toBe(2);
    expect(showFinishedAlert).toHaveBeenCalled();
  });
});
