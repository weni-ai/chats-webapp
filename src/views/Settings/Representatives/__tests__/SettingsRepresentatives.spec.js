import { mount, flushPromises, config } from '@vue/test-utils';
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
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';

import PauseStatusService from '@/services/api/resources/chats/pauseStatus';
import ProjectService from '@/services/api/resources/settings/project';
import SectorService from '@/services/api/resources/settings/sector';
import QueueService from '@/services/api/resources/settings/queue';
import RepresentativeService from '@/services/api/resources/settings/representative';
import { useConfig } from '@/store/modules/config';

import SettingsRepresentatives from '../index.vue';

vi.mock('@/services/api/resources/chats/pauseStatus', () => ({
  default: {
    getCustomBreakStatusTypeList: vi.fn(),
  },
}));

vi.mock('@/services/api/resources/settings/project', () => ({
  default: {
    getRepresentatives: vi.fn(),
  },
}));

vi.mock('@/services/api/resources/settings/sector', () => ({
  default: {
    list: vi.fn(),
  },
}));

vi.mock('@/services/api/resources/settings/queue', () => ({
  default: {
    listAllQueues: vi.fn(),
  },
}));

vi.mock('@/services/api/resources/settings/representative', () => ({
  default: {
    listAll: vi.fn(),
  },
}));

const HeaderFiltersRequestStub = {
  name: 'HeaderFilters',
  props: ['modelValue'],
  emits: ['update:modelValue', 'update:hasRepresentatives', 'requestData'],
  template:
    '<button type="button" data-testid="representatives-page-request-data" @click="$emit(\'requestData\')"></button>',
};

let savedGlobalMocks;

beforeAll(() => {
  savedGlobalMocks = { ...config.global.mocks };
  config.global.mocks = {};

  global.ResizeObserver =
    global.ResizeObserver ||
    class ResizeObserver {
      observe() {}

      unobserve() {}

      disconnect() {}
    };
});

afterAll(() => {
  config.global.mocks = savedGlobalMocks;
});

const representative = (overrides = {}) => ({
  name: 'Jane Doe',
  email: 'jane@example.com',
  status: 'online',
  chats_limit: { active: false, total: null },
  sector: [],
  sector_chats_total_limit: 0,
  ...overrides,
});

describe('Representatives/index.vue (SettingsRepresentatives)', () => {
  let wrapper;
  let pinia;

  const setupServicesDefaults = () => {
    PauseStatusService.getCustomBreakStatusTypeList.mockResolvedValue({
      results: [],
    });
    ProjectService.getRepresentatives.mockResolvedValue({
      results: [
        {
          user: {
            first_name: 'Ada',
            last_name: 'Lovelace',
            email: 'ada@example.com',
          },
        },
      ],
      next: false,
    });
    SectorService.list.mockResolvedValue({
      results: [{ uuid: 'sector-uuid-1', name: 'Sector 1' }],
      next: false,
    });
    QueueService.listAllQueues.mockResolvedValue({
      results: [],
      next: false,
    });
  };

  const mountPage = ({ stubHeaderFilters = false } = {}) => {
    pinia = createTestingPinia({ createSpy: vi.fn });
    setActivePinia(pinia);
    useConfig().$patch({
      project: { uuid: 'project-uuid-test', name: '', config: {} },
    });

    return mount(SettingsRepresentatives, {
      attachTo: document.body,
      global: {
        plugins: [pinia],
        stubs: stubHeaderFilters
          ? {
              HeaderFilters: HeaderFiltersRequestStub,
            }
          : {},
      },
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    setupServicesDefaults();
    RepresentativeService.listAll.mockResolvedValue({
      results: [{ agent: representative() }],
      count: 1,
    });
    wrapper = mountPage();
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
    pinia = undefined;
  });

  it('renders root and list region', async () => {
    await flushPromises();

    expect(wrapper.find('[data-testid="representatives-page"]').exists()).toBe(
      true,
    );
    expect(
      wrapper.find('[data-testid="representatives-page-list-region"]').exists(),
    ).toBe(true);
  });

  it('calls listAll on mount with pagination and filters', async () => {
    await flushPromises();

    expect(RepresentativeService.listAll).toHaveBeenCalledWith({
      offset: 0,
      limit: 15,
      filters: {
        status: [],
        representatives: [],
        sectors: [],
        queues: [],
      },
    });
  });

  it('shows loading until listAll resolves', async () => {
    let resolveList;
    RepresentativeService.listAll.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveList = () =>
            resolve({
              results: [{ agent: representative() }],
              count: 1,
            });
        }),
    );

    wrapper.unmount();
    wrapper = mountPage();

    await flushPromises();

    expect(
      wrapper.find('[data-testid="representatives-page-loading"]').exists(),
    ).toBe(true);

    resolveList();
    await flushPromises();

    expect(
      wrapper.find('[data-testid="representatives-page-loading"]').exists(),
    ).toBe(false);
  });

  it('renders representatives list when API returns agents', async () => {
    await flushPromises();

    expect(wrapper.find('[data-testid="representatives-list"]').exists()).toBe(
      true,
    );
    expect(
      wrapper.find('[data-testid="representatives-actions"]').exists(),
    ).toBe(true);
    expect(
      wrapper.find('[data-testid="representatives-page-pagination"]').exists(),
    ).toBe(true);
  });

  it('shows empty state when count is zero', async () => {
    RepresentativeService.listAll.mockResolvedValue({
      results: [],
      count: 0,
    });

    wrapper.unmount();
    wrapper = mountPage();
    await flushPromises();

    expect(
      wrapper.find('[data-testid="representatives-list-empty"]').exists(),
    ).toBe(true);
    expect(
      wrapper.find('[data-testid="representatives-actions"]').exists(),
    ).toBe(false);
    expect(
      wrapper.find('[data-testid="representatives-page-pagination"]').exists(),
    ).toBe(false);
  });

  it('loads another page when pagination changes', async () => {
    RepresentativeService.listAll.mockResolvedValue({
      results: Array.from({ length: 15 }, (_, i) => ({
        agent: representative({ email: `user${i}@example.com` }),
      })),
      count: 30,
    });

    wrapper.unmount();
    wrapper = mountPage();
    await flushPromises();

    RepresentativeService.listAll.mockClear();

    const pagination = wrapper.findComponent(
      '[data-testid="representatives-page-pagination-control"]',
    );
    await pagination.vm.$emit('update:modelValue', 2);
    await flushPromises();

    expect(RepresentativeService.listAll).toHaveBeenCalledWith({
      offset: 15,
      limit: 15,
      filters: {
        status: [],
        representatives: [],
        sectors: [],
        queues: [],
      },
    });
  });

  it('refetches when HeaderFilters emits request-data (page 1)', async () => {
    wrapper.unmount();
    wrapper = mountPage({ stubHeaderFilters: true });
    await flushPromises();

    RepresentativeService.listAll.mockClear();

    await wrapper
      .find('[data-testid="representatives-page-request-data"]')
      .trigger('click');
    await flushPromises();

    expect(RepresentativeService.listAll).toHaveBeenCalledTimes(1);
  });
});
