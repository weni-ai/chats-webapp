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
import { useConfig } from '@/store/modules/config';

import HeaderFilters from '../HeaderFilters.vue';

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

let savedGlobalMocks;

beforeAll(() => {
  savedGlobalMocks = { ...config.global.mocks };
  config.global.mocks = {};
});

afterAll(() => {
  config.global.mocks = savedGlobalMocks;
});

describe('Representatives/HeaderFilters.vue', () => {
  let wrapper;
  let pinia;

  const defaultModelValue = () => ({
    status: [],
    representatives: [],
    sectors: [],
    queues: [],
  });

  const mountComponent = (props = {}) => {
    pinia = createTestingPinia({ createSpy: vi.fn });
    setActivePinia(pinia);
    useConfig().$patch({
      project: { uuid: 'project-uuid-test', name: '', config: {} },
    });

    const modelValue = props.modelValue ?? defaultModelValue();

    return mount(HeaderFilters, {
      attachTo: document.body,
      global: {
        plugins: [pinia],
      },
      props: {
        modelValue,
        ...props,
      },
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();

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

    global.ResizeObserver =
      global.ResizeObserver ||
      class ResizeObserver {
        observe() {}

        unobserve() {}

        disconnect() {}
      };

    wrapper = mountComponent();
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
    pinia = undefined;
  });

  it('renders root, title row, heading and filters region', () => {
    expect(
      wrapper.find('[data-testid="representatives-header-filters"]').exists(),
    ).toBe(true);
    expect(
      wrapper
        .find('[data-testid="representatives-header-filters-title-row"]')
        .exists(),
    ).toBe(true);
    expect(
      wrapper
        .find('[data-testid="representatives-header-filters-title"]')
        .exists(),
    ).toBe(true);
    expect(
      wrapper
        .find('[data-testid="representatives-header-filters-filters"]')
        .exists(),
    ).toBe(true);
  });

  it('loads status, representatives and sectors on mount', async () => {
    await flushPromises();

    expect(
      PauseStatusService.getCustomBreakStatusTypeList,
    ).toHaveBeenCalledWith({
      projectUuid: 'project-uuid-test',
    });
    expect(ProjectService.getRepresentatives).toHaveBeenCalledWith({
      offset: 0,
      limit: 20,
    });
    expect(SectorService.list).toHaveBeenCalledWith({
      offset: 0,
      limit: 20,
    });
    expect(QueueService.listAllQueues).not.toHaveBeenCalled();
  });

  it('emits update:hasRepresentatives when representatives options exist', async () => {
    await flushPromises();

    expect(wrapper.emitted('update:hasRepresentatives')).toBeTruthy();
    expect(wrapper.emitted('update:hasRepresentatives').at(-1)).toEqual([true]);
  });

  it('keeps queues filter disabled while no sector is selected', async () => {
    await flushPromises();

    expect(
      wrapper
        .findComponent('[data-testid="representatives-header-filters-queues"]')
        .props('disabled'),
    ).toBe(true);
  });

  it('calls queue list when sectors change and enables queues filter', async () => {
    await flushPromises();

    const sectorsMs = wrapper.findComponent(
      '[data-testid="representatives-header-filters-sectors"]',
    );
    await sectorsMs.vm.$emit('update:modelValue', ['sector-uuid-1']);
    await flushPromises();

    expect(QueueService.listAllQueues).toHaveBeenCalledWith({
      limit: 20,
      offset: 0,
      filters: { sectors: ['sector-uuid-1'] },
    });
    expect(
      wrapper
        .findComponent('[data-testid="representatives-header-filters-queues"]')
        .props('disabled'),
    ).toBe(false);
  });

  it('when “all” sectors is selected, requests queues with empty sector filter', async () => {
    await flushPromises();

    const sectorsMs = wrapper.findComponent(
      '[data-testid="representatives-header-filters-sectors"]',
    );
    await sectorsMs.vm.$emit('update:modelValue', ['all']);
    await flushPromises();

    expect(QueueService.listAllQueues).toHaveBeenCalledWith({
      limit: 20,
      offset: 0,
      filters: { sectors: [] },
    });
  });

  it('debounces requestData after filter updates', async () => {
    vi.useFakeTimers();
    try {
      wrapper.unmount();
      wrapper = mountComponent();

      await flushPromises();

      const statusMs = wrapper.findComponent(
        '[data-testid="representatives-header-filters-status"]',
      );
      await statusMs.vm.$emit('update:modelValue', ['online']);
      await wrapper.vm.$nextTick();
      await vi.advanceTimersByTimeAsync(1100);

      expect(wrapper.emitted('requestData')).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });
});
