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
        UnnnicModal: true,
        ModalQuickMessages: true,
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
          assumedChatContactName: 'Jane Doe',
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

  it('closes assumedChat when close is called', async () => {
    wrapper.vm.openModal('assumedChat');
    expect(wrapper.vm.modalsShowing.assumedChat).toBe(true);
    const assumeChatModal = wrapper.findComponent(
      '[data-testid="modal-assume-chat"]',
    );
    assumeChatModal.vm.$emit('close');
    expect(wrapper.vm.modalsShowing.assumedChat).toBe(false);
  });

  it('closes closeChat when close is called', async () => {
    wrapper.vm.openModal('closeChat');
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.modalsShowing.closeChat).toBe(true);
    const assumeChatModal = wrapper.findComponent(
      '[data-testid="modal-close-chat"]',
    );
    assumeChatModal.vm.$emit('close');
    expect(wrapper.vm.modalsShowing.assumedChat).toBe(false);
  });

  it('closes quickMessages when close is called', async () => {
    wrapper.vm.openModal('quickMessages');
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.modalsShowing.quickMessages).toBe(true);
    const assumeChatModal = wrapper.findComponent(
      '[data-testid="quick-messages-modal"]',
    );
    assumeChatModal.vm.$emit('close');
    expect(wrapper.vm.modalsShowing.quickMessages).toBe(false);
  });

  it('closes fileUploader when close is called', async () => {
    wrapper.vm.openModal('fileUploader');
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.modalsShowing.fileUploader).toBe(true);

    const fileUploadModal = wrapper.findComponent(
      '[data-testid="modal-file-uploader"]',
    );
    fileUploadModal.vm.$emit('close');
    expect(wrapper.vm.modalsShowing.fileUploader).toBe(false);
  });

  it('renders FileUploader and opens it when modalsShowing.fileUploader is true', async () => {
    wrapper.vm.openModal('fileUploader');

    expect(wrapper.vm.modalsShowing.fileUploader).toBe(true);

    await wrapper.vm.$nextTick();

    expect(wrapper.findComponent({ name: 'FileUploader' }).exists()).toBe(true);
  });

  it('update modalFileUploaderFiles on update v-model', async () => {
    wrapper.vm.openModal('fileUploader');
    await wrapper.vm.$nextTick();
    const fileUploadModal = wrapper.findComponent(
      '[data-testid="modal-file-uploader"]',
    );

    fileUploadModal.vm.$emit('update:model-value', [
      { name: 'file.pdf', type: 'application/pdf' },
    ]);

    expect(wrapper.vm.modalFileUploaderFiles).toStrictEqual([
      { name: 'file.pdf', type: 'application/pdf' },
    ]);
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

  it('emits select-quick-message when emitSelectQuickMessage is called', async () => {
    const quickMessage = 'Hello!';
    await wrapper.vm.emitSelectQuickMessage(quickMessage);
    expect(wrapper.emitted('select-quick-message')).toBeTruthy();
    expect(wrapper.emitted('select-quick-message')[0]).toEqual([quickMessage]);
  });

  it('log error on toggle undefined modal', () => {
    const spyLogError = vi.spyOn(console, 'error');
    wrapper.vm.toggleModal('undefined modal');
    expect(spyLogError).toHaveBeenCalledWith(
      `Modal 'undefined modal' does not exist.`,
    );
  });
});
