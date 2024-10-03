import { expect, describe, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';

import { createMemoryHistory, createRouter } from 'vue-router';
import { createTestingPinia } from '@pinia/testing';
import unnnic from '@weni/unnnic-system';

import FormSectorGeneral from '../General.vue';
import defaultProps from './mocks/sectorMock';

import Sector from '@/services/api/resources/settings/sector';
import Project from '@/services/api/resources/settings/project';

const pinia = createTestingPinia({
  initialState: {
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

vi.spyOn(Project, 'managers').mockResolvedValue({
  results: [managerMock],
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
      modelValue: {
        name: 'Sector Name',
        managers: [],
        workingDay: { start: '12:00', end: '11:00' },
        maxSimultaneousChatsByAgent: '2',
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
    const saveButton = wrapper.findComponent('[data-testid="save-button"]');
    expect(saveButton.attributes('disabled')).toBeDefined();
  });

  it('should call saveSector method on save button click', async () => {
    await wrapper.setProps({
      isEditing: true,
      modelValue: {
        uuid: '1',
        name: 'Test 1',
        workingDay: {
          start: '08:00',
          end: '18:00',
        },
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

    const saveSectorSpy = vi.spyOn(wrapper.vm, 'saveSector');
    const unnnicAlertSpy = vi.spyOn(unnnic, 'unnnicCallAlert');

    await wrapper.findComponent('[data-testid="save-button"]').trigger('click');

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
        workingDay: {
          start: '08:00',
          end: '18:00',
        },
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

    const sectorUpdateMock = vi
      .spyOn(Sector, 'update')
      .mockRejectedValue(new Error());

    await wrapper.findComponent('[data-testid="save-button"]').trigger('click');

    expect(sectorUpdateMock).toHaveBeenCalled();

    sectorUpdateMock.mockClear();
  });

  it('should hidden delete sector modal on cancel click', async () => {
    await wrapper.setProps({
      isEditing: true,
      modelValue: {
        uuid: '1',
        name: 'Sector Name',
        managers: [],
        workingDay: { start: '12:00', end: '11:00' },
        maxSimultaneousChatsByAgent: '2',
      },
    });
    wrapper.vm.openModalDelete = true;
    await wrapper.vm.$nextTick();

    const deleteModal = wrapper.findComponent(
      '[data-testid="modal-delete-sector"]',
    );

    await deleteModal.trigger('click-action-secondary');
    expect(wrapper.vm.openModalDelete).eq(false);
  });

  it('should delete sector modal and trigger deleteSector method', async () => {
    await wrapper.setProps({
      isEditing: true,
      modelValue: {
        uuid: '1',
        name: 'Sector Name',
        managers: [],
        workingDay: { start: '12:00', end: '11:00' },
        maxSimultaneousChatsByAgent: '2',
      },
    });

    const deleteSectorSpy = vi.spyOn(wrapper.vm, 'deleteSector');

    const deleteSecterButton = wrapper.findComponent(
      '[data-testid="open-modal-delete-button"]',
    );

    await deleteSecterButton.trigger('click');

    expect(wrapper.vm.openModalDelete).eq(true);

    await wrapper.vm.$nextTick();

    const deleteModal = wrapper.findComponent(
      '[data-testid="modal-delete-sector"]',
    );

    await deleteModal.trigger('click-action-primary');

    expect(deleteSectorSpy).toHaveBeenCalledWith(wrapper.vm.sector.uuid);
    expect(wrapper.vm.openModalDelete).eq(false);
  });

  it('should handle erros in deleteSector method', async () => {
    await wrapper.setProps({
      isEditing: true,
      modelValue: {
        uuid: '1',
        name: 'Sector Name',
        managers: [],
        workingDay: { start: '12:00', end: '11:00' },
        maxSimultaneousChatsByAgent: '2',
      },
    });

    const deleteSectorSpy = vi.spyOn(wrapper.vm, 'deleteSector');
    const unnnicAlertSpy = vi.spyOn(unnnic, 'unnnicCallAlert');

    const deleteSectorButton = wrapper.findComponent(
      '[data-testid="open-modal-delete-button"]',
    );

    await deleteSectorButton.trigger('click');

    expect(wrapper.vm.openModalDelete).eq(true);

    await wrapper.vm.$nextTick();

    const deleteModal = wrapper.findComponent(
      '[data-testid="modal-delete-sector"]',
    );

    const deleteSectorActionMock = vi
      .spyOn(wrapper.vm, 'actionDeleteSector')
      .mockRejectedValue();

    await deleteModal.trigger('click-action-primary');

    expect(deleteSectorSpy).toHaveBeenCalledWith(wrapper.vm.sector.uuid);
    expect(deleteSectorActionMock).toHaveBeenCalled();

    expect(unnnicAlertSpy).toHaveBeenCalledWith({
      props: {
        text: wrapper.vm.$t('sector_delete_error'),
        type: 'error',
      },
      seconds: 5,
    });

    expect(wrapper.vm.openModalDelete).eq(false);

    deleteSectorActionMock.mockClear();
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

    wrapper.vm.selectManager([{ value: '2' }]);

    expect(addSectorManagerSpy).toHaveBeenCalledWith(managerMock);
    expect(addManagerSpy).toHaveBeenCalledWith(managerMock);
  });
});
