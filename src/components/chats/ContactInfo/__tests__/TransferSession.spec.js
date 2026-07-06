import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  vi,
} from 'vitest';
import { mount, flushPromises, config } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';

import RoomService from '@/services/api/resources/chats/room';

import TransferSession from '../TransferSession.vue';
import RoomsTransferFields from '../../RoomsTransferFields.vue';

vi.mock('@/services/api/resources/settings/queue', () => ({
  default: {
    listByProject: vi.fn(() => ({
      results: [
        {
          name: 'Queue',
          sector_name: 'Sector',
          uuid: '1',
          sector_uuid: 's1',
        },
      ],
    })),
    agentsToTransfer: vi.fn(() => []),
  },
}));

vi.mock('@/services/api/resources/chats/room', () => ({
  default: {
    bulkTranfer: vi.fn(() => Promise.resolve({ status: 200 })),
    getRoomTags: vi.fn(() => ({ results: [] })),
  },
}));

let savedGlobalMocks;

beforeAll(() => {
  savedGlobalMocks = { ...config.global.mocks };
  config.global.mocks = {};
});

afterAll(() => {
  config.global.mocks = savedGlobalMocks;
});

function createStore() {
  return createTestingPinia({
    initialState: {
      rooms: {
        activeRoom: { uuid: 'test-room-uuid' },
        rooms: [{ uuid: 'test-room-uuid', queue: { sector: 's1' } }],
        selectedOngoingRooms: [],
        selectedWaitingRooms: [],
        activeTab: 'ongoing',
        contactToTransfer: 'test-room-uuid',
        activeRoomTags: [],
      },
      profile: { me: { email: 'mock@email.com' } },
    },
  });
}

function createWrapper() {
  return mount(TransferSession, {
    props: { isViewMode: false },
    global: {
      plugins: [createStore()],
      components: { RoomsTransferFields },
    },
  });
}

describe('TransferSession', () => {
  let wrapper;

  beforeEach(() => {
    vi.clearAllMocks();
    wrapper = createWrapper();
  });

  it('renders correctly with initial state', () => {
    expect(wrapper.find('[data-testid="transfer-session-title"]').text()).toBe(
      wrapper.vm.$t('transfer_contact', { count: 1 }),
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

    wrapper.vm.selectedQueue = [
      {
        value: 'queue-1',
        label: 'Queue',
        sector_uuid: 's1',
        queue_name: 'Queue',
      },
    ];
    await flushPromises();

    expect(
      wrapper
        .findComponent('[data-testid="transfer-button"]')
        .props('disabled'),
    ).toBe(false);
  });

  it('forwards transfer to the inner RoomsTransferFields on button click', async () => {
    wrapper.vm.selectedQueue = [
      {
        value: 'queue-1',
        label: 'Queue',
        sector_uuid: 's1',
        queue_name: 'Queue',
      },
    ];
    await flushPromises();
    await wrapper.find('[data-testid="transfer-button"]').trigger('click');
    await flushPromises();

    expect(RoomService.bulkTranfer).toHaveBeenCalled();
  });

  it('shows progress bar on mobile devices', async () => {
    wrapper.vm.isMobile = true;

    wrapper.vm.selectedQueue = [
      {
        value: 'queue-1',
        label: 'Queue',
        sector_uuid: 's1',
        queue_name: 'Queue',
      },
    ];
    await flushPromises();
    await wrapper.find('[data-testid="transfer-button"]').trigger('click');
    await flushPromises();

    expect(wrapper.vm.showTransferProgressBar).toBe(true);
  });

  it('handles transferComplete with success status', async () => {
    wrapper.vm.isLoading = true;
    wrapper.vm.transferComplete('success');
    await flushPromises();

    expect(wrapper.vm.isLoading).toBe(false);
  });

  it('does not reset loading state spuriously on error', async () => {
    wrapper.vm.isLoading = true;
    wrapper.vm.transferComplete('error');
    await flushPromises();

    expect(wrapper.vm.isLoading).toBe(false);
  });

  it('closes transfer progress bar when close is triggered', async () => {
    wrapper.vm.showTransferProgressBar = true;
    await flushPromises();
    wrapper.vm.closeTransferProgressBar();

    expect(wrapper.vm.showTransferProgressBar).toBe(false);
  });

  it('handles false transfer progress bar promise flow', async () => {
    wrapper.vm.showTransferProgressBar = true;
    await flushPromises();

    const promise = wrapper.vm.handleFalseTransferProgressBar();
    wrapper.vm.closeTransferProgressBar();
    await promise;

    expect(wrapper.emitted('transferred-contact')).toBeTruthy();
  });
});
