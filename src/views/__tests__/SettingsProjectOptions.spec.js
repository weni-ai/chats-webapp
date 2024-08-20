import { mount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import SettingsProjectOptions from '@/views/Settings/SettingsProjectOptions/index.vue';

import { createTestingPinia } from '@pinia/testing';
import { useProfile } from '@/store/modules/profile';
import Project from '@/services/api/resources/settings/project';

describe('SettingsProjectOptions.vue', () => {
  let wrapper;
  let profileStore;
  const store = createTestingPinia();

  beforeEach(() => {
    profileStore = useProfile();
    profileStore.me = { project_permission_role: 1 };

    wrapper = mount(SettingsProjectOptions, {
      global: {
        plugins: [store],
      },
    });

    vi.spyOn(Project, 'update').mockResolvedValue({});
  });

  it('should render SettingsSectionHeader if user is manager', () => {
    const header = wrapper.findComponent(
      '[data-testid=settings-project-header]',
    );
    expect(header.exists()).toBe(true);
  });

  it('should not render if user is not manager', async () => {
    profileStore.me = { project_permission_role: 2 };

    await wrapper.vm.$nextTick();

    const settingsProject = wrapper.findComponent(
      '[data-testid=settings-project]',
    );
    expect(settingsProject.exists()).toBe(false);
  });

  it('should init with configs in false', () => {
    const projectConfigValues = Object.values(wrapper.vm.projectConfig);
    expect(projectConfigValues.every((value) => !value)).toBe(true);
  });

  it('should render SettingsProjectOptionsItem components with correct props', async () => {
    wrapper.vm.projectConfig = {
      can_use_bulk_transfer: false,
      can_use_queue_prioritization: true,
      filter_offline_agents: false,
    };
    await wrapper.vm.$nextTick();

    const options = wrapper.findAllComponents(
      '[data-testid=settings-project-option]',
    );
    expect(options).toHaveLength(3);

    const [option1, option2, option3] = options;

    expect(option1.props('modelValue')).toBe(false);
    expect(option1.props('name')).toBe(
      wrapper.vm.$t(
        'config_chats.project_configs.bulk_transfer.switch_inactive',
      ),
    );
    expect(option1.props('tooltip')).toBe(
      wrapper.vm.$t('config_chats.project_configs.bulk_transfer.tooltip'),
    );

    expect(option2.props('modelValue')).toBe(true);
    expect(option2.props('name')).toBe(
      wrapper.vm.$t(
        'config_chats.project_configs.queue_prioritization.switch_active',
      ),
    );
    expect(option2.props('tooltip')).toBe(
      wrapper.vm.$t(
        'config_chats.project_configs.queue_prioritization.tooltip',
      ),
    );

    expect(option3.props('modelValue')).toBe(false);
    expect(option3.props('name')).toBe(
      wrapper.vm.$t(
        'config_chats.project_configs.block_transfer_to_off_agents.switch_inactive',
      ),
    );
    expect(option3.props('tooltip')).toBe('');
  });

  it('should call updateProjectConfig when projectConfig changes', async () => {
    const updateSpy = vi.spyOn(wrapper.vm, 'updateProjectConfig');

    wrapper.vm.projectConfig = {
      can_use_bulk_transfer: true,
      can_use_queue_prioritization: false,
      filter_offline_agents: true,
    };

    await wrapper.vm.$nextTick();

    expect(updateSpy).toHaveBeenCalled();
  });

  it('should call Project.update with correct data on updateProjectConfig', async () => {
    wrapper.vm.projectConfig = {
      can_use_bulk_transfer: true,
      can_use_queue_prioritization: false,
      filter_offline_agents: true,
    };

    await wrapper.vm.updateProjectConfig();

    expect(Project.update).toHaveBeenCalledWith({
      can_use_bulk_transfer: true,
      can_use_queue_prioritization: false,
      filter_offline_agents: true,
    });
  });

  it('should match the snapshot', () => {
    expect(wrapper.element).toMatchSnapshot();
  });
});
