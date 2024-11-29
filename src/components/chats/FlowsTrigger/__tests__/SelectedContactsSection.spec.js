import { mount } from '@vue/test-utils';
import { expect, describe, it, beforeEach } from 'vitest';

import SelectedContactsSection from '../SelectedContactsSection.vue';

const contactsMock = [
  { uuid: '1', name: 'Contact 1' },
  { uuid: '2', name: 'Contact 2' },
];

describe('SelectedContactsSection', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = mount(SelectedContactsSection, { props: { contacts: [] } });
  });

  it('renders only if contacts are provided', async () => {
    expect(
      wrapper.find('[data-testid="selected-contacts-section"]').exists(),
    ).toBe(false);
    await wrapper.setProps({ contacts: [{ uuid: '1', name: 'Contact 1' }] });
    expect(
      wrapper.find('[data-testid="selected-contacts-section"]').exists(),
    ).toBe(true);
  });

  it('displays contacts as tags', async () => {
    await wrapper.setProps({ contacts: contactsMock });

    const tags = wrapper.findAllComponents('[data-testid="contact-tag"]');
    expect(tags).toHaveLength(contactsMock.length);
    expect(tags[0].props('text')).toBe(contactsMock[0].name);
    expect(tags[1].props('text')).toBe(contactsMock[1].name);
  });

  it('emits remove-contact event with correct contact on tag close', async () => {
    await wrapper.setProps({ contacts: [contactsMock[0]] });

    const tag = wrapper.findComponent('[data-testid="contact-tag"]');

    await tag.vm.$emit('close');

    expect(wrapper.emitted('remove-contact')[0]).toEqual([contactsMock[0]]);
  });

  it('emits click event when section is clicked or Enter is pressed', async () => {
    await wrapper.setProps({ contacts: [contactsMock[0]] });

    await wrapper.trigger('click');
    expect(wrapper.emitted('click')).toHaveLength(1);

    await wrapper.trigger('keypress.enter');
    expect(wrapper.emitted('click')).toHaveLength(2);
  });
});
