import { mount } from '@vue/test-utils';
import { describe, it, expect, beforeEach } from 'vitest';

import SettingsHeader from '@/views/Settings/SettingsHeader.vue';

const createWrapper = (props = {}) => {
  return mount(SettingsHeader, {
    props,
  });
};

describe('SettingsHeader.vue', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = createWrapper();
  });

  it('should render the header title with correct text', () => {
    const headerTitle = wrapper.find(
      '[data-testid=settings-view-header-title]',
    );

    expect(headerTitle.exists()).toBe(true);
    expect(headerTitle.text()).toBe(wrapper.vm.$t('config_chats.title'));
  });

  it('should render the save button', () => {
    const saveButton = wrapper.find('[data-testid=settings-save-button]');
    expect(saveButton.exists()).toBe(true);
  });

  it('should render save button with correct text', () => {
    const saveButton = wrapper.find('[data-testid=settings-save-button]');
    expect(saveButton.text()).toContain(
      wrapper.vm.$t('config_chats.save_changes'),
    );
  });

  it('should disable save button when hasUnsavedChanges is false', () => {
    wrapper = createWrapper({ hasUnsavedChanges: false });
    const saveButton = wrapper.find('[data-testid=settings-save-button]');
    expect(saveButton.attributes('disabled')).toBeDefined();
  });

  it('should enable save button when hasUnsavedChanges is true', () => {
    wrapper = createWrapper({ hasUnsavedChanges: true });
    const saveButton = wrapper.find('[data-testid=settings-save-button]');
    expect(saveButton.attributes('disabled')).toBeUndefined();
  });

  it('should emit save event when save button is clicked', async () => {
    wrapper = createWrapper({ hasUnsavedChanges: true });
    const saveButton = wrapper.find('[data-testid=settings-save-button]');

    await saveButton.trigger('click');
    expect(wrapper.emitted('save')).toBeTruthy();
    expect(wrapper.emitted('save')).toHaveLength(1);
  });

  it('should show loading state when isSaving is true', () => {
    wrapper = createWrapper({ isSaving: true, hasUnsavedChanges: true });
    const saveButton = wrapper.findComponent(
      '[data-testid=settings-save-button]',
    );
    expect(saveButton.props('loading')).toBe(true);
  });

  it('should match the snapshot', () => {
    expect(wrapper.element).toMatchSnapshot();
  });
});
