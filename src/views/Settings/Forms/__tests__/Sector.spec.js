import { expect, describe, it, vi, beforeEach } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { UnnnicCallAlert } from '@weni/unnnic-system';

import { createMemoryHistory, createRouter } from 'vue-router';
import { createTestingPinia } from '@pinia/testing';

import { useCompositionI18nInThisSpecFile } from '@/utils/test/compositionI18nVitest';

import FormSectorGeneral from '../General.vue';
import defaultProps from './mocks/sectorMock';

import Sector from '@/services/api/resources/settings/sector';
import Project from '@/services/api/resources/settings/project';
import Group from '@/services/api/resources/settings/group';

import i18n from '@/plugins/i18n';

const managerMock = {
  uuid: '2',
  sector: '1',
  role: 1,
  user: {
    first_name: 'Test',
    last_name: 'Test',
    email: 'tests@weni.ai',
    status: '',
    photo_url: 'http://photo.link',
  },
};

const projectMock = { uuid: '1', name: 'projectMock' };

vi.spyOn(Project, 'managers').mockResolvedValue({
  results: [managerMock],
});

vi.spyOn(Group, 'listProjects').mockResolvedValue({
  results: [projectMock],
});

vi.mock('@/services/api/resources/settings/group', () => ({
  default: {
    listProjects: vi.fn(),
  },
}));

vi.mock('@weni/unnnic-system', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    UnnnicCallAlert: vi.fn(),
  };
});

vi.mock('@/services/api/resources/settings/sector', () => ({
  default: {
    update: vi.fn(() => Promise.resolve()),
    removeManager: vi.fn(() => Promise.resolve()),
    addManager: vi.fn(() => Promise.resolve()),
    managers: vi.fn(() =>
      Promise.resolve({
        results: [{ ...managerMock, uuid: '1' }],
      }),
    ),
    getCountryHolidays: () =>
      Promise.resolve({ holidays: [], country_code: 'BR' }),
    getWorkingTimes: () =>
      Promise.resolve({ working_hours: { schedules: {} } }),
    setSectorWorkingDays: vi.fn(() => Promise.resolve()),
    createCountryHolidays: vi.fn(() => Promise.resolve()),
    createSectorHoliday: vi.fn(() => Promise.resolve()),
    getAllSectorHolidays: vi.fn(() => Promise.resolve([])),
  },
}));

const routes = [{ path: '/settings', name: 'settings' }];
const router = createRouter({
  history: createMemoryHistory(),
  routes,
});

router.push = vi.fn();

const validWorkdaySync = {
  workdayDaysTimeOptions: ['monday'],
  selectedWorkdayDays: { monday: true },
  selectedWorkdayDaysTime: {
    monday: [{ start: '08:00', end: '18:00', valid: true }],
  },
  selectedProject: null,
  selectedProjectHasSectorIntegration: false,
};

function sectorWorkingDayStub() {
  return {
    name: 'SectorWorkingDaySection',
    template: '<div />',
    emits: ['sync-workday-state', 'initial-load-complete'],
    mounted() {
      this.$emit('sync-workday-state', validWorkdaySync);
      this.$emit('initial-load-complete');
    },
    methods: {
      getWorkingDaysRequestBody: () => ({}),
      initCountryHolidays: () => Promise.resolve(),
      createCustomHolidays: () => Promise.resolve(),
      applyDefaultWorkdayActivate: () => {},
      applyDefaultWorkdayDeactivate: () => {},
      handleSelectAllCountryHolidays: () => {},
    },
  };
}

function createPinia(overrides = {}) {
  return createTestingPinia({
    initialState: {
      profile: { me: { email: 'tests@weni.ai' } },
      ...overrides,
    },
  });
}

function createWrapper(props = {}, { pinia: customPinia, stubs = {} } = {}) {
  return mount(FormSectorGeneral, {
    props: { modelValue: defaultProps.modelValue, ...props },
    global: {
      plugins: [router, customPinia || createPinia()],
      stubs: {
        UnnnicModalNext: true,
        SectorWorkingDaySection: sectorWorkingDayStub(),
        ...stubs,
      },
    },
  });
}

