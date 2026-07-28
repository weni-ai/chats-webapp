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

    expect(wrapper.findAll('.unnnic-checkbox')).toHaveLength(2);
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
    const inputs = wrapper.findAll('input[type="checkbox"]');

    expect(inputs[0].element.checked).toBe(true);
    expect(inputs[1].element.checked).toBe(false);
  });
});
