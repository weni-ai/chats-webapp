import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';

import HomeChatModals from '../HomeChatModals.vue';

import { useRooms } from '@/store/modules/chats/rooms';
import { useDashboard } from '@/store/modules/dashboard';

import { beforeEach, describe } from 'vitest';

const createWrapper = ({ store }) => {
  return mount(HomeChatModals, {
    global: { plugins: [store], stubs: { UnnnicModal: true } },
  });
};

describe('HomeChatModals.vue', () => {
  let wrapper;

  beforeEach(() => {
    const store = createTestingPinia({
      initialState: {
        rooms: {
          activeRoom: {
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

    await wrapper.vm.closeModal('getChat');
    expect(wrapper.vm.modalsShowing.getChat).toBe(false);
  });

  it('renders FileUploader and opens it when modalsShowing.fileUploader is true', async () => {
    wrapper.vm.openModal('fileUploader');

    expect(wrapper.vm.modalsShowing.fileUploader).toBe(true);

    await wrapper.vm.$nextTick();

    expect(wrapper.findComponent({ name: 'FileUploader' }).exists()).toBe(true);
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
});
