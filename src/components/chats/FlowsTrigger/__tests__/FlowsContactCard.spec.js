import { mount, config } from '@vue/test-utils';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import FlowsContactCard from '../FlowsContactCard.vue';
import i18n from '@/plugins/i18n';

const UnnnicSystemPlugin = config.global.plugins.find(
  (p) => p !== i18n && typeof p !== 'function',
);

beforeAll(() => {
  config.global.plugins = (config.global.plugins || []).filter(
    (plugin) => plugin !== i18n && plugin !== UnnnicSystemPlugin,
  );
});

afterAll(() => {
  if (!config.global.plugins.includes(i18n)) {
    config.global.plugins.push(i18n);
  }
  if (
    UnnnicSystemPlugin &&
    !config.global.plugins.includes(UnnnicSystemPlugin)
  ) {
    config.global.plugins.push(UnnnicSystemPlugin);
  }
});

const createWrapper = (props = {}) =>
  mount(FlowsContactCard, {
    props: {
      name: 'Aline',
      subtitle: 'tel:+5511999999999',
      selected: false,
      ...props,
    },
  });

describe('FlowsContactCard', () => {
  it('renders name, subtitle and the initial letter of the name', () => {
    const wrapper = createWrapper();

    expect(wrapper.find('[data-testid="flows-contact-card-name"]').text()).toBe(
      'Aline',
    );
    expect(
      wrapper.find('[data-testid="flows-contact-card-subtitle"]').text(),
    ).toBe('tel:+5511999999999');
    expect(
      wrapper.find('[data-testid="flows-contact-card-avatar"]').text(),
    ).toBe('A');
  });

  it('uppercases the initial letter and trims whitespace', () => {
    const wrapper = createWrapper({ name: '  joão  ' });

    expect(
      wrapper.find('[data-testid="flows-contact-card-avatar"]').text(),
    ).toBe('J');
  });

  it('falls back to a question mark for unnamed contacts', () => {
    const wrapper = createWrapper({
      name: '[unnamed]',
      unnamed: true,
    });

    expect(
      wrapper.find('[data-testid="flows-contact-card-avatar"]').text(),
    ).toBe('?');
  });

  it('falls back to a question mark when the name is empty', () => {
    const wrapper = createWrapper({ name: '   ' });

    expect(
      wrapper.find('[data-testid="flows-contact-card-avatar"]').text(),
    ).toBe('?');
  });

  it('renders the inner input as a native checkbox with the name as aria-label', () => {
    const wrapper = createWrapper();
    const input = wrapper.find('[data-testid="flows-contact-card-checkbox"]');

    expect(input.element.tagName).toBe('INPUT');
    expect(input.attributes('type')).toBe('checkbox');
    expect(input.attributes('aria-label')).toBe('Aline');
  });

  it('emits toggle when the inner checkbox change event fires', async () => {
    const wrapper = createWrapper();

    await wrapper
      .find('[data-testid="flows-contact-card-checkbox"]')
      .trigger('change');

    expect(wrapper.emitted('toggle')).toHaveLength(1);
  });

  it('reflects the selected state through data-selected, checked and the selected modifier', async () => {
    const wrapper = createWrapper();
    const card = wrapper.find('[data-testid="flows-contact-card"]');
    const input = wrapper.find('[data-testid="flows-contact-card-checkbox"]');

    expect(card.element.tagName).toBe('LABEL');
    expect(card.attributes('data-selected')).toBe('false');
    expect(card.attributes('role')).toBeUndefined();
    expect(input.element.checked).toBe(false);

    await wrapper.setProps({ selected: true });

    expect(card.attributes('data-selected')).toBe('true');
    expect(card.classes()).toContain('flows-contact-card--selected');
    expect(input.element.checked).toBe(true);
  });
});
