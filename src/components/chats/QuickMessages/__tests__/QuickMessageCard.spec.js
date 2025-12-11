import { mount } from '@vue/test-utils';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import QuickMessageCard from '../QuickMessageCard.vue';

const quickMessage = {
  title: 'Test Message',
  text: 'This is a test quick message',
  shortcut: 'test-shortcut',
};

vi.mock('is-mobile', () => ({
  default: vi.fn(),
}));

const createWrapper = (props = {}) => {
  return mount(QuickMessageCard, {
    props: { clickable: true, quickMessage, ...props },
  });
};

describe('QuickMessageCard.vue', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = createWrapper();
  });

  it('emits "select" when the container is clicked', async () => {
    const container = wrapper.find(
      '[data-testid="quick-message-card-container"]',
    );
    await container.trigger('click');
    expect(wrapper.emitted('select')).toBeTruthy();
    expect(wrapper.emitted('select')[0][0]).toEqual(quickMessage);
  });

  it('emits "select" when Enter key is pressed on the container', async () => {
    const container = wrapper.find(
      '[data-testid="quick-message-card-container"]',
    );
    await container.trigger('keypress.enter');
    expect(wrapper.emitted('select')).toBeTruthy();
    expect(wrapper.emitted('select')[0][0]).toEqual(quickMessage);
  });

  it('applies the "clickable" class when the prop is true', () => {
    const container = wrapper.find(
      '[data-testid="quick-message-card-container"]',
    );
    expect(container.classes()).toContain('clickable');
  });

  it('does not apply the "clickable" class when the prop is false', async () => {
    await wrapper.setProps({ clickable: false });
    const container = wrapper.find(
      '[data-testid="quick-message-card-container"]',
    );
    expect(container.classes()).not.toContain('clickable');
  });

  it('renders the message title and text correctly', () => {
    const headerTitle = wrapper.find(
      '[data-testid="quick-message-card-header-title"]',
    );
    expect(headerTitle.exists()).toBe(true);
    expect(headerTitle.text()).toBe(`/${quickMessage.shortcut}`);

    const contentText = wrapper.find(
      '[data-testid="quick-message-card-content-text"]',
    );
    expect(contentText.exists()).toBe(true);
    expect(contentText.text()).toBe(quickMessage.text);
  });

  it('emits "select" event with quickMessage on click', async () => {
    const container = wrapper.find(
      '[data-testid="quick-message-card-container"]',
    );
    await container.trigger('click');
    expect(wrapper.emitted('select')).toBeTruthy();
    expect(wrapper.emitted('select')[0][0]).toEqual(quickMessage);
  });
  it('displays actions when withActions is true', async () => {
    await wrapper.setProps({ withActions: true });
    await wrapper.vm.$nextTick();
    const dropdown = wrapper.find('[data-testid="dropdown-trigger-icon"]');
    expect(dropdown.exists()).toBe(true);
  });

  it('hides actions when withActions is false', async () => {
    await wrapper.setProps({ withActions: false });
    const dropdown = wrapper.findComponent({ name: 'UnnnicDropdown' });
    expect(dropdown.exists()).toBe(false);
  });
});
