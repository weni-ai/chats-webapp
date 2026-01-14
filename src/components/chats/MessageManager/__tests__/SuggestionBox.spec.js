import { mount } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';

import SuggestionBox from '../SuggestionBox.vue';

const suggestions = [
  {
    uuid: '1',
    id: 1,
    title: 'Fake Suggestion',
    shortcut: 'fake-suggestion',
    text: 'This is a fake suggestion',
    message: 'This is a fake suggestion',
  },
  {
    uuid: '2',
    id: 2,
    title: 'Other Fake Suggestion',
    shortcut: 'other-fake-suggestion',
    text: 'This is another fake suggestion',
    message: 'This is another fake suggestion',
  },
  {
    uuid: '3',
    id: 3,
    title: 'Third Suggestion',
    shortcut: 'third',
    text: 'Third suggestion text',
    message: 'Third suggestion text',
  },
];

function createWrapper(props = {}) {
  const wrapper = mount(SuggestionBox, {
    props: {
      search: '',
      suggestions,
      ...props,
    },
    global: {
      mocks: {
        $t: (key) => {
          const translations = {
            'quick_messages.no_suggestions':
              'No results found for the entered shortcut.',
            'quick_messages.copilot': 'Copilot description',
            'copilot.name': 'Copilot',
          };
          return translations[key] || key;
        },
      },
      stubs: {
        SuggestionBoxShortcut: {
          template: `
            <div 
              data-testid="suggestion"
              :class="{ 'is-active': isActive }"
              @click="$emit('click', $attrs)"
              @keypress.enter="$emit('keypress', $attrs)"
              @mouseenter="$emit('mouseenter')"
              @focus="$emit('focus')"
            >
              <h2>{{ copilot ? 'Copilot' : '/' + shortcut }}</h2>
              <p>{{ copilot ? 'Copilot description' : description }}</p>
            </div>
          `,
          props: ['shortcut', 'description', 'isActive', 'copilot'],
        },
      },
    },
  });

  return wrapper;
}

