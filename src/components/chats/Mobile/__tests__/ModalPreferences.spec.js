import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  afterAll,
} from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';

import { unnnicToastManager } from '@weni/unnnic-system';

import ModalPreferences from '@/components/chats/Mobile/ModalPreferences.vue';
import api from '@/services/api/resources/chats/pauseStatus';
import Profile from '@/services/api/resources/profile';
import { moduleStorage } from '@/utils/storage';

vi.spyOn(unnnicToastManager, 'success').mockImplementation(() => {});
vi.spyOn(unnnicToastManager, 'error').mockImplementation(() => {});

vi.mock('@/services/api/resources/chats/pauseStatus', () => ({
  default: {
    getCustomStatusTypeList: vi.fn(),
    getActiveCustomStatus: vi.fn(),
    closeCustomStatus: vi.fn().mockResolvedValue({}),
    createCustomStatus: vi.fn().mockResolvedValue({
      uuid: 'new-status-123',
      status_type: 'lunch',
    }),
  },
}));

vi.mock('@/services/api/resources/profile', () => ({
  default: {
    status: vi.fn().mockResolvedValue({
      data: { connection_status: 'OFFLINE' },
    }),
    updateStatus: vi.fn().mockResolvedValue({
      data: { connection_status: 'ONLINE' },
    }),
  },
}));

const statusList = [
  { value: 'active', label: 'Online', color: 'green' },
  { value: 'inactive', label: 'Offline', color: 'gray' },
  { value: 'lunch', label: 'Lunch', color: 'brown' },
  {
    value: 'long-pause',
    label: 'Uma pausa com o nome grande',
    color: 'brown',
  },
];

describe('ModalPreferences agent status', () => {
  let pinia;

  beforeEach(() => {
    pinia = createTestingPinia({
      createSpy: vi.fn,
      stubActions: false,
      initialState: {
        config: {
          project: {
            uuid: 'test-uuid',
            name: 'Project',
            config: {},
          },
          status: 'OFFLINE',
        },
        profile: {
          me: {
            email: 'agent@example.com',
            project_permission_role: 2,
            queues: [],
          },
        },
      },
    });
    setActivePinia(pinia);
    moduleStorage.clear({ useSession: true });

    api.getCustomStatusTypeList.mockResolvedValue(statusList);
    api.getActiveCustomStatus.mockResolvedValue(null);
    api.closeCustomStatus.mockResolvedValue({});
    api.createCustomStatus.mockResolvedValue({
      uuid: 'new-status-123',
      status_type: 'lunch',
    });
    Profile.updateStatus.mockResolvedValue({
      data: { connection_status: 'ONLINE' },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  const createWrapper = () => {
    return mount(ModalPreferences, {
      global: {
        plugins: [pinia],
      },
    });
  };

  const openStatusList = async (wrapper) => {
    await flushPromises();
    await wrapper.find('[data-testid="agent-status-trigger"]').trigger('click');
    await wrapper.vm.$nextTick();
  };

  it('lists the other agent statuses, including custom pauses', async () => {
    const wrapper = createWrapper();
    await openStatusList(wrapper);

    expect(wrapper.find('[data-testid="agent-status-label"]').text()).toBe(
      'Offline',
    );

    const items = wrapper.findAll('[data-testid="agent-status-item"]');
    expect(items.map((item) => item.text())).toEqual([
      'Online',
      'Lunch',
      'Uma pausa com o nome grande',
    ]);

    wrapper.unmount();
  });

  it('updates the connection status when Online is selected', async () => {
    const wrapper = createWrapper();
    await openStatusList(wrapper);

    const online = wrapper
      .findAll('[data-testid="agent-status-item"]')
      .find((item) => item.text() === 'Online');

    await online.trigger('click');
    await flushPromises();

    expect(Profile.updateStatus).toHaveBeenCalledWith({
      projectUuid: 'test-uuid',
      status: 'ONLINE',
    });
    expect(unnnicToastManager.success).toHaveBeenCalledWith(
      'Status updated to Online',
    );
    expect(wrapper.find('[data-testid="agent-status-list"]').exists()).toBe(
      false,
    );

    wrapper.unmount();
  });

  it('creates a custom status when a pause is selected', async () => {
    const wrapper = createWrapper();
    await openStatusList(wrapper);

    const lunch = wrapper
      .findAll('[data-testid="agent-status-item"]')
      .find((item) => item.text() === 'Lunch');

    await lunch.trigger('click');
    await flushPromises();

    expect(api.createCustomStatus).toHaveBeenCalledWith({
      email: 'agent@example.com',
      statusType: 'lunch',
    });
    expect(Profile.updateStatus).not.toHaveBeenCalled();
    expect(unnnicToastManager.success).toHaveBeenCalledWith(
      'Status updated to Lunch',
    );

    wrapper.unmount();
  });

  it('closes the active pause when switching back to Online or Offline', async () => {
    api.getActiveCustomStatus.mockResolvedValue({
      uuid: 'status-123',
      status_type: 'lunch',
      is_active: true,
      created_on: '2024-02-14T10:00:00+00:00',
    });

    const wrapper = createWrapper();
    await openStatusList(wrapper);

    expect(wrapper.find('[data-testid="agent-status-label"]').text()).toBe(
      'Lunch',
    );

    const online = wrapper
      .findAll('[data-testid="agent-status-item"]')
      .find((item) => item.text() === 'Online');

    await online.trigger('click');
    await flushPromises();

    expect(api.closeCustomStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        statusUuid: 'status-123',
        isActive: true,
      }),
    );
    expect(Profile.updateStatus).toHaveBeenCalledWith({
      projectUuid: 'test-uuid',
      status: 'ONLINE',
    });

    wrapper.unmount();
  });

  it('closes the active pause when switching to Offline', async () => {
    api.getActiveCustomStatus.mockResolvedValue({
      uuid: 'status-123',
      status_type: 'lunch',
      is_active: true,
      created_on: '2024-02-14T10:00:00+00:00',
    });

    const wrapper = createWrapper();
    await openStatusList(wrapper);

    const offline = wrapper
      .findAll('[data-testid="agent-status-item"]')
      .find((item) => item.text() === 'Offline');

    await offline.trigger('click');
    await flushPromises();

    expect(api.closeCustomStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        statusUuid: 'status-123',
        isActive: false,
      }),
    );

    wrapper.unmount();
  });

  it('shows an error toast when the status update fails', async () => {
    Profile.updateStatus.mockRejectedValueOnce(new Error('API Error'));

    const wrapper = createWrapper();
    await openStatusList(wrapper);

    const online = wrapper
      .findAll('[data-testid="agent-status-item"]')
      .find((item) => item.text() === 'Online');

    await online.trigger('click');
    await flushPromises();

    expect(unnnicToastManager.error).toHaveBeenCalledWith(
      'Failed to update the status. Try again.',
    );

    wrapper.unmount();
  });
});
