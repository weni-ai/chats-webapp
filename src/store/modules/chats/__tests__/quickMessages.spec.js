import { setActivePinia, createPinia } from 'pinia';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { useQuickMessages } from '../quickMessages';
import QuickMessage from '@/services/api/resources/chats/quickMessage';

vi.mock('@/services/api/resources/chats/quickMessage', () => ({
  default: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('useQuickMessages Store', () => {
  let quickMessageStore;
  beforeEach(() => {
    setActivePinia(createPinia());
    quickMessageStore = useQuickMessages();
  });

  it('should initialize with correct state', () => {
    expect(quickMessageStore.quickMessages).toEqual([]);
    expect(quickMessageStore.nextQuickMessages).toBe('');
  });

  it('should fetch quick messages', async () => {
    const mockMessages = [
      { uuid: '1', title: 'Test', text: 'Message', shortcut: 't' },
    ];
    QuickMessage.getAll.mockResolvedValue({
      results: mockMessages,
      next: 'next-url',
    });

    await quickMessageStore.getAll();
    expect(quickMessageStore.quickMessages).toEqual(mockMessages);
    expect(quickMessageStore.nextQuickMessages).toBe('next-url');
  });

  it('should create a new quick message', async () => {
    const newMessage = {
      uuid: '2',
      title: 'New',
      text: 'Message',
      shortcut: 'n',
    };
    QuickMessage.create.mockResolvedValue(newMessage);

    await quickMessageStore.create(newMessage);
    expect(quickMessageStore.quickMessages[0]).toEqual(newMessage);
  });

  it('should update a quick message', async () => {
    quickMessageStore.quickMessages = [
      { uuid: '1', title: 'Old', text: 'Text', shortcut: 'o' },
    ];

    const updatedMessage = {
      uuid: '1',
      title: 'Updated',
      text: 'Updated text',
      shortcut: 'u',
    };
    QuickMessage.update.mockResolvedValue();

    await quickMessageStore.update(updatedMessage);
    expect(quickMessageStore.quickMessages[0]).toEqual(updatedMessage);
  });

  it('should delete a quick message', async () => {
    quickMessageStore.quickMessages = [
      { uuid: '1', title: 'Test', text: 'Message', shortcut: 't' },
    ];
    QuickMessage.delete.mockResolvedValue();

    await quickMessageStore.delete('1');
    expect(quickMessageStore.quickMessages).toEqual([]);
  });
});
