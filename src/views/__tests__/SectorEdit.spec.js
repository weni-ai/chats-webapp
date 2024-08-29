import { mount, flushPromises } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import { createRouter, createWebHistory } from 'vue-router';
import routes from '@/router/routes/settings';
import { createTestingPinia } from '@pinia/testing';
import SectorEdit from '@/views/Settings/Sectors/Edit/index.vue';
import i18n from '@/plugins/i18n.js';
import UnnnicSystemPlugin from '@/plugins/UnnnicSystem';

const mockSector1 = {
  id: 1,
  uuid: '123',
  name: 'Sector 1',
  agents: 10,
  contacts: 50,
};

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

const createWrapper = (props) => {
  return mount(SectorEdit, {
    props,
    global: {
      plugins: [router, store, UnnnicSystemPlugin, i18n],
      stubs: {
        UnnnicTab: true,
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
    wrapper = createWrapper({});
    await flushPromises();
  });

  it('should render SectorEditHeader with the current sector name', async () => {
    const viewHeader = wrapper.findComponent(
      '[data-testid=sector-edit-view-header]',
    );

    expect(viewHeader.props('sectorName')).toBe('Sector 1');
  });

  it('should render UnnnicTab with the correct tabs', () => {
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

  it('Should match the snapshot', () => {
    expect(wrapper.element).toMatchSnapshot();
  });
});
