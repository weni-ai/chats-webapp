import { setActivePinia, createPinia } from 'pinia';
import { describe, it, beforeEach, vi, expect } from 'vitest';
import { useQuickMessageShared } from '../quickMessagesShared';
import QuickMessage from '@/services/api/resources/chats/quickMessage';

vi.mock('@/services/api/resources/chats/quickMessage', () => ({
  default: {
    getAllBySector: vi.fn(),
    createBySector: vi.fn(),
    updateBySector: vi.fn(),
    deleteBySector: vi.fn(),
  },
}));

describe('useQuickMessageShared Store', () => {
  let quickMessageSharedStore;
  beforeEach(() => {
    setActivePinia(createPinia());
    quickMessageSharedStore = useQuickMessageShared();
  });

  it('should fetch all shared quick messages', async () => {
    QuickMessage.getAllBySector.mockResolvedValue({
      results: [{ uuid: '1', title: 'Test', text: 'Hello', shortcut: '/t' }],
      next: 'next-page',
    });

    const messages = await quickMessageSharedStore.getAll();

    expect(QuickMessage.getAllBySector).toHaveBeenCalled();
    expect(quickMessageSharedStore.quickMessagesShared).toHaveLength(1);
    expect(quickMessageSharedStore.quickMessagesShared[0].uuid).toBe('1');
    expect(quickMessageSharedStore.nextQuickMessagesShared).toBe('next-page');
    expect(messages).toHaveLength(1);
  });

  it('should create a new shared quick message', async () => {
    const newMessage = {
      uuid: '2',
      sectorUuid: '123',
      title: 'New',
      text: 'Test',
      shortcut: '/n',
    };

    QuickMessage.createBySector.mockResolvedValue(newMessage);

    await quickMessageSharedStore.create({
      sectorUuid: '123',
      title: 'New',
      text: 'Test',
      shortcut: '/n',
    });

    expect(QuickMessage.createBySector).toHaveBeenCalledWith({
      sectorUuid: '123',
      title: 'New',
      text: 'Test',
      shortcut: '/n',
    });
    expect(quickMessageSharedStore.quickMessagesShared[0]).toEqual(newMessage);
  });

  it('should update a shared quick message', async () => {
    quickMessageSharedStore.quickMessagesShared = [
      { uuid: '1', title: 'Old', text: 'Test', shortcut: '/o' },
    ];
    QuickMessage.updateBySector.mockResolvedValue();

    await quickMessageSharedStore.update({
      quickMessageUuid: '1',
      title: 'Updated',
      text: 'New Text',
      shortcut: '/u',
    });

    expect(QuickMessage.updateBySector).toHaveBeenCalledWith('1', {
      title: 'Updated',
      text: 'New Text',
      shortcut: '/u',
    });
    expect(quickMessageSharedStore.quickMessagesShared[0]).toEqual({
      uuid: '1',
      title: 'Updated',
      text: 'New Text',
      shortcut: '/u',
    });
  });

  it('should delete a shared quick message', async () => {
    quickMessageSharedStore.quickMessagesShared = [
      { uuid: '1', title: 'Delete Me', text: 'Bye', shortcut: '/d' },
    ];
    QuickMessage.deleteBySector.mockResolvedValue();

    await quickMessageSharedStore.delete('1');

    expect(QuickMessage.deleteBySector).toHaveBeenCalledWith('1');
    expect(quickMessageSharedStore.quickMessagesShared).toHaveLength(0);
  });
});
