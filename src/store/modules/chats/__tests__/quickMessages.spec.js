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
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should initialize with correct state', () => {
    const store = useQuickMessages();
    expect(store.quickMessages).toEqual([]);
    expect(store.nextQuickMessages).toBe('');
  });

  it('should fetch quick messages', async () => {
    const store = useQuickMessages();
    const mockMessages = [
      { uuid: '1', title: 'Test', text: 'Message', shortcut: 't' },
    ];
    QuickMessage.getAll.mockResolvedValue({
      results: mockMessages,
      next: 'next-url',
    });

    await store.getAll();
    expect(store.quickMessages).toEqual(mockMessages);
    expect(store.nextQuickMessages).toBe('next-url');
  });

  it('should create a new quick message', async () => {
    const store = useQuickMessages();
    const newMessage = {
      uuid: '2',
      title: 'New',
      text: 'Message',
      shortcut: 'n',
    };
    QuickMessage.create.mockResolvedValue(newMessage);

    await store.create(newMessage);
    expect(store.quickMessages[0]).toEqual(newMessage);
  });

  it('should update a quick message', async () => {
    const store = useQuickMessages();
    store.quickMessages = [
      { uuid: '1', title: 'Old', text: 'Text', shortcut: 'o' },
    ];

    const updatedMessage = {
      uuid: '1',
      title: 'Updated',
      text: 'Updated text',
      shortcut: 'u',
    };
    QuickMessage.update.mockResolvedValue();

    await store.update(updatedMessage);
    expect(store.quickMessages[0]).toEqual(updatedMessage);
  });

  it('should delete a quick message', async () => {
    const store = useQuickMessages();
    store.quickMessages = [
      { uuid: '1', title: 'Test', text: 'Message', shortcut: 't' },
    ];
    QuickMessage.delete.mockResolvedValue();

    await store.delete('1');
    expect(store.quickMessages).toEqual([]);
  });
});
