import { mount, flushPromises } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import GeneralForm from '../General.vue';
import Project from '@/services/api/resources/settings/project';
import Group from '@/services/api/resources/settings/group';
import i18n from '@/plugins/i18n';

import { useCompositionI18nInThisSpecFile } from '@/utils/test/compositionI18nVitest';

const managerMock = {
  uuid: 'manager-uuid-1',
  user: {
    first_name: 'Maria',
    last_name: 'Silva',
    email: 'maria.silva@weni.ai',
    photo_url: 'http://photo.link/image.jpg?token=abc',
  },
};

const managerMockWithoutName = {
  uuid: 'manager-uuid-2',
  user: {
    first_name: '',
    last_name: '',
    email: 'joao@weni.ai',
    photo_url: null,
  },
};

vi.mock('@/services/api/resources/settings/project', () => ({
  default: {
    managers: vi.fn(),
  },
}));

vi.mock('@/services/api/resources/settings/group', () => ({
  default: {
    listAuthorization: vi.fn(),
  },
}));

const emptyGroup = () => ({
  name: '',
  managers: [],
  maxSimultaneousChatsByAgent: '',
});

const createWrapper = (props = {}) => {
  return mount(GeneralForm, {
    props: {
      modelValue: emptyGroup(),
      ...props,
    },
  });
};

