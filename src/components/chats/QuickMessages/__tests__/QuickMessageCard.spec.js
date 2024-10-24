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
    const chatText = wrapper.findComponent(
      '[data-testid="quick-message-card"]',
    );

    expect(chatText.exists()).toBe(true);

    expect(chatText.props('title')).toBe(quickMessage.title);
    expect(chatText.html()).contain(quickMessage.text);
  });

  it('emits "select" event with quickMessage on click', async () => {
    await wrapper.trigger('click');
    expect(wrapper.emitted('select')).toBeTruthy();
    expect(wrapper.emitted('select')[0][0]).toEqual(quickMessage);
  });
  it('displays actions when withActions is true', () => {
    const dropdown = wrapper.findComponent({ name: 'UnnnicDropdown' });
    expect(dropdown.exists()).toBe(true);
  });

  it('hides actions when withActions is false', async () => {
    await wrapper.setProps({ withActions: false });
    const dropdown = wrapper.findComponent({ name: 'UnnnicDropdown' });
    expect(dropdown.exists()).toBe(false);
  });

  it('emits "edit" event with quickMessage when edit action is clicked', async () => {
    const openDropdownIcon = wrapper.findComponent(
      '[data-testid="dropdown-trigger-icon"]',
    );
    await openDropdownIcon.trigger('click');
    const editItem = wrapper.findComponent('[data-testid="dropdown-edit"]');
    await editItem.trigger('click');
    expect(wrapper.emitted('edit')).toBeTruthy();
    expect(wrapper.emitted('edit')[0][0]).toEqual(quickMessage);
  });

  it('emits "delete" event with quickMessage when delete action is clicked', async () => {
    const openDropdownIcon = wrapper.findComponent(
      '[data-testid="dropdown-trigger-icon"]',
    );
    await openDropdownIcon.trigger('click');
    const deleteItem = wrapper.findComponent('[data-testid="dropdown-delete"]');
    await deleteItem.trigger('click');
    expect(wrapper.emitted('delete')).toBeTruthy();
    expect(wrapper.emitted('delete')[0][0]).toEqual(quickMessage);
  });

  it('displays the correct tooltip when not on mobile', async () => {
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.quickMessageCardInfo).toBe(
      wrapper.vm.$t('quick_messages.shortcut_tooltip', {
        shortcut: quickMessage.shortcut || quickMessage.title.toLowerCase(),
      }),
    );
  });

  it('displays no tooltip when on mobile', async () => {
    wrapper.vm.isMobile = true;
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.quickMessageCardInfo).toBe('');
  });
});
