import { mount } from '@vue/test-utils';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { createTestingPinia } from '@pinia/testing';
import { useRooms } from '@/store/modules/chats/rooms';
import { useDiscussions } from '@/store/modules/chats/discussions';

import DiscussionsSession from '../DiscussionsSession.vue';

const createWrapper = () => {
  return mount(DiscussionsSession, {
    global: { plugins: [createTestingPinia()] },
  });
};

vi.mock('is-mobile', () => ({
  default: vi.fn(),
}));

describe('DiscussionSession.vue', () => {
  let wrapper;

  let discussionsStore;

  beforeEach(() => {
    wrapper = createWrapper();
    wrapper.vm.$data.isMobileFlag = true;

    discussionsStore = useDiscussions();
    discussionsStore.getAllClosed = vi.fn();
  });

  it('should apply mobile class if isMobile is true', async () => {
    discussionsStore.discussionsCloseds = [
      { uuid: '1', created_on: '2024-10-10', created_by: 'John' },
    ];

    wrapper.vm.$data.isMobileFlag = true;

    await wrapper.vm.$nextTick();

    expect(wrapper.find('.contact-info__discussions--mobile').exists()).toBe(
      true,
    );
  });

  it('should not apply mobile class if isMobile is false', () => {
    expect(wrapper.find('.contact-info__discussions--mobile').exists()).toBe(
      false,
    );
  });

  it('should not display discussions if discussionsCloseds is empty', () => {
    expect(
      wrapper.find('[data-testid="contact-info-discussion-title"]').exists(),
    ).toBe(false);
    expect(
      wrapper.find('[data-testid="contact-info-discussion-list').exists(),
    ).toBe(false);
  });

  it('should display title and discussions list if discussionsCloseds is not empty', async () => {
    discussionsStore.discussionsCloseds = [
      { uuid: '1', created_on: '2024-10-10', created_by: 'John' },
    ];
    await wrapper.vm.$nextTick();

    expect(
      wrapper.find('[data-testid="contact-info-discussion-title"]').exists(),
    ).toBe(true);

    expect(
      wrapper.find('[data-testid="contact-info-discussion-list"]').exists(),
    ).toBe(true);
  });

  it('should open the modal when a discussion is clicked', async () => {
    discussionsStore.discussionsCloseds = [
      { uuid: '1', created_on: '2024-10-10', created_by: 'John' },
    ];

    await wrapper.vm.$nextTick();

    await wrapper
      .find('[data-testid="contact-info-discussion-list-item"]')
      .trigger('click');

    expect(wrapper.vm.showDiscussionClosedModal).toBe(true);
  });

  it('should call setActiveDiscussion when a discussion is clicked', async () => {
    discussionsStore.setActiveDiscussion = vi.fn();
    discussionsStore.discussionsCloseds = [
      { uuid: '1', created_on: '2024-10-10', created_by: 'John' },
    ];
    await wrapper.vm.$nextTick();
    await wrapper
      .find('[data-testid="contact-info-discussion-list-item"]')
      .trigger('click');
    expect(discussionsStore.setActiveDiscussion).toHaveBeenCalledWith({
      uuid: '1',
    });
  });

  it('should close the modal when handleDiscussionClosedModal is called', async () => {
    await wrapper.setData({ showDiscussionClosedModal: true });
    wrapper.vm.handleDiscussionClosedModal();
    expect(wrapper.vm.showDiscussionClosedModal).toBe(false);
  });
});
