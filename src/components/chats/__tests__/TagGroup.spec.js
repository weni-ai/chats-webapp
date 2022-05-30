import { unnnicTag } from '@weni/unnnic-system';

import { mount } from '@vue/test-utils';
import TagGroup from '../TagGroup';

function createWrapper({ tags }) {
  const wrapper = mount(TagGroup, {
    propsData: {
      tags,
    },
    stubs: {
      unnnicTag,
    },
  });

  return wrapper;
}

describe('TagGroup', () => {
  it('should renders all the tags passed in `tags` prop', () => {
    const wrapper = createWrapper({
      tags: [
        { value: 'finance', text: 'Financeiro' },
        { value: 'doubts', text: 'Dúvidas' },
        { value: 'help', text: 'Ajuda' },
      ],
    });

    expect(wrapper.html()).toContain('Financeiro');
    expect(wrapper.html()).toContain('Dúvidas');
    expect(wrapper.html()).toContain('Ajuda');
  });
});
