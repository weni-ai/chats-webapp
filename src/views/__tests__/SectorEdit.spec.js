import { mount, flushPromises } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRouter, createMemoryHistory } from 'vue-router';
import { createTestingPinia } from '@pinia/testing';

import SectorEdit from '@/views/Settings/Sectors/Edit/index.vue';
import { useSettings } from '@/store/modules/settings';
import { useCompositionI18nInThisSpecFile } from '@/utils/test/compositionI18nVitest';

const mockSector1 = {
  id: 1,
  uuid: '123',
  name: 'Sector 1',
  agents: 10,
  contacts: 50,
  work_start: '00:00',
  work_end: '12:00',
  rooms_limit: 3,
};

vi.mock('@/services/api/resources/settings/sector', () => ({
  default: {
    tags: () => Promise.resolve({ results: [] }),
    update: () => Promise.resolve(),
    addTag: vi.fn(),
    removeTag: vi.fn(),
    managers: () => Promise.resolve({ results: [] }),
    find: vi.fn(() => Promise.resolve(mockSector1)),
    getCountryHolidays: () =>
      Promise.resolve({ holidays: [], country_code: 'BR' }),
    getWorkingTimes: () =>
      Promise.resolve({ working_hours: { schedules: {} } }),
  },
}));

vi.mock('@/services/api/resources/settings/project', () => ({
  default: {
    managers: () => Promise.resolve({ results: [] }),
  },
}));

function createRouterInstance() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/settings/sectors/:uuid',
        name: 'sectors.edit',
        component: SectorEdit,
      },
    ],
  });
}

describe('EditSector.vue', () => {
  useCompositionI18nInThisSpecFile();

  let router;
  let pinia;

  beforeEach(() => {
    pinia = createTestingPinia({
      stubActions: false,
      initialState: {
        config: {
          project: { name: 'Project 1', uuid: 'p1', config: {} },
        },
        settings: {
          sectors: [mockSector1],
          currentSector: null,
          isLoadingSectors: false,
        },
      },
    });
    router = createRouterInstance();
  });

  async function mountWithQuery(query) {
    await router.push({
      name: 'sectors.edit',
      params: { uuid: '123' },
      query,
    });

    const wrapper = mount(SectorEdit, {
      global: {
        plugins: [router, pinia],
        stubs: {
          FormSectorGeneral: {
            template: '<div data-testid="general-form" />',
            props: ['modelValue'],
          },
          FormSectorExtraOptions: {
            template: '<div data-testid="extra-options-form" />',
            props: ['modelValue'],
          },
          ListSectorQueues: {
            template: '<div data-testid="sector-queues-list" />',
            props: ['sector'],
          },
          ListSectorMessages: {
            template: '<div data-testid="sector-quick-messages-list" />',
            props: ['sector'],
          },
        },
      },
    });

    await flushPromises();
    return wrapper;
  }

  it('renders the current sector name after load', async () => {
    const wrapper = await mountWithQuery({ tab: 'general' });
    expect(wrapper.text()).toContain('Sector 1');
  });

  it('shows the general form when tab=general', async () => {
    const wrapper = await mountWithQuery({ tab: 'general' });
    expect(wrapper.find('[data-testid="general-form"]').exists()).toBe(true);
  });

  it('shows the queues list when tab=queues', async () => {
    const wrapper = await mountWithQuery({ tab: 'queues' });
    expect(wrapper.find('[data-testid="sector-queues-list"]').exists()).toBe(
      true,
    );
  });

  it('shows extra options when tab=extra_options', async () => {
    const wrapper = await mountWithQuery({ tab: 'extra_options' });
    expect(wrapper.find('[data-testid="extra-options-form"]').exists()).toBe(
      true,
    );
  });

  it('shows quick messages when tab=quick_messages', async () => {
    const wrapper = await mountWithQuery({ tab: 'quick_messages' });
    expect(
      wrapper.find('[data-testid="sector-quick-messages-list"]').exists(),
    ).toBe(true);
  });

  it('reflects store currentSector name when the store updates', async () => {
    const wrapper = await mountWithQuery({ tab: 'general' });
    const settings = useSettings();
    settings.currentSector = { ...mockSector1, name: 'Renamed' };
    await flushPromises();
    expect(wrapper.text()).toContain('Renamed');
  });

  it('clears currentSector when the view is unmounted', async () => {
    const wrapper = await mountWithQuery({ tab: 'general' });
    const settings = useSettings();
    expect(settings.currentSector).not.toBeNull();

    wrapper.unmount();
    await flushPromises();

    expect(settings.currentSector).toBeNull();
  });

  it('matches snapshot', async () => {
    const wrapper = await mountWithQuery({ tab: 'general' });
    expect(wrapper.html()).toMatchSnapshot();
  });
});
