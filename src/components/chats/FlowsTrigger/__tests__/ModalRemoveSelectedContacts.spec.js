import { mount } from '@vue/test-utils';
import { expect, describe, it, beforeEach } from 'vitest';

import ModalRemoveSelectedContacts from '../ModalRemoveSelectedContacts.vue';

const contactsMock = [{ uuid: '1', name: 'John Doe' }];

const dialogStubs = {
  UnnnicDialog: {
    name: 'UnnnicDialogStub',
    props: ['open'],
    template: `
      <div v-if="open" v-bind="$attrs">
        <slot />
      </div>
    `,
  },
  UnnnicDialogContent: {
    name: 'UnnnicDialogContentStub',
    props: ['size'],
    template: '<div><slot /></div>',
  },
  UnnnicDialogHeader: {
    name: 'UnnnicDialogHeaderStub',
    template: '<div><slot /></div>',
  },
  UnnnicDialogTitle: {
    name: 'UnnnicDialogTitleStub',
    template: '<div><slot /></div>',
  },
  UnnnicDialogFooter: {
    name: 'UnnnicDialogFooterStub',
    template: '<div><slot /></div>',
  },
};

describe('ModalRemoveSelectedContacts', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = mount(ModalRemoveSelectedContacts, {
      props: { contacts: contactsMock },
      global: { stubs: dialogStubs },
    });
  });

  it('renders correctly when contacts are provided', () => {
    // Com stubs do dialog, o conteúdo renderiza no wrapper (sem Teleport)
    expect(
      wrapper.find('[data-testid="modal-remove-selected-contacts"]').exists(),
    ).toBe(true);

    expect(
      wrapper.find('[data-testid="selected-contacts-section"]').exists(),
    ).toBe(true);

    expect(wrapper.find('[data-testid="confirm-button"]').exists()).toBe(true);

    expect(wrapper.find('[data-testid="cancel-button"]').exists()).toBe(true);
  });

  it('emits close event when cancel button is clicked', async () => {
    await wrapper.find('[data-testid="cancel-button"]').trigger('click');
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('adds contact to contactsToRemove when removeModalContact is called', async () => {
    const contact = contactsMock[0];

    const selectedContactsSection = wrapper.findComponent(
      '[data-testid="selected-contacts-section"]',
    );

    selectedContactsSection.vm.$emit('remove-contact', contact);

    await wrapper.vm.$nextTick();

    expect(wrapper.vm.contactsToRemove[0].uuid).toEqual(contact.uuid);
    expect(wrapper.vm.contactsToRemove[0].name).toEqual(contact.name);
  });

  it('computes newContacts excluding contactsToRemove', async () => {
    await wrapper.setProps({
      contacts: [...contactsMock, { uuid: '2', name: 'Jane Doe' }],
    });

    await wrapper.setData({ contactsToRemove: [contactsMock[0]] });

    expect(wrapper.vm.newContacts).toEqual([{ uuid: '2', name: 'Jane Doe' }]);
  });

  it('should emit remove-contacts on click confirm button', async () => {
    await wrapper.setProps({
      contacts: [...contactsMock, { uuid: '2', name: 'Jane Doe' }],
    });

    await wrapper.setData({ contactsToRemove: [contactsMock[0]] });

    await wrapper.find('[data-testid="confirm-button"]').trigger('click');

    expect(wrapper.emitted('remove-contacts')[0][0]).toStrictEqual([
      contactsMock[0],
    ]);
  });
});
