import { mount } from '@vue/test-utils';
import { expect, describe, it, beforeEach, vi } from 'vitest';

import ModalAddNewContact from '../ModalAddNewContact.vue';

import FlowsTrigger from '@/services/api/resources/chats/flowsTrigger.js';
import callUnnnicAlert from '@/utils/callUnnnicAlert';

vi.mock('@/utils/callUnnnicAlert');

vi.mock('@/services/api/resources/chats/flowsTrigger.js', () => ({
  default: {
    createContact: vi.fn(() => Promise.resolve()),
  },
}));

describe('ModalAddNewContact', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = mount(ModalAddNewContact);
  });

  it('renders correctly', () => {
    expect(wrapper.find('[data-testid="modal-add-new-contact"]').exists()).toBe(
      true,
    );

    expect(
      wrapper.findComponent('[data-testid="input-contact-name"]').exists(),
    ).toBe(true);

    expect(
      wrapper.findComponent('[data-testid="input-contact-tel"]').exists(),
    ).toBe(true);
  });

  it('validates form correctly', () => {
    expect(wrapper.vm.isValidForm).toBe(false);

    wrapper.setData({
      contact: {
        name: 'John Doe',
        tel: '+55 (11) 91234 5678',
      },
    });

    expect(wrapper.vm.isValidForm).toBe(true);

    // invalid tel test
    wrapper.setData({ contact: { tel: '+12345' } });
    expect(wrapper.vm.isValidForm).toBe(false);
  });

  it('submits contact correctly', async () => {
    const createContactSpy = vi.spyOn(FlowsTrigger, 'createContact');

    await wrapper.setData({
      contact: {
        name: 'John Doe',
        tel: '+55 (11) 91234 5678',
      },
    });

    const saveButton = wrapper.findComponent('[data-testid="save-button"]');

    await saveButton.trigger('click');

    expect(createContactSpy).toHaveBeenCalledWith(
      {
        name: 'John Doe',
        urns: ['whatsapp:5511912345678'],
      },
      '',
    );

    expect(callUnnnicAlert).toHaveBeenCalledWith({
      props: {
        text: wrapper.vm.$t('flows_trigger.successfully_add_contact'),
        type: 'success',
      },
      seconds: 5,
    });
  });

  it('shows error alert when contact already exists', async () => {
    vi.spyOn(FlowsTrigger, 'createContact').mockRejectedValue({
      response: { status: 400 },
    });

    await wrapper.setData({
      contact: {
        name: 'John Doe',
        tel: '+55 (11) 91234 5678',
      },
    });

    await wrapper.vm.saveNewContact();

    expect(callUnnnicAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        props: {
          text: wrapper.vm.$t('flows_trigger.contact_already_exists', {
            contact: ['5511912345678'],
          }),
          type: 'error',
        },
      }),
    );
  });

  it('adjusts input labels for mobile devices', async () => {
    await wrapper.setData({ isMobile: true });

    expect(wrapper.vm.inputLabelContactName).toBe('');
    expect(wrapper.vm.inputLabelContactTel).toBe('');
  });

  it('should emit close on modal emitted close', async () => {
    const modal = wrapper.findComponent(
      '[data-testid="modal-add-new-contact"]',
    );
    await modal.vm.$emit('close');
    expect(wrapper.emitted('close')[0]).toBeTruthy();
  });

  it('should emit close on click cancel button', async () => {
    const cancelButton = wrapper.findComponent('[data-testid="cancel-button"]');

    await cancelButton.trigger('click');

    expect(wrapper.emitted('close')[0]).toBeTruthy();
  });
});
