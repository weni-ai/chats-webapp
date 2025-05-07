import { setActivePinia, createPinia } from 'pinia';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { useProfile } from '../profile';

import Queues from '@/services/api/resources/chats/queues';

vi.mock('@/services/api/resources/chats/queues', () => ({
  default: {
    getListQueues: vi.fn(),
  },
}));

describe('useProfile Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should initialize with an empty me object', () => {
    const profile = useProfile();
    expect(profile.me).toEqual({});
  });

  it('should update me state when setMe is called', () => {
    const profile = useProfile();
    const user = { id: 1, name: 'Eduardo' };

    profile.setMe(user);

    expect(profile.me).toEqual({ ...user, queues: undefined });
  });

  it('should retain queues when updating user with setMe', () => {
    const profile = useProfile();
    profile.me.queues = ['queue1', 'queue2'];

    const user = { id: 1, name: 'Eduardo' };
    profile.setMe(user);

    expect(profile.me).toEqual({ ...user, queues: ['queue1', 'queue2'] });
  });

  it('should fetch and update queues when getMeQueues is called', async () => {
    const profile = useProfile();
    Queues.getListQueues.mockResolvedValue({
      user_permissions: ['queueA', 'queueB'],
    });

    await profile.getMeQueues();

    expect(profile.me.queues).toEqual(['queueA', 'queueB']);
  });

  it('should handle empty response in getMeQueues', async () => {
    const profile = useProfile();
    Queues.getListQueues.mockResolvedValue({});

    await profile.getMeQueues();

    expect(profile.me.queues).toBeUndefined();
  });
});
