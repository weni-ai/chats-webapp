import { mount, flushPromises } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setActivePinia } from 'pinia';
import { createTestingPinia } from '@pinia/testing';

import ProjectsForm from '../Projects.vue';
import Sector from '@/services/api/resources/settings/sector';
import Unnnic from '@weni/unnnic-system';
import i18n from '@/plugins/i18n';

import { useCompositionI18nInThisSpecFile } from '@/utils/test/compositionI18nVitest';

const sectorMock = {
  uuid: 'sector-uuid-1',
  name: 'Project Alpha',
  has_group_sector: false,
};

const sectorWithGroup = {
  uuid: 'sector-uuid-2',
  name: 'Project Beta',
  has_group_sector: true,
};

vi.mock('@/services/api/resources/settings/sector', () => ({
  default: {
    list: vi.fn(),
  },
}));

vi.mock('@weni/unnnic-system', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    default: {
      ...actual.default,
      unnnicCallAlert: vi.fn(),
    },
  };
});

const emptyGroup = () => ({
  sectors: [],
});

const createWrapper = (props = {}) => {
  const pinia = createTestingPinia({ createSpy: vi.fn });
  setActivePinia(pinia);

  return mount(ProjectsForm, {
    props: {
      modelValue: emptyGroup(),
      ...props,
    },
    global: {
      plugins: [pinia],
    },
  });
};

