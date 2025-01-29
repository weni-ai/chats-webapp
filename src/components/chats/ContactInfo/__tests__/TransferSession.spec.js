import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';

import TransferSession from '../TransferSession.vue';
import RoomsTransferFields from '../../RoomsTransferFields.vue';

vi.mock('@/store/modules/chats/rooms', () => ({
  useRooms: vi.fn(() => ({
    activeRoom: { uuid: 'test-room-uuid' },
    setContactToTransfer: vi.fn(),
    setActiveRoom: vi.fn(),
  })),
}));

vi.mock('@/services/api/resources/settings/queue', () => ({
  default: {
    listByProject: vi.fn(() => ({
      results: [{ name: 'Queue', sector_name: 'Sector', uuid: '1' }],
    })),
  },
}));

describe('TransferSession', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = mount(TransferSession, {
      props: { isViewMode: false },
      global: { components: { RoomsTransferFields } },
    });
  });

  it('renders correctly with initial state', () => {
    expect(wrapper.find('[data-testid="transfer-session-title"]').text()).toBe(
      wrapper.vm.$t('transfer_contact'),
    );

    expect(
      wrapper.findComponent('[data-testid="transfer-fields"]').exists(),
    ).toBe(true);

    expect(
      wrapper.findComponent('[data-testid="transfer-button"]').exists(),
    ).toBe(true);
  });

  it('disables transfer button if no queue is selected', async () => {
    expect(
      wrapper
        .findComponent('[data-testid="transfer-button"]')
        .props('disabled'),
    ).toBe(true);

    await wrapper.setData({ selectedQueue: ['queue-1'] });

    expect(
      wrapper
        .findComponent('[data-testid="transfer-button"]')
        .props('disabled'),
    ).toBe(false);
  });

  it('calls transferRooms on button click', async () => {
    const transferRoomsMock = vi.spyOn(wrapper.vm, 'transferRooms');

    await wrapper.setData({ selectedQueue: ['queue-1'] });
    await wrapper.find('[data-testid="transfer-button"]').trigger('click');

    expect(transferRoomsMock).toHaveBeenCalled();
  });

  it('shows progress bar on mobile devices', async () => {
    wrapper.vm.isMobile = true;

    const handleFalseTransferProgressBarMock = vi.spyOn(
      wrapper.vm,
      'handleFalseTransferProgressBar',
    );
    await wrapper.setData({ selectedQueue: ['queue-1'] });
    await wrapper.find('[data-testid="transfer-button"]').trigger('click');

    expect(handleFalseTransferProgressBarMock).toHaveBeenCalled();
  });

  it('handles transferComplete with success status', async () => {
    const resetActiveRoomMock = vi.spyOn(wrapper.vm, 'resetActiveRoom');
    wrapper.vm.transferComplete('success');

    expect(resetActiveRoomMock).toHaveBeenCalled();
    expect(wrapper.vm.isLoading).toBe(false);
  });

  it('closes transfer progress bar when close is triggered', async () => {
    await wrapper.setData({ showTransferProgressBar: true });
    wrapper.vm.closeTransferProgressBar();

    expect(wrapper.vm.showTransferProgressBar).toBe(false);
  });

  it('handles false transfer progress bar promise flow', async () => {
    await wrapper.setData({ showTransferProgressBar: true });

    const promise = wrapper.vm.handleFalseTransferProgressBar();
    wrapper.vm.closeTransferProgressBar();
    await promise;

    expect(wrapper.emitted('transferred-contact')).toBeTruthy();
  });
});
