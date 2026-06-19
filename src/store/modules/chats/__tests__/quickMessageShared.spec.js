import { setActivePinia, createPinia } from 'pinia';
import { describe, it, beforeEach, vi, expect } from 'vitest';
import { useQuickMessageShared } from '../quickMessagesShared';
import QuickMessage from '@/services/api/resources/chats/quickMessage';

vi.mock('@/services/api/resources/chats/quickMessage', () => ({
  default: {
    getAllBySector: vi.fn(),
    getBySectorV2: vi.fn(),
    getByProjectV2: vi.fn(),
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

  it('should load shared messages by sector only once across pages', async () => {
    QuickMessage.getBySectorV2
      .mockResolvedValueOnce({
        results: [{ uuid: '1', title: 'A', text: 'a', shortcut: 'a' }],
        next: 'next-page',
      })
      .mockResolvedValueOnce({
        results: [{ uuid: '2', title: 'B', text: 'b', shortcut: 'b' }],
        next: '',
      });

    await quickMessageSharedStore.loadBySectorIfNeeded('sector-1');

    expect(QuickMessage.getBySectorV2).toHaveBeenNthCalledWith(1, {
      sectorUuid: 'sector-1',
      next: '',
    });
    expect(QuickMessage.getBySectorV2).toHaveBeenNthCalledWith(2, {
      sectorUuid: 'sector-1',
      next: 'next-page',
    });
    expect(QuickMessage.getBySectorV2).toHaveBeenCalledTimes(2);
    expect(quickMessageSharedStore.sharedBySector('sector-1')).toHaveLength(2);
    expect(quickMessageSharedStore.requestedSectors).toContain('sector-1');

    await quickMessageSharedStore.loadBySectorIfNeeded('sector-1');
    expect(QuickMessage.getBySectorV2).toHaveBeenCalledTimes(2);
  });

  it('should reset requested sector when load fails', async () => {
    QuickMessage.getBySectorV2.mockRejectedValueOnce(new Error('fail'));

    await expect(
      quickMessageSharedStore.loadBySectorIfNeeded('sector-x'),
    ).rejects.toThrow('fail');
    expect(quickMessageSharedStore.requestedSectors).not.toContain('sector-x');
  });

  it('should paginate shared messages by project', async () => {
    QuickMessage.getByProjectV2.mockResolvedValueOnce({
      results: [{ uuid: '1', title: 'A', text: 'a', shortcut: 'a' }],
      next: 'next-project-page',
    });

    await quickMessageSharedStore.getByProjectNextPage();

    expect(quickMessageSharedStore.quickMessagesSharedByProject).toHaveLength(
      1,
    );
    expect(quickMessageSharedStore.nextQuickMessagesSharedByProject).toBe(
      'next-project-page',
    );
    expect(quickMessageSharedStore.hasMoreQuickMessagesSharedByProject).toBe(
      true,
    );

    QuickMessage.getByProjectV2.mockResolvedValueOnce({
      results: [{ uuid: '2', title: 'B', text: 'b', shortcut: 'b' }],
      next: '',
    });

    await quickMessageSharedStore.getByProjectNextPage();
    expect(quickMessageSharedStore.quickMessagesSharedByProject).toHaveLength(
      2,
    );
    expect(quickMessageSharedStore.hasMoreQuickMessagesSharedByProject).toBe(
      false,
    );

    await quickMessageSharedStore.getByProjectNextPage();
    expect(QuickMessage.getByProjectV2).toHaveBeenCalledTimes(2);
  });

  it('should rethrow errors from project pagination', async () => {
    QuickMessage.getByProjectV2.mockRejectedValueOnce(new Error('fail'));

    await expect(
      quickMessageSharedStore.getByProjectNextPage(),
    ).rejects.toThrow('fail');
    expect(quickMessageSharedStore.isLoadingQuickMessagesSharedByProject).toBe(
      false,
    );
    expect(quickMessageSharedStore.quickMessagesSharedByProjectRequested).toBe(
      false,
    );
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
