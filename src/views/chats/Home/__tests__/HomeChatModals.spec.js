import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';

import HomeChatModals from '../HomeChatModals.vue';

import { beforeEach, describe, expect, vi } from 'vitest';

const createWrapper = ({ store }) => {
  return mount(HomeChatModals, {
    global: {
      plugins: [store],
      stubs: {
        ModalCloseChat: true,
        ModalGetChat: true,
      },
    },
  });
};

describe('HomeChatModals.vue', () => {
  let wrapper;

  beforeEach(() => {
    const store = createTestingPinia({
      initialState: {
        rooms: {
          activeRoom: {
            uuid: '123',
            contact: {
              name: 'John Doe',
            },
          },
        },
        dashboard: {
          showModalAssumedChat: false,
        },
      },
    });
    wrapper = createWrapper({ store });
  });

  it('renders ModalGetChat when modalsShowing.getChat is true', () => {
    wrapper.vm.openModal('getChat');
    expect(wrapper.findComponent({ name: 'ModalGetChat' }).exists()).toBe(true);
  });

  it('closes ModalGetChat when closeModal is called', async () => {
    wrapper.vm.openModal('getChat');
    expect(wrapper.vm.modalsShowing.getChat).toBe(true);
    const getChatModal = wrapper.findComponent(
      '[data-testid="modal-get-chat"]',
    );
    getChatModal.vm.$emit('close-modal');
    expect(wrapper.vm.modalsShowing.getChat).toBe(false);
  });

  it('closes closeChat when close is called', async () => {
    wrapper.vm.openModal('closeChat');
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.modalsShowing.closeChat).toBe(true);
    const closeChatModal = wrapper.findComponent(
      '[data-testid="modal-close-chat"]',
    );
    closeChatModal.vm.$emit('close');
    expect(wrapper.vm.modalsShowing.closeChat).toBe(false);
  });

  it('emits got-chat when emitGotChat is called', async () => {
    await wrapper.vm.emitGotChat();
    expect(wrapper.emitted('got-chat')).toBeTruthy();
  });

  it('emits file-uploader-progress when emitFileUploaderProgress is called', async () => {
    const progress = 50;
    await wrapper.vm.emitFileUploaderProgress(progress);
    expect(wrapper.emitted('file-uploader-progress')).toBeTruthy();
    expect(wrapper.emitted('file-uploader-progress')[0]).toEqual([progress]);
  });

  it('log error on toggle undefined modal', () => {
    const spyLogError = vi.spyOn(console, 'error');
    wrapper.vm.toggleModal('undefined modal');
    expect(spyLogError).toHaveBeenCalledWith(
      `Modal 'undefined modal' does not exist.`,
    );
  });
});
