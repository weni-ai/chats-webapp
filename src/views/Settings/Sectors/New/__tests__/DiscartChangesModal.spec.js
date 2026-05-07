import { beforeEach, describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import DiscartChangesModal from '@/views/Settings/DiscartChangesModal.vue';

import { useCompositionI18nInThisSpecFile } from '@/utils/test/compositionI18nVitest';

const createWrapper = () => {
  return mount(DiscartChangesModal, {
    props: { modelValue: true, title: 'Title', text: 'Text' },
  });
};

describe('DiscartChangesModal.vue', () => {
  useCompositionI18nInThisSpecFile();

  let wrapper;

  beforeEach(() => {
    wrapper = createWrapper();
  });

  it('should have correct text prop', () => {
    expect(wrapper.props('text')).toBe('Text');
  });

  it('to match snapshot', () => {
    expect(wrapper.html()).toMatchSnapshot();
  });
});
