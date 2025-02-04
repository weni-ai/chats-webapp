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
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should fetch all shared quick messages', async () => {
    QuickMessage.getAllBySector.mockResolvedValue({
      results: [{ uuid: '1', title: 'Test', text: 'Hello', shortcut: '/t' }],
      next: 'next-page',
    });

    const store = useQuickMessageShared();
    const messages = await store.getAll();

    expect(QuickMessage.getAllBySector).toHaveBeenCalled();
    expect(store.quickMessagesShared).toHaveLength(1);
    expect(store.quickMessagesShared[0].uuid).toBe('1');
    expect(store.nextQuickMessagesShared).toBe('next-page');
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

    const store = useQuickMessageShared();
    await store.create({
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
    expect(store.quickMessagesShared[0]).toEqual(newMessage);
  });

  it('should update a shared quick message', async () => {
    const store = useQuickMessageShared();
    store.quickMessagesShared = [
      { uuid: '1', title: 'Old', text: 'Test', shortcut: '/o' },
    ];
    QuickMessage.updateBySector.mockResolvedValue();

    await store.update({
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
    expect(store.quickMessagesShared[0]).toEqual({
      uuid: '1',
      title: 'Updated',
      text: 'New Text',
      shortcut: '/u',
    });
  });

  it('should delete a shared quick message', async () => {
    const store = useQuickMessageShared();
    store.quickMessagesShared = [
      { uuid: '1', title: 'Delete Me', text: 'Bye', shortcut: '/d' },
    ];
    QuickMessage.deleteBySector.mockResolvedValue();

    await store.delete('1');

    expect(QuickMessage.deleteBySector).toHaveBeenCalledWith('1');
    expect(store.quickMessagesShared).toHaveLength(0);
  });
});
