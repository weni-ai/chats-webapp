import { flushPromises, mount, config } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
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

import ProjectsForm from '../Projects.vue';

import Sector from '@/services/api/resources/settings/sector';

vi.mock('@/services/api/resources/settings/sector', () => ({
  default: {
    list: vi.fn(),
  },
}));

vi.mock('@weni/unnnic-system', () => ({
  default: {
    unnnicCallAlert: vi.fn(),
  },
}));

import unnnic from '@weni/unnnic-system';

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

const sectorFree = {
  uuid: 'sector-uuid-1',
  name: 'Project Alpha',
  has_group_sector: false,
};

const sectorTaken = {
  uuid: 'sector-uuid-2',
  name: 'Project Beta',
  has_group_sector: true,
};

const secondSector = {
  uuid: 'sector-uuid-3',
  name: 'Project Gamma',
  has_group_sector: false,
};

const defaultGroup = () => ({
  uuid: 'group-1',
  sectors: [],
});

const createWrapper = ({
  modelValue = defaultGroup(),
  isEditing = false,
} = {}) => {
  const pinia = createPinia();
  setActivePinia(pinia);

  return mount(ProjectsForm, {
    props: {
      modelValue,
      isEditing,
    },
    global: {
      plugins: [pinia],
      mocks: {
        $t: (key, params) =>
          params ? `${key}:${JSON.stringify(params)}` : key,
      },
      stubs: {
        UnnnicSelect: {
          name: 'UnnnicSelect',
          template: '<div data-testid="projects-unnic-select" />',
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
        UnnnicIcon: {
          name: 'UnnnicIcon',
          template:
            '<span data-testid="projects-remove-icon" @click="$emit(\'click\')" />',
          props: ['icon', 'clickable'],
        },
      },
    },
  });
};

describe('Projects.vue (ProjectGroupProjectsForm)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Sector.list.mockResolvedValue({
      results: [sectorFree],
      next: null,
    });
  });

  it('loads sectors from Sector.list on mount', async () => {
    createWrapper();
    await flushPromises();

    expect(Sector.list).toHaveBeenCalledWith({
      limit: 20,
      offset: 0,
    });
  });

  it('maps sectors into select options', async () => {
    const wrapper = createWrapper();
    await flushPromises();

    expect(wrapper.vm.sectorProjectsNames).toEqual([
      { value: 'sector-uuid-1', label: 'Project Alpha' },
    ]);
  });

  it('computed valid is false without sectors and true with sectors', async () => {
    const wrapper = createWrapper({
      modelValue: { uuid: 'g1', sectors: [] },
    });
    await flushPromises();
    expect(wrapper.vm.valid).toBe(false);

    await wrapper.setProps({
      modelValue: {
        uuid: 'g1',
        sectors: [{ uuid: 's1', name: 'S' }],
      },
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.valid).toBe(true);
  });

  it('adds sector from selectedSector and clears selection', async () => {
    const group = defaultGroup();
    const wrapper = createWrapper({ modelValue: group });
    await flushPromises();

    wrapper.vm.selectedSector = {
      value: 'sector-uuid-1',
      label: 'Project Alpha',
    };
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    expect(group.sectors).toHaveLength(1);
    expect(group.sectors[0].new).toBe(true);
    expect(group.sectors[0].uuid).toBe('sector-uuid-1');
    expect(wrapper.vm.selectedSector).toBe(null);
  });

  it('shows alert and does not add sector when has_group_sector is true', async () => {
    Sector.list.mockResolvedValue({
      results: [sectorTaken],
      next: null,
    });
    const group = defaultGroup();
    const wrapper = createWrapper({ modelValue: group });
    await flushPromises();

    wrapper.vm.selectedSector = {
      value: 'sector-uuid-2',
      label: 'Project Beta',
    };
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    expect(unnnic.unnnicCallAlert).toHaveBeenCalled();
    expect(group.sectors).toHaveLength(0);
    expect(wrapper.vm.selectedSector).toBe(null);
  });

  it('does not duplicate sector with same uuid', async () => {
    const group = defaultGroup();
    group.sectors = [{ uuid: 'sector-uuid-1', name: 'Already', new: false }];
    const wrapper = createWrapper({ modelValue: group });
    await flushPromises();

    wrapper.vm.selectedSector = {
      value: 'sector-uuid-1',
      label: 'Project Alpha',
    };
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    expect(group.sectors).toHaveLength(1);
  });

  it('removeSector removes from group.sectors', async () => {
    const group = defaultGroup();
    group.sectors = [{ uuid: 's-row', name: 'X', new: true }];
    const wrapper = createWrapper({ modelValue: group, isEditing: false });
    await flushPromises();

    wrapper.vm.removeSector('s-row');

    expect(group.sectors).toHaveLength(0);
  });

  it('emits remove-sector when isEditing and sector is not new', async () => {
    const sectorRow = { uuid: 'persisted', name: 'P', new: false };
    const group = defaultGroup();
    group.sectors = [sectorRow];
    const wrapper = createWrapper({ modelValue: group, isEditing: true });
    await flushPromises();

    wrapper.vm.removeSector('persisted');

    expect(wrapper.emitted('remove-sector')).toBeTruthy();
    expect(wrapper.emitted('remove-sector')[0][0]).toEqual(sectorRow);
    expect(group.sectors).toHaveLength(0);
  });

  it('does not emit remove-sector for new sectors while editing', async () => {
    const group = defaultGroup();
    group.sectors = [{ uuid: 'new-s', name: 'N', new: true }];
    const wrapper = createWrapper({ modelValue: group, isEditing: true });
    await flushPromises();

    wrapper.vm.removeSector('new-s');

    expect(wrapper.emitted('remove-sector')).toBeFalsy();
  });

  it('emits changeValid when form becomes valid', async () => {
    const group = defaultGroup();
    const wrapper = createWrapper({ modelValue: group });
    await flushPromises();

    wrapper.vm.selectedSector = {
      value: 'sector-uuid-1',
      label: 'Project Alpha',
    };
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    const payloads = wrapper.emitted('changeValid')?.map((e) => e[0]) ?? [];
    expect(payloads).toContain(true);
  });

  it('applies is-editing class when prop is true', async () => {
    const wrapper = createWrapper({ isEditing: true });
    await flushPromises();

    expect(wrapper.find('section').classes()).toContain('is-editing');
  });

  it('renders title from i18n key', async () => {
    const wrapper = createWrapper();
    await flushPromises();

    expect(wrapper.find('h2').text()).toBe(
      'config_chats.groups.projects_form.title',
    );
  });

  it('requests next page when Sector.list returns next', async () => {
    Sector.list
      .mockResolvedValueOnce({
        results: [sectorFree],
        next: 'https://api.example.com/next',
      })
      .mockResolvedValueOnce({
        results: [secondSector],
        next: null,
      });

    createWrapper();
    await flushPromises();

    expect(Sector.list).toHaveBeenCalledTimes(2);
    expect(Sector.list).toHaveBeenNthCalledWith(1, { limit: 20, offset: 0 });
    expect(Sector.list).toHaveBeenNthCalledWith(2, { limit: 20, offset: 20 });
  });
});