describe('SuggestionBox', () => {
  describe('rendering', () => {
    it('should open when user type the trigger', () => {
      const wrapper = createWrapper({
        search: '/',
      });

      expect(wrapper.text()).toContain('/fake-suggestion');
      expect(wrapper.text()).toContain('/other-fake-suggestion');
    });

    it('should not open when user do not typed', () => {
      const wrapper = createWrapper({
        search: '',
      });

      expect(wrapper.text()).toBeFalsy();
    });

    it('should open only when the first typed character is the trigger', () => {
      const wrapper = createWrapper({
        search: '#',
      });

      expect(wrapper.text()).toBeFalsy();
    });

    it('should renders with custom search triggers', () => {
      const wrapper = createWrapper({
        trigger: '@',
        search: '@fake-search',
      });

      expect(wrapper.text()).toContain(
        'No results found for the entered shortcut.',
      );
    });
  });

  describe('search', () => {
    it('should show all suggestions when user types only the trigger', () => {
      const wrapper = createWrapper({
        search: '/',
      });

      suggestions.forEach((suggestion) => {
        expect(wrapper.text()).toContain(`/${suggestion.shortcut}`);
      });
    });

    it('should show all suggestions whose shortcut matches the search', () => {
      const search = 'other';
      const wrapper = createWrapper({
        trigger: '@',
        search: `@${search}`,
      });

      suggestions.forEach((suggestion) => {
        if (suggestion.shortcut.includes(search))
          expect(wrapper.text()).toContain(`/${suggestion.shortcut}`);
        else expect(wrapper.text()).not.toContain(`/${suggestion.shortcut}`);
      });
    });
  });

  describe('selection', () => {
    it('should emit `select` event when user click in the suggestion', async () => {
      const wrapper = createWrapper({
        search: '/',
      });

      const suggestion = wrapper.find('[data-testid="suggestion"]');
      await suggestion.trigger('click');

      expect(wrapper.emitted('select')).toBeTruthy();
    });

    it('should emit select event with correct suggestion data', async () => {
      const wrapper = createWrapper({
        search: '/',
      });

      const suggestion = wrapper.find('[data-testid="suggestion"]');
      await suggestion.trigger('click');

      expect(wrapper.emitted('select')).toBeTruthy();
      expect(wrapper.emitted('select')[0][0]).toHaveProperty('uuid');
    });
  });

  describe('Computed Properties', () => {
    it('should compute isSuggestionBoxOpen correctly when search starts with trigger', () => {
      const wrapper = createWrapper({
        search: '/test',
      });

      expect(wrapper.vm.isSuggestionBoxOpen).toBe(true);
    });

    it('should not open suggestion box when search has whitespace', () => {
      const wrapper = createWrapper({
        search: '/test with space',
      });

      expect(wrapper.vm.isSuggestionBoxOpen).toBe(false);
    });

    it('should compute searchStartsWithTrigger correctly', () => {
      const wrapper = createWrapper({
        search: '/test',
      });

      expect(wrapper.vm.searchStartsWithTrigger).toBe(true);
    });

    it('should compute searchHasWhiteSpaces correctly', () => {
      const wrapper = createWrapper({
        search: '/test with space',
      });

      expect(wrapper.vm.searchHasWhiteSpaces).toBe(true);
    });

    it('should filter suggestions based on search term', () => {
      const wrapper = createWrapper({
        search: '/fake',
      });

      const filtered = wrapper.vm.filteredSuggestions;
      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.some((s) => s.shortcut.includes('fake'))).toBe(true);
    });

    it('should return all suggestions when search is only trigger', () => {
      const wrapper = createWrapper({
        search: '/',
      });

      expect(wrapper.vm.filteredSuggestions.length).toBe(suggestions.length);
    });

    it('should return empty array when no suggestions match', () => {
      const wrapper = createWrapper({
        search: '/nonexistent',
      });

      expect(wrapper.vm.filteredSuggestions.length).toBe(0);
    });
  });

  describe('Keyboard Navigation', () => {
    it('should handle ArrowDown key to navigate down', async () => {
      const wrapper = createWrapper({
        search: '/',
      });

      const keyboardEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      await wrapper.setProps({ keyboardEvent });

      expect(wrapper.vm.activeShortcutIndex).toBe(0);
    });

    it('should handle ArrowUp key to navigate up', async () => {
      const wrapper = createWrapper({
        search: '/',
      });

      await wrapper.setData({ activeShortcutIndex: 1 });
      const keyboardEvent = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      await wrapper.setProps({ keyboardEvent });

      expect(wrapper.vm.activeShortcutIndex).toBe(0);
    });

    it('should wrap to last item when ArrowUp is pressed at first item', async () => {
      const wrapper = createWrapper({
        search: '/',
      });

      await wrapper.setData({ activeShortcutIndex: 0 });
      const keyboardEvent = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      await wrapper.setProps({ keyboardEvent });

      const suggestionsCount = wrapper.vm.filteredSuggestions.length;
      expect(wrapper.vm.activeShortcutIndex).toBe(suggestionsCount - 1);
    });

    it('should wrap to first item when ArrowDown is pressed at last item', async () => {
      const wrapper = createWrapper({
        search: '/',
      });

      const suggestionsCount = wrapper.vm.filteredSuggestions.length;
      await wrapper.setData({ activeShortcutIndex: suggestionsCount - 1 });
      const keyboardEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      await wrapper.setProps({ keyboardEvent });

      expect(wrapper.vm.activeShortcutIndex).toBe(0);
    });

    it('should handle Enter key to select active suggestion', async () => {
      const wrapper = createWrapper({
        search: '/',
      });

      await wrapper.setData({ activeShortcutIndex: 0 });
      const keyboardEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      keyboardEvent.preventDefault = vi.fn();

      await wrapper.setProps({ keyboardEvent });

      expect(wrapper.emitted('select')).toBeTruthy();
      expect(keyboardEvent.preventDefault).toHaveBeenCalled();
    });

    it('should open copilot when Enter is pressed with no active suggestion and copilot enabled', async () => {
      const wrapper = createWrapper({
        search: '/',
        copilot: true,
      });

      await wrapper.setData({ activeShortcutIndex: null });
      const keyboardEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      keyboardEvent.preventDefault = vi.fn();

      await wrapper.setProps({ keyboardEvent });

      expect(wrapper.emitted('open-copilot')).toBeTruthy();
    });

    it('should not handle unknown keys', async () => {
      const wrapper = createWrapper({
        search: '/',
      });

      const keyboardEvent = new KeyboardEvent('keydown', { key: 'Tab' });
      keyboardEvent.preventDefault = vi.fn();

      await wrapper.setProps({ keyboardEvent });

      expect(keyboardEvent.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe('Events', () => {
    it('should emit close event when ESC key is pressed', async () => {
      const wrapper = createWrapper({
        search: '/',
      });

      await wrapper.find('.suggestion-box').trigger('keydown.esc');

      expect(wrapper.emitted('close')).toBeTruthy();
    });

    it('should emit close event when close method is called', () => {
      const wrapper = createWrapper({
        search: '/',
      });

      wrapper.vm.close();

      expect(wrapper.emitted('close')).toBeTruthy();
    });

    it('should emit open event when suggestion box opens', async () => {
      const wrapper = createWrapper({
        search: '',
      });

      await wrapper.setProps({ search: '/' });

      expect(wrapper.emitted('open')).toBeTruthy();
    });

    it('should emit close event when suggestion box closes', async () => {
      const wrapper = createWrapper({
        search: '/',
      });

      await wrapper.setProps({ search: '' });

      expect(wrapper.emitted('close')).toBeTruthy();
    });
  });

  describe('Copilot', () => {
    it('should render copilot shortcut when copilot prop is true', () => {
      const wrapper = createWrapper({
        search: '/',
        copilot: true,
      });

      const copilotShortcut = wrapper.findAll('[data-testid="suggestion"]');
      expect(copilotShortcut.length).toBeGreaterThan(0);
    });

    it('should emit open-copilot event when copilot is clicked', async () => {
      const wrapper = createWrapper({
        search: '/',
        copilot: true,
      });

      wrapper.vm.openCopilot();

      expect(wrapper.emitted('open-copilot')).toBeTruthy();
    });

    it('should set activeShortcutIndex to null when copilot is enabled and search is only trigger', async () => {
      const wrapper = createWrapper({
        search: '/test',
        copilot: true,
      });

      await wrapper.setData({ activeShortcutIndex: 1 });
      await wrapper.vm.$nextTick();

      // Change search to only trigger, which should trigger the watcher
      await wrapper.setProps({ search: '/' });
      await wrapper.vm.$nextTick();

      // When copilot is true and search is only '/', activeShortcutIndex should be null
      // The watcher checks: if (!this.copilot || searchHasValue) reset, else null
      // searchHasValue = !!newSearch.replace('/', '') = !!'' = false
      // So: if (!true || false) = if (false || false) = false, so else: null
      expect(wrapper.vm.activeShortcutIndex).toBeNull();
    });
  });

  describe('Mouse Navigation', () => {
    it('should update activeShortcutIndex on mouseenter', async () => {
      const wrapper = createWrapper({
        search: '/',
      });

      const suggestions = wrapper.findAll('[data-testid="suggestion"]');
      if (suggestions.length > 0) {
        await suggestions[1].trigger('mouseenter');

        expect(wrapper.vm.activeShortcutIndex).toBe(1);
      }
    });

    it('should update activeShortcutIndex on focus', async () => {
      const wrapper = createWrapper({
        search: '/',
      });

      const suggestions = wrapper.findAll('[data-testid="suggestion"]');
      if (suggestions.length > 0) {
        await suggestions[0].trigger('focus');

        expect(wrapper.vm.activeShortcutIndex).toBe(0);
      }
    });
  });

  describe('No Suggestions Message', () => {
    it('should display no suggestions message when filteredSuggestions is empty', () => {
      const wrapper = createWrapper({
        search: '/nonexistent',
      });

      expect(wrapper.find('.suggestion-box__no-suggestions').exists()).toBe(
        true,
      );
      expect(wrapper.text()).toContain(
        'No results found for the entered shortcut.',
      );
    });

    it('should not display no suggestions message when there are filtered suggestions', () => {
      const wrapper = createWrapper({
        search: '/',
      });

      expect(wrapper.find('.suggestion-box__no-suggestions').exists()).toBe(
        false,
      );
    });
  });

  describe('Methods', () => {
    it('should reset activeShortcutIndex to 0', () => {
      const wrapper = createWrapper({
        search: '/',
      });

      wrapper.vm.resetActiveShortcutIndex();

      expect(wrapper.vm.activeShortcutIndex).toBe(0);
    });

    it('should correctly check if activeShortcutIndex is defined', () => {
      const wrapper = createWrapper({
        search: '/',
      });

      wrapper.vm.activeShortcutIndex = 0;
      expect(wrapper.vm.isActiveShortcutIndexDefined()).toBe(true);

      wrapper.vm.activeShortcutIndex = -1;
      expect(wrapper.vm.isActiveShortcutIndexDefined()).toBe(false);
    });
  });

  describe('Search Watcher', () => {
    it('should reset activeShortcutIndex when search changes and has value', async () => {
      const wrapper = createWrapper({
        search: '/',
      });

      await wrapper.setData({ activeShortcutIndex: 2 });
      await wrapper.setProps({ search: '/new' });

      expect(wrapper.vm.activeShortcutIndex).toBe(0);
    });

    it('should set activeShortcutIndex to null when copilot is enabled and search is only trigger', async () => {
      const wrapper = createWrapper({
        search: '/test',
        copilot: true,
      });

      await wrapper.setData({ activeShortcutIndex: 1 });
      await wrapper.setProps({ search: '/' });

      expect(wrapper.vm.activeShortcutIndex).toBeNull();
    });
  });
});
