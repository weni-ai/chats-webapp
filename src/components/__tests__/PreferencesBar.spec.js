import { vi } from 'vitest';
import { mount, shallowMount } from '@vue/test-utils';
import { useConfig } from '@/store/modules/config';
import PreferencesBar from '@/components/PreferencesBar.vue';
import { createPinia, setActivePinia } from 'pinia';
import i18n from '@/plugins/i18n';
import Unnnic from '@weni/unnnic-system';
import { PREFERENCES_SOUND } from '@/services/api/websocket/soundNotification.js';

vi.mock('@/api/Profile', () => ({
  updateStatus: vi.fn(),
}));

describe('PreferencesBar Component', () => {
  let wrapper;
  let configStore;

  beforeEach(() => {
    setActivePinia(createPinia());
    configStore = useConfig();
    configStore.status = 'OFFLINE';

    vi.spyOn(PreferencesBar.methods, 'handlingGetStatus').mockImplementation(
      vi.fn(),
    );
    window.dispatchEvent = vi.fn();

    wrapper = shallowMount(PreferencesBar, {
      props: {
        showFlowsTriggerButton: true,
        dashboard: true,
      },
    });
  });

  describe('Initial rendering and structure', () => {
    it('should render the PreferencesBar component', () => {
      expect(wrapper.exists()).toBe(true);
    });

    it('should render the header icons', () => {
      const headerIcon = wrapper.find('[data-testid="header-icon"]');
      const headerIconExpand = wrapper.find(
        '[data-testid="header-icon-expand"]',
      );
      expect(headerIcon.exists()).toBe(true);
      expect(headerIconExpand.exists()).toBe(true);
    });

    it('should render the header with the correct label', () => {
      const header = wrapper.find('[data-testid="header-title"]');
      expect(header.text()).toBe(i18n.global.t('preferences.title'));
    });

    it('should render the switchs', () => {
      const statusSwitch = wrapper.findComponent(
        '[data-testid="switch-status"]',
      );
      const soundSwitch = wrapper.findComponent('[data-testid="switch-sound"]');
      expect(statusSwitch.exists()).toBe(true);
      expect(soundSwitch.exists()).toBe(true);
    });

    it('should render all buttons', () => {
      const buttons = wrapper.findAllComponents(Unnnic.unnnicButton);
      expect(buttons).toHaveLength(3);
    });
  });

  describe('Lifecycle hooks', () => {
    it('should call handlingGetStatus on created hook', async () => {
      expect(PreferencesBar.methods.handlingGetStatus).toHaveBeenCalled();
    });

    it('should set sound based on localStorage value', async () => {
      localStorage.setItem(PREFERENCES_SOUND, 'yes');
      wrapper = mount(PreferencesBar);
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.sound).toBe(true);

      localStorage.setItem(PREFERENCES_SOUND, 'no');
      wrapper = mount(PreferencesBar);
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.sound).toBe(false);
    });

    it('should dispatch the correct window event based on help property', async () => {
      wrapper.setData({ help: true });
      await wrapper.vm.$nextTick();
      expect(window.dispatchEvent).toHaveBeenCalledWith(
        new CustomEvent('showBottomRightOptions'),
      );

      wrapper.setData({ help: false });
      await wrapper.vm.$nextTick();
      expect(window.dispatchEvent).toHaveBeenCalledWith(
        new CustomEvent('hideBottomRightOptions'),
      );
    });
  });

  describe('Interactions', () => {
    it('should toggle the open state on focus and blur', async () => {
      const preferencesBar = wrapper.find('[data-testid="preferences-bar"]');
      await preferencesBar.trigger('focus');
      expect(wrapper.vm.open).toBe(true);

      await preferencesBar.trigger('blur');
      expect(wrapper.vm.open).toBe(false);
    });
  });

  describe('Status Switch', () => {
    it('should update the status switch model when toggled', async () => {
      const statusSwitch = wrapper.findComponent(
        '[data-testid="switch-status"]',
      );
      await statusSwitch.setValue(true);
      expect(wrapper.vm.statusSwitch).toBe(true);
    });
  });

  describe('Sound Switch', () => {
    it('should update the sound model when toggled', async () => {
      const soundSwitch = wrapper.findComponent('[data-testid="switch-sound"]');
      await soundSwitch.setValue(true);
      expect(wrapper.vm.sound).toBe(true);
    });
  });

  describe('Buttons functionality', () => {
    it('should call openFlowsTrigger when the show flows trigger button is clicked', async () => {
      const flowsButton = wrapper.findComponent(
        '[data-testid="show-flows-trigger"]',
      );

      await flowsButton.trigger('click');
      expect(wrapper.emitted('open-flows-trigger')).toBeTruthy();
    });

    it('should navigate to dashboard when the dashboard button is clicked', async () => {
      wrapper.vm.navigate = vi.fn();
      const dashboardButton = wrapper.findComponent(
        '[data-testid="show-dashboard"]',
      );
      await dashboardButton.trigger('click');
      expect(wrapper.vm.navigate).toHaveBeenCalled();
    });

    it('should call openQuickMessage when the show quick messages button is clicked', async () => {
      const quickMessagesButton = wrapper.findComponent(
        '[data-testid="show-quick-messages"]',
      );

      await quickMessagesButton.trigger('click');
      expect(wrapper.emitted('show-quick-messages')).toBeTruthy();
    });
  });
});
