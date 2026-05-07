import { mount, flushPromises, config } from '@vue/test-utils';
import { nextTick } from 'vue';
import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  vi,
} from 'vitest';

import RepresentativeService from '@/services/api/resources/settings/representative';

import QueueManager from '../index.vue';

vi.mock('@/services/api/resources/settings/representative', () => ({
  default: {
    listRepresentativeQueuePermission: vi.fn(),
    updateRepresentativeQueuePermission: vi.fn(),
  },
}));

vi.mock('@/utils/overlay', () => ({
  handleConnectOverlay: vi.fn(),
}));

vi.mock('@weni/unnnic-system', async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    UnnnicCallAlert: vi.fn(),
    UnnnicToastManager: {
      ...mod.UnnnicToastManager,
      error: vi.fn(),
    },
  };
});

let savedGlobalMocks;

beforeAll(() => {
  savedGlobalMocks = { ...config.global.mocks };
  config.global.mocks = {};
});

afterAll(() => {
  config.global.mocks = savedGlobalMocks;
});

const listPermissionsPayload = {
  queue_permissions: [
    {
      sector: {
        name: 'Sector A',
        queues: [
          { uuid: 'queue-a1', name: 'QA1', agent_in_queue: true },
          { uuid: 'queue-a2', name: 'QA2', agent_in_queue: false },
        ],
      },
    },
  ],
};

const representative = (overrides = {}) => ({
  name: 'Agent One',
  email: 'agent@example.com',
  status: 'online',
  chats_limit: { active: false, total: null },
  sector: [],
  sector_chats_total_limit: 0,
  ...overrides,
});

describe('QueueManager/index.vue', () => {
  let wrapper;

  const mountComponent = (props = {}) => {
    return mount(QueueManager, {
      attachTo: document.body,
      props: {
        open: true,
        representatives: [representative()],
        ...props,
      },
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(
      RepresentativeService.listRepresentativeQueuePermission,
    ).mockResolvedValue(listPermissionsPayload);
    vi.mocked(
      RepresentativeService.updateRepresentativeQueuePermission,
    ).mockResolvedValue({});

    wrapper = mountComponent();
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
  });

  it('requests queue permissions for the first representative on mount', async () => {
    await flushPromises();

    expect(
      RepresentativeService.listRepresentativeQueuePermission,
    ).toHaveBeenCalledWith({
      representativeEmail: 'agent@example.com',
    });
  });

  it('hides loading and shows body after permissions load', async () => {
    let resolveList;
    vi.mocked(
      RepresentativeService.listRepresentativeQueuePermission,
    ).mockReset();
    vi.mocked(
      RepresentativeService.listRepresentativeQueuePermission,
    ).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveList = resolve;
        }),
    );

    wrapper.unmount();
    wrapper = mountComponent();
    await nextTick();

    expect(wrapper.find('[data-testid="queue-manager-loading"]').exists()).toBe(
      true,
    );

    resolveList(listPermissionsPayload);
    await flushPromises();

    expect(wrapper.find('[data-testid="queue-manager-loading"]').exists()).toBe(
      false,
    );
    expect(wrapper.find('[data-testid="queue-manager-body"]').exists()).toBe(
      true,
    );
  });

  it('shows chats limit for a single representative and hides bulk UI', async () => {
    await flushPromises();

    expect(
      wrapper.find('[data-testid="queue-manager-chats-limit"]').exists(),
    ).toBe(true);
    expect(wrapper.find('[data-testid="queue-manager-bulk"]').exists()).toBe(
      false,
    );
  });

  it('shows bulk UI when there is more than one representative', async () => {
    await wrapper.setProps({
      representatives: [
        representative(),
        representative({
          name: 'Agent Two',
          email: 'agent-two@example.com',
        }),
      ],
    });
    await flushPromises();

    expect(wrapper.find('[data-testid="queue-manager-bulk"]').exists()).toBe(
      true,
    );
    expect(
      wrapper.find('[data-testid="queue-manager-chats-limit"]').exists(),
    ).toBe(false);
  });

  it('renders sector queues and toolbar sections when loaded', async () => {
    await flushPromises();

    expect(wrapper.find('[data-testid="queue-manager-queues"]').exists()).toBe(
      true,
    );
    expect(
      wrapper.find('[data-testid="sector-queues-checkbox-root"]').exists(),
    ).toBe(true);
  });

  it('emits update:open when clicking cancel', async () => {
    await flushPromises();

    await wrapper.find('[data-testid="secondary-button"]').trigger('click');

    expect(wrapper.emitted('update:open')).toBeTruthy();
    const emits = wrapper.emitted('update:open');
    expect(emits[emits.length - 1][0]).toBe(false);
  });

  it('calls updateRepresentativeQueuePermission when saving after queue change', async () => {
    await flushPromises();

    await wrapper
      .find('[data-testid="sector-queues-checkbox-queue-queue-a2"]')
      .find('input[type="checkbox"]')
      .setValue(true);

    await wrapper.find('[data-testid="primary-button"]').trigger('click');
    await flushPromises();

    expect(
      RepresentativeService.updateRepresentativeQueuePermission,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        representatives: ['agent@example.com'],
        toAdd: ['queue-a2'],
      }),
    );
  });

  it('submits bulk add payload when bulk mode and action is add', async () => {
    await wrapper.setProps({
      representatives: [
        representative(),
        representative({
          name: 'Agent Two',
          email: 'agent-two@example.com',
        }),
      ],
    });
    await flushPromises();

    const bulkInputs = wrapper
      .find('[data-testid="queue-manager-bulk-radios"]')
      .findAll('input');
    expect(bulkInputs.length).toBeGreaterThan(0);
    await bulkInputs[0].setValue(true);

    await wrapper
      .find('[data-testid="sector-queues-checkbox-queue-queue-a2"]')
      .find('input[type="checkbox"]')
      .setValue(true);

    await wrapper.find('[data-testid="primary-button"]').trigger('click');
    await flushPromises();

    expect(
      RepresentativeService.updateRepresentativeQueuePermission,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        representatives: ['agent@example.com', 'agent-two@example.com'],
        toRemove: [],
        chatsLimit: undefined,
      }),
    );
    const bulkPayload =
      RepresentativeService.updateRepresentativeQueuePermission.mock
        .calls[0][0];
    expect(bulkPayload.toAdd).toContain('queue-a2');
    expect(bulkPayload.toAdd.length).toBeGreaterThan(0);
  });
});
