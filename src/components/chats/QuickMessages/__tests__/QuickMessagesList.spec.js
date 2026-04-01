import { config, mount } from '@vue/test-utils';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import i18n from '@/plugins/i18n';
import QuickMessagesList from '../QuickMessagesList.vue';

beforeAll(() => {
  config.global.plugins = config.global.plugins.filter(
    (plugin) => plugin !== i18n,
  );
});

afterAll(() => {
  if (!config.global.plugins.includes(i18n)) {
    config.global.plugins.push(i18n);
  }
});

const messageA = {
  uuid: 'a',
  title: 'A',
  text: 'Short',
  shortcut: 'a',
};

const messageB = {
  uuid: 'b',
  title: 'B',
  text: 'x'.repeat(80),
  shortcut: 'b',
};

const UnnnicButtonStub = {
  name: 'UnnnicButton',
  inheritAttrs: false,
  props: ['iconLeft', 'type', 'size', 'text'],
  template:
    '<button type="button" data-testid="quick-messages-list-new-btn" @click="$emit(\'click\')">{{ text }}</button>',
};

const QuickMessageCardStub = {
  name: 'QuickMessageCard',
  props: [
    'quickMessage',
    'withActions',
    'showTooltip',
    'tooltipSide',
    'clickable',
  ],
  template: `
    <div
      :data-uuid="quickMessage.uuid"
      data-testid="quick-messages-list-stub-card"
    >
      <button
        type="button"
        data-testid="quick-messages-list-stub-card-select"
        @click="$emit('select', quickMessage)"
      />
      <button
        type="button"
        data-testid="quick-messages-list-stub-card-edit"
        @click="$emit('edit', quickMessage)"
      />
      <button
        type="button"
        data-testid="quick-messages-list-stub-card-delete"
        @click="$emit('delete', quickMessage)"
      />
    </div>
  `,
};

const UnnnicIconStub = {
  name: 'UnnnicIcon',
  inheritAttrs: false,
  props: ['icon', 'clickable'],
  template:
    '<span data-testid="quick-messages-list-expand-icon" @click="$emit(\'click\')" />',
};

const createWrapper = (props = {}) =>
  mount(QuickMessagesList, {
    props: {
      quickMessages: [],
      title: 'List title',
      ...props,
    },
    global: {
      mocks: {
        $t: (key) => (key === 'message' ? 'Message' : key),
      },
      stubs: {
        // Transition renders default slot; keep real transition or stub as false
        Transition: false,
        UnnnicButton: UnnnicButtonStub,
        QuickMessageCard: QuickMessageCardStub,
        UnnnicIcon: UnnnicIconStub,
      },
    },
  });

