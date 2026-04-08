import { flushPromises, mount, config } from '@vue/test-utils';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import i18n from '@/plugins/i18n';

import GeneralForm from '../General.vue';

import Project from '@/services/api/resources/settings/project';
import Group from '@/services/api/resources/settings/group';

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

beforeAll(() => {
  config.global.plugins = config.global.plugins.filter(
    (plugin) => plugin !== i18n,
  );
});

afterAll(() => {
  if (!config.global.plugins.includes(i18n)) {
    config.global.plugins.push(i18n);
  }
});

const managerFromApi = {
  uuid: 'manager-uuid-1',
  user: {
    email: 'lead@example.com',
    first_name: 'Pat',
    last_name: 'Admin',
    photo_url: 'https://cdn.example.com/p.jpg?v=1',
  },
};

const secondManagerFromApi = {
  uuid: 'manager-uuid-2',
  user: {
    email: 'other@example.com',
    first_name: 'Sam',
    last_name: 'Super',
    photo_url: null,
  },
};

const defaultGroup = () => ({
  uuid: 'group-1',
  name: 'Support',
  managers: [],
  maxSimultaneousChatsByAgent: 4,
});

const createWrapper = ({
  modelValue = defaultGroup(),
  isEditing = false,
} = {}) =>
  mount(GeneralForm, {
    props: {
      modelValue,
      isEditing,
    },
    global: {
      mocks: {
        $t: (key) => key,
      },
      stubs: {
        UnnnicInput: {
          name: 'UnnnicInput',
          template: '<input data-testid="general-unnic-input" />',
          props: ['modelValue', 'label', 'placeholder'],
        },
        UnnnicSelect: {
          name: 'UnnnicSelect',
          template: '<div data-testid="general-unnic-select" />',
          props: [
            'modelValue',
            'options',
            'label',
            'placeholder',
            'returnObject',
            'clearable',
            'enableSearch',
            'search',
          ],
        },
        SelectedMember: {
          name: 'SelectedMember',
          template:
            '<button type="button" data-testid="selected-member-remove" @click="$emit(\'remove\')" />',
          props: ['name', 'email', 'avatarUrl', 'roleName'],
        },
      },
    },
  });

