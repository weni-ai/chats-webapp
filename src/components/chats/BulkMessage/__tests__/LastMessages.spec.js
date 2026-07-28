import { describe, it, expect, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';

import LastMessages from '../LastMessages.vue';

describe('LastMessages', () => {
  let wrapper;

  const messages = [
    {
      uuid: 'msg-1',
      text: 'First message',
      sent_at: '2026-07-28T14:30:00Z',
    },
    {
      uuid: 'msg-2',
      text: 'Second message',
      sent_at: '2026-07-28T15:00:00Z',
    },
  ];

  const createWrapper = (propsMessages = messages) =>
    mount(LastMessages, {
      props: { messages: propsMessages },
    });

  afterEach(() => {
    wrapper?.unmount();
  });

  it('should render a disclaimer for each message', () => {
    wrapper = createWrapper();
    const disclaimers = wrapper.findAll(
      '[data-testid="last-message-disclaimer"]',
    );

    expect(disclaimers).toHaveLength(2);
    expect(disclaimers[0].text()).toContain('First message');
    expect(disclaimers[1].text()).toContain('Second message');
  });

  it('should render nothing when messages list is empty', () => {
    wrapper = createWrapper([]);

    expect(
      wrapper.findAll('[data-testid="last-message-disclaimer"]'),
    ).toHaveLength(0);
  });
});
