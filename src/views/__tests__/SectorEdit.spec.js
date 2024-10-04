import { mount, flushPromises } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import { createRouter, createWebHistory } from 'vue-router';
import routes from '@/router/routes/settings';
import { createTestingPinia } from '@pinia/testing';
import SectorEdit from '@/views/Settings/Sectors/Edit/index.vue';

const mockSector1 = {
  id: 1,
  uuid: '123',
  name: 'Sector 1',
  agents: 10,
  contacts: 50,
};

vi.mock('@/services/api/resources/settings/sector', () => ({
  default: {
    tags: () => Promise.resolve({ results: [] }),
    update: () => Promise.resolve(),
    addTag: vi.fn(),
    removeTag: vi.fn(),
    managers: () => Promise.resolve({ results: [] }),
    find: () => Promise.resolve(mockSector1),
  },
}));

vi.mock('@/services/api/resources/settings/project', () => ({
  default: {
    managers: () => Promise.resolve({ results: [] }),
  },
}));

const store = createTestingPinia({
  initialState: {
    config: {
      project: { name: 'Project 1' },
    },
    settings: {
      sectors: [mockSector1],
      currentSector: mockSector1,
      isLoadingSectors: false,
    },
  },
});

const router = createRouter({
  history: createWebHistory(),
  routes,
});

const createWrapper = (props = {}) => {
  return mount(SectorEdit, {
    props,
    global: {
      plugins: [router, store],
      stubs: {
        UnnnicTab: true,
        FormSectorExtraOptions: true,
        ListSectorQueues: true,
      },
      mocks: {
        $router: {
          replace: vi.fn(),
        },
      },
    },
  });
};

describe('EditSector.vue', () => {
  let wrapper;

  beforeEach(async () => {
    router.push('/settings/sectors/1?tab=general');
    wrapper = createWrapper();
    await flushPromises();
  });

  it('should render SectorEditHeader with the current sector name', async () => {
    const viewHeader = wrapper.findComponent(
      '[data-testid=sector-edit-view-header]',
    );

    expect(viewHeader.props('sectorName')).toBe('Sector 1');
  });

  it('should render UnnnicTab with the correct tabs', async () => {
    const unnnicTab = wrapper.findComponent(
      '[data-testid=sector-edit-view-tab-list]',
    );
    expect(unnnicTab.props('tabs')).toEqual(wrapper.vm.tabIds);
  });

  it('should update the active tab and router query on tab change', async () => {
    const unnnicTab = wrapper.findComponent(
      '[data-testid=sector-edit-view-tab-list]',
    );
    const spyRouterReplace = vi.spyOn(wrapper.vm.$router, 'replace');
    await unnnicTab.vm.$emit('change', 'extra_options');

    expect(wrapper.vm.activeTab.id).toBe('extra_options');
    expect(spyRouterReplace).toHaveBeenCalledWith({
      query: { tab: 'extra_options' },
    });
  });

  it('should render queues list if active tab equals queues', async () => {
    await wrapper.setData({ sector: mockSector1 });

    const unnnicTab = wrapper.findComponent(
      '[data-testid=sector-edit-view-tab-list]',
    );

    await unnnicTab.vm.$emit('change', 'queues');

    await wrapper.vm.$nextTick();

    const queuesList = wrapper.findComponent(
      '[data-testid="sector-queues-list"]',
    );

    expect(queuesList.exists()).toBe(true);
  });

  it('should render general form if active tab equals general', async () => {
    await wrapper.setData({ sector: mockSector1 });

    const unnnicTab = wrapper.findComponent(
      '[data-testid=sector-edit-view-tab-list]',
    );

    await unnnicTab.vm.$emit('change', 'general');

    await flushPromises();

    const queuesList = wrapper.findComponent('[data-testid="general-form"]');

    expect(queuesList.exists()).toBe(true);
  });

  it('should render extra options form if active tab equals extra_options', async () => {
    await wrapper.setData({ sector: mockSector1 });
    const unnnicTab = wrapper.findComponent(
      '[data-testid=sector-edit-view-tab-list]',
    );

    await unnnicTab.vm.$emit('change', 'extra_options');

    const extraOptionsForm = wrapper.find('[data-testid="extra-options-form"]');
    expect(extraOptionsForm.exists()).toBe(true);
  });

  it('Should match the snapshot', () => {
    expect(wrapper.html()).toMatchSnapshot();
  });
});