describe('General.vue (ProjectGroupGeneralForm)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Project.managers.mockResolvedValue({
      results: [managerFromApi],
      next: null,
    });
    Group.listAuthorization.mockResolvedValue({
      results: [
        {
          uuid: 'auth-row-1',
          permission: 'manager-uuid-1',
          user: managerFromApi.user,
        },
      ],
    });
  });

  it('loads managers from Project.managers on mount', async () => {
    createWrapper();
    await flushPromises();

    expect(Project.managers).toHaveBeenCalledWith(0, 50);
  });

  it('maps API managers into select options', async () => {
    const wrapper = createWrapper();
    await flushPromises();

    expect(wrapper.vm.managersNames).toEqual([
      {
        value: 'manager-uuid-1',
        label: 'Pat Admin',
      },
    ]);
  });

  it('uses email as label when first and last name are empty', async () => {
    Project.managers.mockResolvedValue({
      results: [
        {
          uuid: 'm-email-only',
          user: { email: 'only@example.com', first_name: '', last_name: '' },
        },
      ],
      next: null,
    });
    const wrapper = createWrapper();
    await flushPromises();

    expect(wrapper.vm.managersNames[0].label).toBe('only@example.com');
  });

  it('computed valid requires name, limit >= 1, and at least one manager', async () => {
    const invalidGroup = {
      uuid: 'g1',
      name: '  ',
      managers: [],
      maxSimultaneousChatsByAgent: 0,
    };
    const wrapper = createWrapper({ modelValue: invalidGroup });
    await flushPromises();
    expect(wrapper.vm.valid).toBe(false);

    await wrapper.setProps({
      modelValue: {
        uuid: 'g1',
        name: 'Ok',
        managers: [
          { uuid: 'm1', permission: 'p1', user: { email: 'a@b.com' } },
        ],
        maxSimultaneousChatsByAgent: 1,
      },
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.valid).toBe(true);
  });

  it('adds manager from selectedManager and resets selection', async () => {
    const group = defaultGroup();
    const wrapper = createWrapper({ modelValue: group });
    await flushPromises();

    wrapper.vm.selectedManager = {
      value: 'manager-uuid-1',
      label: 'Pat Admin',
    };
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    expect(group.managers).toHaveLength(1);
    expect(group.managers[0].role).toBe(1);
    expect(group.managers[0].new).toBe(true);
    expect(wrapper.vm.selectedManager).toBe(null);
  });

  it('does not duplicate manager when permission already matches uuid', async () => {
    const group = defaultGroup();
    group.managers = [
      {
        uuid: 'existing-row',
        permission: 'manager-uuid-1',
        user: { email: 'x@test.com' },
      },
    ];
    const wrapper = createWrapper({ modelValue: group });
    await flushPromises();

    wrapper.vm.selectedManager = {
      value: 'manager-uuid-1',
      label: 'Pat Admin',
    };
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    expect(group.managers).toHaveLength(1);
  });

  it('removeManager drops manager from group.managers', async () => {
    const group = defaultGroup();
    group.managers = [
      {
        uuid: 'row-1',
        new: true,
        user: { email: 'x@test.com' },
      },
    ];
    const wrapper = createWrapper({ modelValue: group, isEditing: false });
    await flushPromises();

    await wrapper.vm.removeManager('row-1');

    expect(group.managers).toHaveLength(0);
  });

  it('emits remove-manager when isEditing and manager is not new', async () => {
    const managerRow = {
      uuid: 'persisted-row',
      new: false,
      user: { email: 'old@test.com' },
    };
    const group = defaultGroup();
    group.managers = [managerRow];
    const wrapper = createWrapper({ modelValue: group, isEditing: true });
    await flushPromises();

    await wrapper.vm.removeManager('persisted-row');

    expect(wrapper.emitted('remove-manager')).toBeTruthy();
    expect(wrapper.emitted('remove-manager')[0][0]).toEqual(managerRow);
    expect(group.managers).toHaveLength(0);
  });

  it('does not emit remove-manager for new managers while editing', async () => {
    const group = defaultGroup();
    group.managers = [
      { uuid: 'new-row', new: true, user: { email: 'n@test.com' } },
    ];
    const wrapper = createWrapper({ modelValue: group, isEditing: true });
    await flushPromises();

    await wrapper.vm.removeManager('new-row');

    expect(wrapper.emitted('remove-manager')).toBeFalsy();
  });

  it('emits changeValid when form becomes valid', async () => {
    const group = {
      uuid: 'g1',
      name: 'Team',
      managers: [],
      maxSimultaneousChatsByAgent: 2,
    };
    const wrapper = createWrapper({ modelValue: group });
    await flushPromises();

    wrapper.vm.selectedManager = {
      value: 'manager-uuid-1',
      label: 'Pat Admin',
    };
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    const payloads = wrapper.emitted('changeValid')?.map((e) => e[0]) ?? [];
    expect(payloads).toContain(true);
  });

  it('listGroupManagers assigns results to group.managers', async () => {
    const group = defaultGroup();
    group.managers = [];
    const wrapper = createWrapper({ modelValue: group });
    await flushPromises();

    await wrapper.vm.listGroupManagers();

    expect(Group.listAuthorization).toHaveBeenCalledWith({
      groupSectorUuid: 'group-1',
      role: 1,
    });
    expect(group.managers).toHaveLength(1);
    expect(group.managers[0].permission).toBe('manager-uuid-1');
  });

  it('renders service managers title when isEditing', async () => {
    const wrapper = createWrapper({ isEditing: true });
    await flushPromises();

    expect(wrapper.find('h2').text()).toBe(
      'config_chats.groups.general_form.service_managers',
    );
  });

  it('renders default title when not editing', async () => {
    const wrapper = createWrapper({ isEditing: false });
    await flushPromises();

    expect(wrapper.find('h2').text()).toBe(
      'config_chats.groups.general_form.title',
    );
  });

  it('applies is-editing class when prop is true', async () => {
    const wrapper = createWrapper({ isEditing: true });
    await flushPromises();

    expect(wrapper.find('section').classes()).toContain('is-editing');
  });

  it('photo strips query string from link', () => {
    const wrapper = createWrapper();
    expect(wrapper.vm.photo('https://cdn.example.com/a.png?x=1')).toBe(
      'https://cdn.example.com/a.png',
    );
    expect(wrapper.vm.photo(undefined)).toBe(undefined);
  });

  it('fetches next page when Project.managers returns next', async () => {
    Project.managers
      .mockResolvedValueOnce({
        results: [managerFromApi],
        next: 'https://api.example.com/more',
      })
      .mockResolvedValueOnce({
        results: [secondManagerFromApi],
        next: null,
      });

    createWrapper();
    await flushPromises();

    expect(Project.managers).toHaveBeenCalledTimes(2);
    expect(Project.managers).toHaveBeenNthCalledWith(1, 0, 50);
    expect(Project.managers).toHaveBeenNthCalledWith(2, 50, 50);
  });
});