describe('ProjectGroupProjectsForm', () => {
  useCompositionI18nInThisSpecFile();

  let wrapper;

  beforeEach(() => {
    vi.clearAllMocks();
    Sector.list = vi.fn().mockResolvedValue({
      results: [sectorMock, sectorWithGroup],
      next: null,
    });
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  describe('Rendering', () => {
    it('should render title, select and editing class', async () => {
      wrapper = createWrapper();
      await flushPromises();

      expect(wrapper.find('.groups-projects-form__title').text()).toBe(
        i18n.global.t('config_chats.groups.projects_form.title'),
      );
      expect(wrapper.findComponent({ name: 'UnnnicSelect' }).exists()).toBe(
        true,
      );
      expect(wrapper.classes()).not.toContain('is-editing');

      await wrapper.setProps({ isEditing: true });
      expect(wrapper.classes()).toContain('is-editing');
    });

    it('should render selected sectors list with project name fallback', async () => {
      wrapper = createWrapper({
        modelValue: {
          sectors: [
            { uuid: 'sector-1', project: { name: 'Nested Project' } },
            { uuid: 'sector-2', name: 'Direct Name' },
          ],
        },
      });
      await flushPromises();

      const names = wrapper.findAll('.list-item-name');
      expect(names.length).toBe(2);
      expect(names.at(0).text()).toBe('Nested Project');
      expect(names.at(1).text()).toBe('Direct Name');
    });
  });

  describe('Mounted - listAllSectors', () => {
    it('should load sectors on mount', async () => {
      wrapper = createWrapper();
      await flushPromises();

      expect(Sector.list).toHaveBeenCalledWith({
        limit: 20,
        offset: 0,
      });
      expect(wrapper.vm.sectors.length).toBe(2);
    });

    it('should paginate sectors while next is truthy', async () => {
      Sector.list = vi
        .fn()
        .mockResolvedValueOnce({
          results: [sectorMock],
          next: 'next-page',
        })
        .mockResolvedValueOnce({
          results: [sectorWithGroup],
          next: null,
        });

      wrapper = createWrapper();
      await flushPromises();

      expect(Sector.list).toHaveBeenCalledTimes(2);
      expect(wrapper.vm.sectors.length).toBe(2);
    });

    it('should log error when sector list fails', async () => {
      const error = new Error('list failed');
      Sector.list = vi.fn().mockRejectedValue(error);
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      wrapper = createWrapper();
      await flushPromises();

      expect(consoleSpy).toHaveBeenCalledWith(error);
      consoleSpy.mockRestore();
    });
  });

  describe('Computed', () => {
    beforeEach(async () => {
      wrapper = createWrapper();
      await flushPromises();
    });

    it('should map sectorProjectsNames', () => {
      expect(wrapper.vm.sectorProjectsNames).toEqual([
        { value: 'sector-uuid-1', label: 'Project Alpha' },
        { value: 'sector-uuid-2', label: 'Project Beta' },
      ]);
    });

    it('should be valid only when there is at least one sector', async () => {
      expect(wrapper.vm.valid).toBe(false);

      await wrapper.setProps({
        modelValue: { sectors: [sectorMock] },
      });
      expect(wrapper.vm.valid).toBe(true);
    });

    it('should emit changeValid when valid changes', async () => {
      await wrapper.setProps({
        modelValue: { sectors: [sectorMock] },
      });
      await flushPromises();

      expect(wrapper.emitted('changeValid')).toBeTruthy();
      expect(wrapper.emitted('changeValid').at(-1)[0]).toBe(true);
    });
  });

  describe('addGroupSector', () => {
    beforeEach(async () => {
      wrapper = createWrapper();
      await flushPromises();
    });

    it('should add sector when selected and clear selection', async () => {
      wrapper.vm.selectedSector = {
        value: sectorMock.uuid,
        label: sectorMock.name,
      };
      await flushPromises();

      expect(wrapper.vm.group.sectors).toEqual([
        { ...sectorMock, new: true },
      ]);
      expect(wrapper.vm.selectedSector).toBeNull();
    });

    it('should show alert and not add sector that already has a group', async () => {
      wrapper.vm.selectedSector = {
        value: sectorWithGroup.uuid,
        label: sectorWithGroup.name,
      };
      await flushPromises();

      expect(Unnnic.unnnicCallAlert).toHaveBeenCalledWith({
        props: {
          text: i18n.global.t(
            'config_chats.groups.projects_form.message.has_group_sector',
            { sectorName: sectorWithGroup.name },
          ),
          type: 'error',
        },
      });
      expect(wrapper.vm.group.sectors).toEqual([]);
      expect(wrapper.vm.selectedSector).toBeNull();
    });

    it('should not add duplicate sector', async () => {
      await wrapper.setProps({
        modelValue: { sectors: [sectorMock] },
      });
      await flushPromises();

      wrapper.vm.addGroupSector(sectorMock);

      expect(wrapper.vm.group.sectors.length).toBe(1);
    });

    it('should ignore selection without value', async () => {
      wrapper.vm.selectedSector = null;
      await flushPromises();
      expect(wrapper.vm.group.sectors).toEqual([]);
    });
  });

  describe('removeSector', () => {
    it('should remove sector without emitting when creating', async () => {
      wrapper = createWrapper({
        modelValue: { sectors: [sectorMock] },
      });
      await flushPromises();

      wrapper.vm.removeSector(sectorMock.uuid);

      expect(wrapper.vm.group.sectors).toEqual([]);
      expect(wrapper.emitted('remove-sector')).toBeFalsy();
    });

    it('should emit remove-sector when editing an existing sector', async () => {
      wrapper = createWrapper({
        isEditing: true,
        modelValue: { sectors: [sectorMock] },
      });
      await flushPromises();

      wrapper.vm.removeSector(sectorMock.uuid);

      expect(wrapper.emitted('remove-sector')[0][0]).toEqual(sectorMock);
      expect(wrapper.vm.group.sectors).toEqual([]);
    });

    it('should not emit remove-sector for newly added sectors while editing', async () => {
      const newSector = { ...sectorMock, new: true };
      wrapper = createWrapper({
        isEditing: true,
        modelValue: { sectors: [newSector] },
      });
      await flushPromises();

      wrapper.vm.removeSector(newSector.uuid);

      expect(wrapper.emitted('remove-sector')).toBeFalsy();
      expect(wrapper.vm.group.sectors).toEqual([]);
    });

    it('should remove sector when close icon is clicked', async () => {
      wrapper = createWrapper({
        modelValue: { sectors: [sectorMock] },
      });
      await flushPromises();

      await wrapper
        .find('.groups-projects-form__list-item')
        .findComponent({ name: 'UnnnicIcon' })
        .vm.$emit('click');
      await flushPromises();

      expect(wrapper.vm.group.sectors).toEqual([]);
    });
  });
});
