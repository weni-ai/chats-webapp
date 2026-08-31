import { describe, it, expect, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';

import ContactsStatus from '../ContactsStatus.vue';

describe('ContactsStatus', () => {
  let wrapper;

  const createWrapper = (status = ['ongoing', 'waiting']) =>
    mount(ContactsStatus, {
      props: { status },
    });

  afterEach(() => {
    wrapper?.unmount();
  });

  it('should render both status checkboxes', () => {
    wrapper = createWrapper();

    expect(
      wrapper.find('[data-testid="contacts-status-ongoing"]').exists(),
    ).toBe(true);
    expect(
      wrapper.find('[data-testid="contacts-status-waiting"]').exists(),
    ).toBe(true);
    expect(wrapper.text()).toContain('Contacts in service');
    expect(wrapper.text()).toContain('Contacts waiting for service');
  });

  it('should emit update:status removing ongoing when toggled off', () => {
    wrapper = createWrapper(['ongoing', 'waiting']);

    wrapper.vm.toggleStatus('ongoing');

    expect(wrapper.emitted('update:status')[0][0]).toEqual(['waiting']);
  });

  it('should emit update:status adding waiting when toggled on', () => {
    wrapper = createWrapper(['ongoing']);

    wrapper.vm.toggleStatus('waiting');

    expect(wrapper.emitted('update:status')[0][0]).toEqual([
      'ongoing',
      'waiting',
    ]);
  });

  it('should mark checkboxes according to status prop', () => {
    wrapper = createWrapper(['ongoing']);

    const ongoing = wrapper.findComponent(
      '[data-testid="contacts-status-ongoing"]',
    );
    const waiting = wrapper.findComponent(
      '[data-testid="contacts-status-waiting"]',
    );

    expect(ongoing.props('modelValue')).toBe(true);
    expect(waiting.props('modelValue')).toBe(false);
  });

  it('should show error helper when no status is selected', () => {
    wrapper = createWrapper([]);

    expect(wrapper.text()).toContain('At least one status must be selected');
  });

  it('should not show error helper when at least one status is selected', () => {
    wrapper = createWrapper(['ongoing']);

    expect(wrapper.text()).not.toContain(
      'At least one status must be selected',
    );
  });
});
