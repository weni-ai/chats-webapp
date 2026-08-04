import { describe, it, beforeEach, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import ChatsMessage from '../index.vue';

import { useCompositionI18nInThisSpecFile } from '@/utils/test/compositionI18nVitest';

describe('ChatsMessage', () => {
  useCompositionI18nInThisSpecFile();

  let wrapper;

  beforeEach(() => {
    wrapper = mount(ChatsMessage, {
      slots: { default: 'Message text content' },
      props: { time: new Date() },
    });
  });

  it('should keep time visible while showing reply button on hover', async () => {
    await wrapper.setProps({ enableReply: true });
    await wrapper.trigger('mouseover');

    expect(wrapper.vm.isHovering).toBe(true);
    expect(wrapper.find('.unnnic-chats-message__time').exists()).toBe(true);
    expect(wrapper.find('[data-testid="reply-action"]').exists()).toBe(true);

    const replyIcon = wrapper.find('[data-testid="reply-icon"]');
    expect(replyIcon.exists()).toBe(true);

    await replyIcon.trigger('click');

    expect(wrapper.emitted('reply')).toBeTruthy();

    await wrapper.trigger('mouseleave');
    expect(wrapper.vm.isHovering).toBe(false);
    expect(wrapper.find('[data-testid="reply-action"]').exists()).toBe(false);
  });

  it('should place reply action after the bubble for received messages', async () => {
    await wrapper.setProps({ enableReply: true, type: 'received' });
    await wrapper.trigger('mouseover');

    const children = wrapper.find('.unnnic-chats-message-wrapper').element
      .children;
    expect(children[0].classList.contains('unnnic-chats-message')).toBe(true);
    expect(
      children[1].getAttribute('data-testid') === 'reply-action' ||
        children[1].classList.contains('unnnic-chats-message__reply-action'),
    ).toBe(true);
  });

  it('should use row-reverse for sent messages so reply stays beside the bubble', async () => {
    await wrapper.setProps({ enableReply: true, type: 'sent' });
    expect(wrapper.find('.unnnic-chats-message-wrapper').classes()).toContain(
      'sent',
    );
  });

  it('should emit reply when clicking anywhere on the message', async () => {
    await wrapper.setProps({ enableReply: true });

    await wrapper.find('[data-testid="message-wrapper"]').trigger('click');

    expect(wrapper.emitted('reply')).toBeTruthy();
  });

  it('should not emit reply when clicking the replied message preview', async () => {
    await wrapper.setProps({
      enableReply: true,
      replyMessage: {
        uuid: 'replied-1',
        text: 'Original message',
        contact: { name: 'Contact' },
      },
    });

    await wrapper.find('[data-testid="reply-message"]').trigger('click');

    expect(wrapper.emitted('reply')).toBeFalsy();
    expect(wrapper.emitted('click-reply-message')).toBeTruthy();
  });

  it('should not emit reply when reply is disabled', async () => {
    await wrapper.setProps({ enableReply: false });

    await wrapper.find('[data-testid="message-wrapper"]').trigger('click');

    expect(wrapper.emitted('reply')).toBeFalsy();
  });
});
