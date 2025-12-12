import { mount } from '@vue/test-utils';

import SuggestionBox from '../SuggestionBox.vue';

const suggestions = [
  {
    id: 1,
    title: 'Fake Suggestion',
    shortcut: 'fake-suggestion',
    message: 'This is a fake suggestion',
  },
  {
    id: 2,
    title: 'Other Fake Suggestion',
    shortcut: 'other-fake-suggestion',
    message: 'This is another fake suggestion',
  },
];

function createWrapper(props = {}) {
  const wrapper = mount(SuggestionBox, {
    props: {
      suggestions,
      ...props,
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

      expect(wrapper.text()).toContain(
        '/fake-suggestion/other-fake-suggestion',
      );
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
  });
});