describe('ProjectGroupGeneralForm', () => {
  useCompositionI18nInThisSpecFile();

  let wrapper;

  beforeEach(() => {
    vi.clearAllMocks();
    Project.managers = vi.fn().mockResolvedValue({
      results: [managerMock, managerMockWithoutName],
      next: null,
    });
    Group.listAuthorization = vi.fn().mockResolvedValue({
      results: [managerMock],
    });
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  describe('Rendering', () => {
    it('should render create title and name input when not editing', async () => {
      wrapper = createWrapper();
      await flushPromises();

      expect(wrapper.find('.groups-general-form__title').text()).toBe(
        i18n.global.t('config_chats.groups.general_form.title'),
      );
      expect(wrapper.findComponent({ name: 'UnnnicInput' }).exists()).toBe(
        true,
      );
      expect(wrapper.classes()).not.toContain('is-editing');
    });

    it('should render editing title and hide name input when isEditing', async () => {
      wrapper = createWrapper({ isEditing: true });
      await flushPromises();

      expect(wrapper.find('.groups-general-form__title').text()).toBe(
        i18n.global.t('config_chats.groups.general_form.service_managers'),
      );
      const nameLabel = i18n.global.t(
        'config_chats.groups.general_form.field.name.label',
      );
      const inputs = wrapper.findAllComponents({ name: 'UnnnicInput' });
      expect(inputs.some((input) => input.props('label') === nameLabel)).toBe(
        false,
      );
      expect(wrapper.classes()).toContain('is-editing');
    });

    it('should render SelectedMember cards for group managers', async () => {
      wrapper = createWrapper({
        modelValue: {
          ...emptyGroup(),
          managers: [managerMock],
        },
      });
      await flushPromises();

      const members = wrapper.findAllComponents({ name: 'SelectedMember' });
      expect(members.length).toBe(1);
      expect(members.at(0).props('name')).toBe('Maria Silva');
      expect(members.at(0).props('email')).toBe('maria.silva@weni.ai');
      expect(members.at(0).props('roleName')).toBe(i18n.global.t('manager'));
    });

    it('should render manager with user_name and user_email fallbacks', async () => {
      wrapper = createWrapper({
        modelValue: {
          ...emptyGroup(),
          managers: [
            {
              uuid: 'manager-3',
              user_name: 'Fallback Name',
              user_email: 'fallback@weni.ai',
            },
          ],
        },
      });
      await flushPromises();

      const member = wrapper.findComponent({ name: 'SelectedMember' });
      expect(member.props('name')).toBe('Fallback Name');
      expect(member.props('email')).toBe('fallback@weni.ai');
    });
  });

  describe('Mounted - listProjectManagers', () => {
    it('should load project managers on mount', async () => {
      wrapper = createWrapper();
      await flushPromises();

      expect(Project.managers).toHaveBeenCalledWith(0, 50);
      expect(wrapper.vm.managers.length).toBe(2);
    });

    it('should paginate managers while next is truthy', async () => {
      Project.managers = vi
        .fn()
        .mockResolvedValueOnce({
          results: [managerMock],
          next: 'next-page',
        })
        .mockResolvedValueOnce({
          results: [managerMockWithoutName],
          next: null,
        });

      wrapper = createWrapper();
      await flushPromises();

      expect(Project.managers).toHaveBeenCalledTimes(2);
      expect(wrapper.vm.managers.length).toBe(2);
    });
  });

  describe('Computed', () => {
    beforeEach(async () => {
      wrapper = createWrapper();
      await flushPromises();
    });

    it('should map managersNames with full name or email fallback', () => {
      expect(wrapper.vm.managersNames).toEqual([
        { value: 'manager-uuid-1', label: 'Maria Silva' },
        { value: 'manager-uuid-2', label: 'joao@weni.ai' },
      ]);
    });

    it('should be invalid when name, managers or limit are missing', async () => {
      expect(wrapper.vm.valid).toBe(false);

      await wrapper.setProps({
        modelValue: {
          name: 'Group',
          managers: [managerMock],
          maxSimultaneousChatsByAgent: '0',
        },
      });
      expect(wrapper.vm.valid).toBe(false);

      await wrapper.setProps({
        modelValue: {
          name: 'Group',
          managers: [managerMock],
          maxSimultaneousChatsByAgent: '4',
        },
      });
      expect(wrapper.vm.valid).toBe(true);
    });

    it('should emit changeValid when valid changes', async () => {
      await wrapper.setProps({
        modelValue: {
          name: 'Group',
          managers: [managerMock],
          maxSimultaneousChatsByAgent: '4',
        },
      });
      await flushPromises();

      expect(wrapper.emitted('changeValid')).toBeTruthy();
      expect(wrapper.emitted('changeValid').at(-1)[0]).toBe(true);
    });
  });

  describe('addGroupManager', () => {
    beforeEach(async () => {
      wrapper = createWrapper();
      await flushPromises();
    });

    it('should add manager when selected and clear selection', async () => {
      wrapper.vm.selectedManager = {
        value: managerMock.uuid,
        label: 'Maria Silva',
      };
      await flushPromises();

      expect(wrapper.vm.group.managers).toEqual([
        { ...managerMock, role: 1, new: true },
      ]);
      expect(wrapper.vm.selectedManager).toBeNull();
    });

    it('should not add duplicate manager by permission', async () => {
      await wrapper.setProps({
        modelValue: {
          ...emptyGroup(),
          managers: [{ permission: managerMock.uuid }],
        },
      });
      await flushPromises();

      wrapper.vm.addGroupManager(managerMock);

      expect(wrapper.vm.group.managers.length).toBe(1);
    });

    it('should ignore selection without value', async () => {
      wrapper.vm.selectedManager = null;
      await flushPromises();
      expect(wrapper.vm.group.managers).toEqual([]);
    });
  });

  describe('removeManager', () => {
    it('should remove manager without emitting when creating', async () => {
      wrapper = createWrapper({
        modelValue: {
          ...emptyGroup(),
          managers: [managerMock],
        },
      });
      await flushPromises();

      await wrapper.vm.removeManager(managerMock.uuid);

      expect(wrapper.vm.group.managers).toEqual([]);
      expect(wrapper.emitted('remove-manager')).toBeFalsy();
    });

    it('should emit remove-manager when editing an existing manager', async () => {
      wrapper = createWrapper({
        isEditing: true,
        modelValue: {
          ...emptyGroup(),
          managers: [managerMock],
        },
      });
      await flushPromises();

      await wrapper.vm.removeManager(managerMock.uuid);

      expect(wrapper.emitted('remove-manager')[0][0]).toEqual(managerMock);
      expect(wrapper.vm.group.managers).toEqual([]);
    });

    it('should not emit remove-manager for newly added managers while editing', async () => {
      const newManager = { ...managerMock, new: true };
      wrapper = createWrapper({
        isEditing: true,
        modelValue: {
          ...emptyGroup(),
          managers: [newManager],
        },
      });
      await flushPromises();

      await wrapper.vm.removeManager(newManager.uuid);

      expect(wrapper.emitted('remove-manager')).toBeFalsy();
      expect(wrapper.vm.group.managers).toEqual([]);
    });
  });

  describe('listGroupManagers', () => {
    it('should load group managers from authorization API', async () => {
      wrapper = createWrapper({
        modelValue: {
          ...emptyGroup(),
          uuid: 'group-uuid-1',
        },
      });
      await flushPromises();

      await wrapper.vm.listGroupManagers();
      await flushPromises();

      expect(Group.listAuthorization).toHaveBeenCalledWith({
        groupSectorUuid: 'group-uuid-1',
        role: 1,
      });
      expect(wrapper.vm.group.managers).toEqual([managerMock]);
    });
  });

  describe('photo', () => {
    beforeEach(async () => {
      wrapper = createWrapper();
      await flushPromises();
    });

    it('should strip query string from photo url', () => {
      expect(wrapper.vm.photo('http://photo.link/image.jpg?token=abc')).toBe(
        'http://photo.link/image.jpg',
      );
    });

    it('should return original value for empty photo links', () => {
      expect(wrapper.vm.photo(null)).toBeNull();
      expect(wrapper.vm.photo('')).toBe('');
      expect(wrapper.vm.photo(undefined)).toBeUndefined();
    });
  });
});
