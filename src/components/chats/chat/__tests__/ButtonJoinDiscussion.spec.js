import { mount } from '@vue/test-utils';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import ButtonJoinDiscussion from '../ButtonJoinDiscussion.vue';

import { createTestingPinia } from '@pinia/testing';

import { useDiscussions } from '@/store/modules/chats/discussions';

vi.mock('@/services/api/resources/chats/discussion', () => ({
  default: {
    addAgent: vi.fn(),
  },
}));

const createWrapper = () => {
  return mount(ButtonJoinDiscussion, {
    global: {
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          initialState: {
            profile: {
              me: {
                email: 'test@example.com',
              },
            },
          },
        }),
      ],
    },
  });
};

describe('ButtonJoinDiscussion.vue', () => {
  let wrapper;
  let discussionsStore;

  beforeEach(() => {
    wrapper = createWrapper();
    discussionsStore = useDiscussions();
  });

  it('renders the button with the correct text', () => {
    const button = wrapper.findComponent({ name: 'UnnnicButton' });
    expect(button.exists()).toBe(true);
    expect(button.props('text')).toBe(wrapper.vm.$t('discussions.join'));
    expect(button.props('type')).toBe('primary');
  });

  it('call joinDiscussion and emit join event on click join button', async () => {
    const joinDiscussion = vi.spyOn(wrapper.vm, 'joinDiscussion');

    const button = wrapper.findComponent({ name: 'UnnnicButton' });

    await button.trigger('click');

    expect(joinDiscussion).toHaveBeenCalled();
    expect(wrapper.emitted('join')).toBeTruthy();
  });

  it('emits "click" event after joinDiscussion completes', async () => {
    discussionsStore.addAgent.mockResolvedValue();

    await wrapper.vm.joinDiscussion();
    expect(wrapper.emitted('click')).toBeTruthy();
  });

  it('handles errors gracefully during joinDiscussion', async () => {
    const error = new Error('Test error');
    discussionsStore.addAgent.mockRejectedValue(error);
    console.error = vi.fn();

    await wrapper.vm.joinDiscussion();
    expect(console.error).toHaveBeenCalledWith(
      'An error ocurred when try join at discussion:',
      error,
    );
    expect(wrapper.vm.isLoading).toBe(false);
    expect(wrapper.emitted('click')).toBeTruthy();
  });

  it('disables the button when isLoading is true', async () => {
    await wrapper.setData({ isLoading: true });
    const button = wrapper.findComponent({ name: 'UnnnicButton' });
    expect(button.props('loading')).toBe(true);
  });
});
