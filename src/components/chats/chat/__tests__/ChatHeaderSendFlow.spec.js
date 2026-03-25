import { mount, config } from '@vue/test-utils';
import { describe, it, expect, beforeEach } from 'vitest';

import ChatHeaderSendFlow from '../ChatHeaderSendFlow.vue';

const createWrapper = () => {
  return mount(ChatHeaderSendFlow, {
    global: {
      components: {
        UnnnicToolTip: config.global.stubs.UnnnicToolTip,
      },
    },
  });
};

describe('ChatHeaderSendFlow.vue', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = createWrapper();
  });

  it('should emit "send-flow" when the link is clicked', async () => {
    await wrapper.find('[data-testid="send-flow-trigger"]').trigger('click');
    expect(wrapper.emitted('send-flow')).toBeTruthy();
  });

  it('should emit "send-flow" when "Enter" key is pressed on the link', async () => {
    await wrapper
      .find('[data-testid="send-flow-trigger"]')
      .trigger('keypress.enter');
    expect(wrapper.emitted('send-flow')).toBeTruthy();
  });

  it('should render the message and link correctly', () => {
    const message = wrapper.find('[data-testid="send-flow-text"]').text();
    expect(message).toContain(wrapper.vm.$t('alert_last_message_date.message'));
    expect(wrapper.find('[data-testid="send-flow-trigger"]').exists()).toBe(
      true,
    );
  });

  it('should render the tooltip', () => {
    const tooltip = wrapper.findComponent({ name: 'UnnnicToolTipStub' });
    expect(tooltip.exists()).toBe(true);
    expect(tooltip.props('text')).toBe(
      wrapper.vm.$t('alert_last_message_date.tip'),
    );
  });
});