describe('QuickMessagesList.vue', () => {
  it('renders the list root and title', () => {
    const wrapper = createWrapper({ title: 'Personal' });
    expect(wrapper.find('[data-testid="quick-messages-list"]').exists()).toBe(
      true,
    );
    expect(
      wrapper.find('[data-testid="quick-messages-list-title"]').text(),
    ).toBe('Personal');
  });

  it('shows the new button when showNewButton is true and emits open-new-quick-message on click', async () => {
    const wrapper = createWrapper({
      quickMessages: [messageA],
      showNewButton: true,
    });
    const btn = wrapper.find('[data-testid="quick-messages-list-new-btn"]');
    expect(btn.exists()).toBe(true);
    expect(btn.text()).toBe('Message');
    await btn.trigger('click');
    expect(wrapper.emitted('open-new-quick-message')).toBeTruthy();
    expect(wrapper.emitted('open-new-quick-message')).toHaveLength(1);
  });

  it('hides the new button when showNewButton is false', () => {
    const wrapper = createWrapper({
      quickMessages: [messageA],
      showNewButton: false,
    });
    expect(
      wrapper.find('[data-testid="quick-messages-list-new-btn"]').exists(),
    ).toBe(false);
  });

  it('renders empty state text when there are no quick messages', () => {
    const wrapper = createWrapper({
      quickMessages: [],
      withoutMessagesText: '<em>No items</em>',
    });
    const empty = wrapper.find(
      '[data-testid="quick-messages-list-empty-text"]',
    );
    expect(empty.exists()).toBe(true);
    expect(empty.html()).toContain('<em>No items</em>');
    expect(
      wrapper.findAll('[data-testid="quick-messages-list-stub-card"]'),
    ).toHaveLength(0);
  });

  it('emits update:isEmpty when the list is empty (immediate watch)', () => {
    const wrapper = createWrapper({ quickMessages: [] });
    expect(wrapper.emitted('update:isEmpty')).toBeTruthy();
    expect(wrapper.emitted('update:isEmpty')[0]).toEqual([true]);
  });

  it('emits update:isEmpty false when the list has messages', () => {
    const wrapper = createWrapper({ quickMessages: [messageA] });
    expect(wrapper.emitted('update:isEmpty')).toBeTruthy();
    expect(wrapper.emitted('update:isEmpty')[0]).toEqual([false]);
  });

  it('renders one card per quick message', () => {
    const wrapper = createWrapper({
      quickMessages: [messageA, messageB],
    });
    const cards = wrapper.findAll(
      '[data-testid="quick-messages-list-stub-card"]',
    );
    expect(cards).toHaveLength(2);
    expect(cards[0].attributes('data-uuid')).toBe('a');
    expect(cards[1].attributes('data-uuid')).toBe('b');
  });

  it('forwards select-quick-message from the card', async () => {
    const wrapper = createWrapper({ quickMessages: [messageA] });
    await wrapper
      .find('[data-testid="quick-messages-list-stub-card-select"]')
      .trigger('click');
    expect(wrapper.emitted('select-quick-message')).toBeTruthy();
    expect(wrapper.emitted('select-quick-message')[0][0]).toEqual(messageA);
  });

  it('forwards edit-quick-message from the card', async () => {
    const wrapper = createWrapper({ quickMessages: [messageA] });
    await wrapper
      .find('[data-testid="quick-messages-list-stub-card-edit"]')
      .trigger('click');
    expect(wrapper.emitted('edit-quick-message')).toBeTruthy();
    expect(wrapper.emitted('edit-quick-message')[0][0]).toEqual(messageA);
  });

  it('forwards delete-quick-message from the card', async () => {
    const wrapper = createWrapper({ quickMessages: [messageA] });
    await wrapper
      .find('[data-testid="quick-messages-list-stub-card-delete"]')
      .trigger('click');
    expect(wrapper.emitted('delete-quick-message')).toBeTruthy();
    expect(wrapper.emitted('delete-quick-message')[0][0]).toEqual(messageA);
  });

  it('shows the expand control only when showExpand is true and there are messages', () => {
    const withExpand = createWrapper({
      quickMessages: [messageA],
      showExpand: true,
    });
    expect(
      withExpand
        .find('[data-testid="quick-messages-list-expand-icon"]')
        .exists(),
    ).toBe(true);

    const noExpand = createWrapper({
      quickMessages: [messageA],
      showExpand: false,
    });
    expect(
      noExpand.find('[data-testid="quick-messages-list-expand-icon"]').exists(),
    ).toBe(false);
  });

  it('does not show the expand control when the list is empty even if showExpand is true', () => {
    const wrapper = createWrapper({
      quickMessages: [],
      showExpand: true,
    });
    expect(
      wrapper.find('[data-testid="quick-messages-list-expand-icon"]').exists(),
    ).toBe(false);
  });

  it('toggles openQuickMessages when the expand icon is clicked', async () => {
    const wrapper = createWrapper({
      quickMessages: [messageA],
      showExpand: true,
    });
    expect(wrapper.vm.openQuickMessages).toBe(true);

    await wrapper
      .find('[data-testid="quick-messages-list-expand-icon"]')
      .trigger('click');
    expect(wrapper.vm.openQuickMessages).toBe(false);

    await wrapper
      .find('[data-testid="quick-messages-list-expand-icon"]')
      .trigger('click');
    expect(wrapper.vm.openQuickMessages).toBe(true);
  });
});
