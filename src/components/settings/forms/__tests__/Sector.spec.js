import { expect, describe, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';

import { createMemoryHistory, createRouter } from 'vue-router';
import { createTestingPinia } from '@pinia/testing';
import unnnic from '@weni/unnnic-system';

import FormSectorGeneral from '../General.vue';
import defaultProps from './mocks/sectorMock';

import Sector from '@/services/api/resources/settings/sector';
import Project from '@/services/api/resources/settings/project';
import Group from '@/services/api/resources/settings/group';

const pinia = createTestingPinia({
  initialState: {
    profile: { me: { email: 'tests@weni.ai' } },
    actionDeleteSector: vi.fn(),
  },
});

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

function createWrapper(props) {
  const wrapper = mount(FormSectorGeneral, {
    props: { modelValue: defaultProps.modelValue, ...props },
    global: {
      plugins: [router, pinia],
      stubs: {
        UnnnicModalNext: true,
      },
    },
  });

  return wrapper;
}

describe('FormSectorGeneral', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = createWrapper();
    vi.clearAllMocks();
  });

  it('should emit update:modelValue on change sector value', async () => {
    wrapper.vm.sector = {};
    expect(wrapper.emitted()['update:modelValue']).toBeTruthy();
  });

  it('should trigger getSectorManagers on mounted if isEditing is true and listProjectManagers', async () => {
    const getSectorManagersSpy = vi.spyOn(
      FormSectorGeneral.methods,
      'getSectorManagers',
    );
    const listProjectManagersSpy = vi.spyOn(
      FormSectorGeneral.methods,
      'listProjectManagers',
    );

    const wrapper = createWrapper({ isEditing: true });

    await flushPromises();

    expect(getSectorManagersSpy).toHaveBeenCalled();
    expect(listProjectManagersSpy).toHaveBeenCalled();

    await flushPromises();

    wrapper.vm.sector.managers.forEach((manager) => {
      expect(manager.removed).toBe(false);
    });
  });

  it('should not render sector name input isEditing is true', async () => {
    await wrapper.setProps({ isEditing: true });
    const nameInputSection = wrapper.find(
      '[data-testid="sector-name-section"]',
    );

    expect(nameInputSection.exists()).toBe(false);
  });

  it('should emit submit event on form submit', async () => {
    await wrapper.find('form').trigger('submit.prevent');
    expect(wrapper.emitted().submit).toBeTruthy();
  });

  it('should display error message when working hours are invalid', async () => {
    await wrapper.setProps({
      isEditing: true,
      modelValue: {
        name: 'Sector Name',
        managers: [],
        maxSimultaneousChatsByAgent: '2',
      },
    });
    await wrapper.setData({
      selectedWorkdayDays: {
        monday: true,
      },
      selectedWorkdayDaysTime: {
        monday: [
          {
            start: '08:00',
            end: '07:00',
            valid: false,
          },
        ],
      },
    });
    await wrapper.vm.$nextTick();
    const errorMessage = wrapper.find('.error-message');
    expect(errorMessage.exists()).toBe(true);
    expect(errorMessage.text()).toBe(
      wrapper.vm.$t('config_chats.edit_sector.invalid_hours'),
    );
  });

  it('should have a managers list rendered', async () => {
    await wrapper.setProps({
      modelValue: {
        ...defaultProps.modelValue,
        managers: [
          {
            user: {
              email: 'maria.silva@weni.ai',
              first_name: 'Maria',
              last_name: 'Silva',
              photo_url: null,
            },
          },
          {
            user: {
              email: 'joao.souza@weni.ai',
              first_name: 'João',
              last_name: 'Souza',
              photo_url: null,
            },
          },
        ],
      },
    });

    const selectedMemberCards = wrapper.findAllComponents({
      name: 'selected-member',
    });
    expect(selectedMemberCards.length).toBe(2);
  });

  it('should remove managers from the project on click remove manager button', async () => {
    await wrapper.setProps({
      modelValue: {
        ...defaultProps.modelValue,
        managers: [managerMock],
      },
    });

    const removeManagerSpy = vi.spyOn(wrapper.vm, 'removeManager');

    const selectedManager = wrapper.findComponent({
      name: 'selected-member',
    });
    const removeSelectedManagerButton = selectedManager.find(
      '[data-testid="remove-member-button"]',
    );
    await removeSelectedManagerButton.trigger('click');
    expect(removeManagerSpy).toHaveBeenCalledWith('2');
  });

  it('should disable the save button if form is invalid', async () => {
    await wrapper.setProps({ isEditing: true });
    const saveButton = wrapper.findComponent(
      '[data-testid="general-save-button"]',
    );
    expect(saveButton.attributes('disabled')).toBeDefined();
  });

  it('should call saveSector method on save button click', async () => {
    await wrapper.setProps({
      isEditing: true,
      modelValue: {
        uuid: '1',
        name: 'Test 1',
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
        maxSimultaneousChatsByAgent: '2',
      },
    });

    await wrapper.setData({
      selectedWorkdayDays: {
        monday: true,
      },
      selectedWorkdayDaysTime: {
        monday: [
          {
            start: '08:00',
            end: '18:00',
            valid: true,
          },
        ],
      },
      isInitializing: false,
      initialFormState: false,
    });

    await wrapper.vm.$nextTick();
    await flushPromises();

    const saveSectorSpy = vi.spyOn(wrapper.vm, 'saveSector');
    const unnnicAlertSpy = vi.spyOn(unnnic, 'unnnicCallAlert');

    await wrapper
      .findComponent('[data-testid="general-save-button"]')
      .trigger('click');

    await flushPromises();

    expect(saveSectorSpy).toHaveBeenCalled();

    expect(unnnicAlertSpy).toHaveBeenCalledWith({
      props: {
        text: wrapper.vm.$t('sector_update_success'),
        type: 'success',
      },
      seconds: 5,
    });

    expect(router.push).toHaveBeenCalledWith('/settings');
    unnnicAlertSpy.mockClear();
  });

  it('should handle errors in saveSector method', async () => {
    await wrapper.setProps({
      isEditing: true,
      modelValue: {
        uuid: '1',
        name: 'Test 1',
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
        maxSimultaneousChatsByAgent: '2',
      },
    });

    await wrapper.setData({
      selectedWorkdayDays: {
        monday: true,
      },
      selectedWorkdayDaysTime: {
        monday: [
          {
            start: '08:00',
            end: '18:00',
            valid: true,
          },
        ],
      },
      isInitializing: false,
      initialFormState: false,
    });

    await wrapper.vm.$nextTick();
    await flushPromises();

    const sectorUpdateMock = vi
      .spyOn(Sector, 'update')
      .mockRejectedValue(new Error());

    await wrapper
      .findComponent('[data-testid="general-save-button"]')
      .trigger('click');

    await flushPromises();

    expect(sectorUpdateMock).toHaveBeenCalled();

    sectorUpdateMock.mockClear();
  });

  it('should format managers to object format with value and label', async () => {
    wrapper.vm.managersNames.forEach((item) => {
      expect(item).toHaveProperty('label');
      expect(item).toHaveProperty('value');
    });
  });

  it('should add a manager in the sector', async () => {
    const wrapper = createWrapper({ isEditing: true });
    await flushPromises();

    const addSectorManagerSpy = vi.spyOn(wrapper.vm, 'addSectorManager');
    const addManagerSpy = vi.spyOn(wrapper.vm, 'addManager');

    wrapper.vm.selectManager([{ uuid: '2' }]);

    expect(addSectorManagerSpy).toHaveBeenCalledWith(managerMock);
    expect(addManagerSpy).toHaveBeenCalledWith(managerMock);
  });

  it('should router push to settings on cancel', async () => {
    const pushSpy = vi.spyOn(router, 'push');
    await wrapper.setProps({ isEditing: true });
    await wrapper.find('[data-testid="cancel-button"]').trigger('click');
    expect(pushSpy).toHaveBeenCalledWith('/settings');
  });

  it('should emit update model value with default sector config', async () => {
    const testWrapper = createWrapper({ isEditing: false });
    const enableDefaultConfigRadio = testWrapper.findComponent(
      '[data-testid="enable-default-sector-config"]',
    );
    await enableDefaultConfigRadio.vm.$emit('update:model-value', 1);
    await testWrapper.vm.$nextTick();

    const emitted = testWrapper.emitted('update:modelValue');
    expect(emitted).toBeTruthy();
    const lastEmit = emitted[emitted.length - 1][0];
    expect(lastEmit).toHaveProperty(
      'name',
      testWrapper.vm.$t('config_chats.default_sector.name'),
    );
    expect(lastEmit).toHaveProperty('maxSimultaneousChatsByAgent', '4');
    expect(lastEmit.managers).toBeInstanceOf(Array);
  });

  it('should update model value with blank sector config', async () => {
    const testWrapper = createWrapper({ isEditing: false });
    await testWrapper.setData({ useDefaultSector: 1 });
    const disableDefaultConfigRadio = testWrapper.findComponent(
      '[data-testid="disable-default-sector-config"]',
    );
    await disableDefaultConfigRadio.vm.$emit('update:model-value', 0);
    await testWrapper.vm.$nextTick();

    const emitted = testWrapper.emitted('update:modelValue');
    expect(emitted).toBeTruthy();
    const lastEmit = emitted[emitted.length - 1][0];
    expect(lastEmit).toHaveProperty('name', '');
    expect(lastEmit).toHaveProperty('maxSimultaneousChatsByAgent', '');
    expect(lastEmit.managers).toEqual([]);
  });

  it('call service to removeManager if isEditing = true', async () => {
    const removeManagerSpy = vi.spyOn(Sector, 'removeManager');
    await wrapper.setProps({ isEditing: true });
    await wrapper.vm.removeManager('1');
    expect(removeManagerSpy).toHaveBeenCalledWith('1');
  });

  it('should return the list of project names', async () => {
    await wrapper.setData({
      projects: [
        { uuid: '1', name: 'Project One' },
        { uuid: '2', name: 'Project Two' },
      ],
    });

    const result = wrapper.vm.projectsNames;

    expect(result).toEqual([
      { value: '', label: wrapper.vm.$t('sector.link.project_placeholder') },
      { value: '1', label: 'Project One' },
      { value: '2', label: 'Project Two' },
    ]);
  });

  it('should return the list of secondary projects', async () => {
    await wrapper.vm.listSecondaryProjects();
    expect(wrapper.vm.projects).toEqual([projectMock]);
  });

  it('should set selected project and clear secondary projects', async () => {
    await wrapper.vm.listSecondaryProjects();

    wrapper.vm.selectProject([wrapper.vm.projectsNames[1]]);

    await wrapper.vm.$nextTick();

    expect(wrapper.vm.sector.config.secondary_project).toBe(
      wrapper.vm.projectsNames[1].value,
    );
  });

  it('should call required methods when enableGroupsMode is true and isEditing is true', async () => {
    const listSecondaryProjects = vi.spyOn(
      FormSectorGeneral.methods,
      'listSecondaryProjects',
    );

    mount(FormSectorGeneral, {
      global: {
        plugins: [
          router,
          createTestingPinia({
            initialState: {
              config: { project: { config: { its_principal: true } } },
            },
          }),
        ],
      },
      props: {
        modelValue: { ...defaultProps.modelValue },
        isEditing: true,
      },
    });

    await flushPromises();

    expect(listSecondaryProjects).toHaveBeenCalled();
  });
});