describe('FormSectorGeneral', () => {
  useCompositionI18nInThisSpecFile();

  let wrapper;

  beforeEach(() => {
    wrapper = createWrapper();
    vi.clearAllMocks();
  });

  it('emits changeIsValid from script setup', async () => {
    await flushPromises();
    expect(wrapper.emitted('changeIsValid')).toBeTruthy();
  });

  it('loads sector and project managers when isEditing is true', async () => {
    const sectorManagersSpy = vi.spyOn(Sector, 'managers');
    const projectManagersSpy = vi.spyOn(Project, 'managers');

    const testWrapper = createWrapper({
      isEditing: true,
      modelValue: {
        ...defaultProps.modelValue,
        uuid: '1',
        name: 'Sec',
        rooms_limit: '2',
        managers: [],
      },
    });

    await flushPromises();

    expect(sectorManagersSpy).toHaveBeenCalled();
    expect(projectManagersSpy).toHaveBeenCalled();
    testWrapper.unmount();
  });

  it('emits submit on form submit', async () => {
    await wrapper.find('form').trigger('submit.prevent');
    expect(wrapper.emitted().submit).toBeTruthy();
  });

  it('renders TagGroup entries for managers on the model', async () => {
    await wrapper.setProps({
      modelValue: {
        ...defaultProps.modelValue,
        managers: [
          {
            uuid: 'm1',
            user: {
              email: 'maria@weni.ai',
              first_name: 'Maria',
              last_name: 'Silva',
              photo_url: null,
            },
          },
          {
            uuid: 'm2',
            user: {
              email: 'joao@weni.ai',
              first_name: 'João',
              last_name: 'Souza',
              photo_url: null,
            },
          },
        ],
      },
    });

    const tags = wrapper.findAll('[data-testid^="tag__"]');
    expect(tags.length).toBe(2);
  });

  it('calls Sector.removeManager when a tag is closed in edit mode', async () => {
    const removeSpy = vi.spyOn(Sector, 'removeManager');
    await wrapper.setProps({
      isEditing: true,
      modelValue: {
        ...defaultProps.modelValue,
        uuid: '1',
        name: 'Sec',
        rooms_limit: '2',
        managers: [managerMock],
      },
    });
    await flushPromises();

    const tagGroup = wrapper.findComponent({ name: 'TagGroup' });
    await tagGroup.vm.$emit('close', { uuid: '2', name: 'x' });

    expect(removeSpy).toHaveBeenCalledWith('2');
  });

  it('emits default sector values when enabling the default option', async () => {
    const testWrapper = createWrapper({ isEditing: false });
    await flushPromises();
    const fill = testWrapper.findComponent({ name: 'FillDefaultOption' });
    await fill.vm.$emit('update:modelValue', true);
    await flushPromises();

    const emitted = testWrapper.emitted('update:modelValue');
    expect(emitted).toBeTruthy();
    const last = emitted[emitted.length - 1][0];
    expect(last.name).toBe(i18n.global.t('config_chats.default_sector.name'));
    expect(last.rooms_limit).toBe('4');
    expect(Array.isArray(last.managers)).toBe(true);
    testWrapper.unmount();
  });

  it('clears sector fields when disabling the default option', async () => {
    const testWrapper = createWrapper({ isEditing: false });
    await flushPromises();
    const fill = testWrapper.findComponent({ name: 'FillDefaultOption' });
    await fill.vm.$emit('update:modelValue', true);
    await flushPromises();
    await fill.vm.$emit('update:modelValue', false);
    await flushPromises();

    const emitted = testWrapper.emitted('update:modelValue');
    const last = emitted[emitted.length - 1][0];
    expect(last.name).toBe('');
    expect(last.rooms_limit).toBe('');
    expect(last.managers).toEqual([]);
    testWrapper.unmount();
  });

  it('calls saveSector (exposed) and shows success', async () => {
    const w = createWrapper({
      isEditing: true,
      modelValue: {
        ...defaultProps.modelValue,
        uuid: '1',
        name: 'Test 1',
        rooms_limit: '2',
        managers: [
          {
            uuid: '1',
            sector: '1',
            role: 1,
            user: {
              first_name: 'Test',
              last_name: 'Test',
              email: 'test@test.com',
              status: '',
            },
          },
        ],
      },
    });
    await flushPromises();

    await w.vm.saveSector();
    await flushPromises();

    expect(Sector.update).toHaveBeenCalled();
    expect(UnnnicCallAlert).toHaveBeenCalledWith({
      props: {
        text: i18n.global.t('sector_update_success'),
        type: 'success',
      },
      seconds: 5,
    });
    expect(router.push).toHaveBeenCalledWith('/settings');
    w.unmount();
  });

  it('handles Sector.update errors in saveSector', async () => {
    const w = createWrapper({
      isEditing: true,
      modelValue: {
        ...defaultProps.modelValue,
        uuid: '1',
        name: 'Test 1',
        rooms_limit: '2',
        managers: [
          {
            uuid: '1',
            sector: '1',
            role: 1,
            user: {
              first_name: 'Test',
              last_name: 'Test',
              email: 'test@test.com',
              status: '',
            },
          },
        ],
      },
    });
    await flushPromises();

    const updateMock = vi
      .spyOn(Sector, 'update')
      .mockRejectedValueOnce(new Error('fail'));

    await w.vm.saveSector();
    await flushPromises();

    expect(updateMock).toHaveBeenCalled();
    updateMock.mockRestore();
    w.unmount();
  });

  it('calls Group.listProjects when groups mode is on (working day section mounted)', async () => {
    const pinia = createPinia({
      config: {
        project: { uuid: 'p1', config: { its_principal: true }, org: 'org-1' },
      },
    });

    const w = mount(FormSectorGeneral, {
      props: {
        isEditing: true,
        modelValue: {
          ...defaultProps.modelValue,
          uuid: '1',
          name: 'G',
          rooms_limit: '1',
          managers: [],
          config: { secondary_project: '' },
        },
      },
      global: {
        plugins: [router, pinia],
        stubs: {
          UnnnicModalNext: true,
        },
      },
    });

    await flushPromises();
    await flushPromises();

    expect(Group.listProjects).toHaveBeenCalled();
    w.unmount();
  });
});
