import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { mount, config } from '@vue/test-utils';
import ChatsDropzone from '@/layouts/ChatsLayout/components/ChatsDropzone/index.vue';
import i18n from '@/plugins/i18n';

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

describe('ChatsDropzone', () => {
  const createWrapper = (props = {}, slots = {}) =>
    mount(ChatsDropzone, {
      props: { show: true, ...props },
      slots,
      global: {
        mocks: { $t: (key) => key },
        stubs: {
          UnnnicIconSvg: {
            template: '<span data-testid="icon-svg"></span>',
            props: ['icon', 'scheme', 'size'],
          },
        },
      },
    });

  const mockEvent = (files = []) => ({ dataTransfer: { files } });
  const mockFile = (name = 'test.txt') => ({
    name,
    type: 'text/plain',
    size: 1024,
  });

  describe('Props and Initial State', () => {
    it('should handle props and initialize correctly', () => {
      const wrapper = createWrapper();
      expect(wrapper.props('show')).toBe(true);
      expect(wrapper.vm.files).toEqual([]);
      expect(wrapper.vm.isDragging).toBe(false);
      expect(wrapper.vm.dragEnterCounter).toBe(0);

      const wrapperHidden = createWrapper({ show: false });
      expect(wrapperHidden.props('show')).toBe(false);
    });
  });

  describe('Rendering', () => {
    it('should render container and slot content', () => {
      const wrapper = createWrapper(
        {},
        { default: '<div data-testid="slot">Content</div>' },
      );
      const container = wrapper.find('[data-testid="dropzone-container"]');

      expect(container.exists()).toBe(true);
      expect(container.classes()).toContain('dropzone');
      expect(wrapper.find('[data-testid="slot"]').exists()).toBe(true);
    });

    it('should conditionally show drag description and apply classes', async () => {
      const wrapper = createWrapper();

      // Initially hidden
      expect(
        wrapper.find('[data-testid="dropzone-description"]').exists(),
      ).toBe(false);

      // Show when dragging
      await wrapper.setData({ isDragging: true });
      const container = wrapper.find('[data-testid="dropzone-container"]');
      const description = wrapper.find('[data-testid="dropzone-description"]');

      expect(description.exists()).toBe(true);
      expect(wrapper.find('[data-testid="dropzone-icon"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="dropzone-title"]').text()).toBe(
        'dropzone.description',
      );
      expect(container.classes()).toContain('dragging');

      // Hidden when show=false
      const wrapperHidden = createWrapper({ show: false });
      await wrapperHidden.setData({ isDragging: true });
      expect(
        wrapperHidden.find('[data-testid="dropzone-description"]').exists(),
      ).toBe(false);
      expect(
        wrapperHidden.find('[data-testid="dropzone-container"]').classes(),
      ).not.toContain('dragging');
    });
  });

  describe('Drag and Drop Functionality', () => {
    it('should handle complete drag sequence with counter logic', async () => {
      const wrapper = createWrapper();
      const container = wrapper.find('[data-testid="dropzone-container"]');

      // dragenter - increment counter, set dragging
      await container.trigger('dragenter');
      expect(wrapper.vm.dragEnterCounter).toBe(1);
      expect(wrapper.vm.isDragging).toBe(true);

      // Multiple dragenter events
      await container.trigger('dragenter');
      expect(wrapper.vm.dragEnterCounter).toBe(2);

      // dragover - maintain dragging state
      await wrapper.setData({ isDragging: false });
      await container.trigger('dragover');
      expect(wrapper.vm.isDragging).toBe(true);

      // dragleave - decrement counter, stop dragging when counter = 0
      await wrapper.setData({ dragEnterCounter: 2 });
      await container.trigger('dragleave');
      expect(wrapper.vm.dragEnterCounter).toBe(1);
      expect(wrapper.vm.isDragging).toBe(true);

      await container.trigger('dragleave');
      expect(wrapper.vm.dragEnterCounter).toBe(0);
      expect(wrapper.vm.isDragging).toBe(false);
    });

    it('should handle file drop with proper emission and state reset', async () => {
      const wrapper = createWrapper();
      const container = wrapper.find('[data-testid="dropzone-container"]');
      const files = [mockFile(), mockFile('test2.txt')];

      // Drop with files - should emit and reset
      await wrapper.setData({ dragEnterCounter: 2, isDragging: true });
      await container.trigger('drop', mockEvent(files));

      expect(wrapper.emitted('open-file-uploader')).toBeTruthy();
      expect(wrapper.emitted('open-file-uploader')[0][0]).toBe(files);
      expect(wrapper.vm.dragEnterCounter).toBe(0);
      expect(wrapper.vm.isDragging).toBe(false);

      // Drop without files - should reset state but not emit
      await wrapper.setData({ dragEnterCounter: 1, isDragging: true });
      await container.trigger('drop', mockEvent([]));

      expect(wrapper.emitted('open-file-uploader')).toHaveLength(1); // Still only 1 emission
      expect(wrapper.vm.dragEnterCounter).toBe(0);
      expect(wrapper.vm.isDragging).toBe(false);
    });

    it('should handle direct method calls', () => {
      const wrapper = createWrapper();
      const files = [mockFile()];

      // Test openFileUploader method
      wrapper.vm.openFileUploader(files);
      expect(wrapper.emitted('open-file-uploader')).toBeTruthy();
      expect(wrapper.emitted('open-file-uploader')[0][0]).toBe(files);

      // Test drop method with and without files
      const dropSpy = vi.spyOn(wrapper.vm, 'openFileUploader');
      wrapper.vm.drop(mockEvent(files));
      expect(dropSpy).toHaveBeenCalledWith(files);

      wrapper.vm.drop(mockEvent([]));
      expect(dropSpy).toHaveBeenCalledTimes(1); // No additional call for empty files
    });
  });

  describe('Snapshot', () => {
    it('should match snapshot', async () => {
      const wrapper = createWrapper();
      expect(wrapper.element).toMatchSnapshot();
    });
  });
});
