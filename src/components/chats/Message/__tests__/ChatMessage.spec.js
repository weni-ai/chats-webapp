import { describe, it, beforeEach, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import ChatsMessage from '../index.vue';

describe('ChatsMessage', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = mount(ChatsMessage, {
      slots: { default: 'Message text content' },
      props: { time: new Date() },
    });
  });

  it('should show reply icon on hover message', async () => {
    await wrapper.setProps({ enableReply: true });
    await wrapper.trigger('mouseover');

    expect(wrapper.vm.isHovering).toBe(true);
    const replyIcon = wrapper.find('[data-testid="reply-icon"]');

    expect(replyIcon.exists()).toBe(true);

    await replyIcon.trigger('click');

    expect(wrapper.emitted('reply')).toBeTruthy();

    await wrapper.trigger('mouseleave');
    expect(wrapper.vm.isHovering).toBe(false);
  });

  it('renders extra slot content inside the bubble', () => {
    wrapper = mount(ChatsMessage, {
      slots: {
        default: 'Message text content',
        extra: '<div data-testid="chat-message-extra">Catalog preview</div>',
      },
      props: { time: new Date() },
    });

    expect(wrapper.find('[data-testid="chat-message-extra"]').exists()).toBe(
      true,
    );
    expect(wrapper.find('[data-testid="chat-message-extra"]').text()).toBe(
      'Catalog preview',
    );
  });
});
