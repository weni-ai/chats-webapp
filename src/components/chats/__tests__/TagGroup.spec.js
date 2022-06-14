import { unnnicTag } from '@weni/unnnic-system';

import { mount } from '@vue/test-utils';
import TagGroup from '../TagGroup';

function createWrapper(props) {
  const wrapper = mount(TagGroup, {
    propsData: props,
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

  it('should not render when `tags` prop is not passed', () => {
    const wrapper = createWrapper();

    expect(wrapper.html()).toBeFalsy();
  });

  it('should be able to select tags when `selectable` prop is passed', async () => {
    const tags = [
      { value: 'finance', text: 'Financeiro' },
      { value: 'doubts', text: 'Dúvidas' },
      { value: 'help', text: 'Ajuda' },
    ];
    const wrapper = createWrapper({
      tags,
      selectable: true,
    });

    await wrapper.findComponent('[data-testid="tag__doubts"]').trigger('click');
    await wrapper.findComponent('[data-testid="tag__finance"]').trigger('click');
    const emittedInputEvent = wrapper.emitted('input').flat(Infinity);

    expect(emittedInputEvent.length).toBe(2);
    expect(emittedInputEvent.find((e) => e.value === 'doubts')).toBeTruthy();
    expect(emittedInputEvent.find((e) => e.value === 'finance')).toBeTruthy();
  });

  it('should unselect the tag when the clicked tag is already selected', async () => {
    const wrapper = createWrapper({
      tags: [
        { value: 'finance', text: 'Financeiro' },
        { value: 'doubts', text: 'Dúvidas' },
        { value: 'help', text: 'Ajuda' },
      ],
      selectable: true,
    });

    await wrapper.get('[data-testid="tag__doubts"]').trigger('click');
    await wrapper.findComponent('[data-testid="tag__finance"]').trigger('click');
    await wrapper.findComponent('[data-testid="tag__doubts"]').trigger('click');

    expect(wrapper.emitted('input').length).toBe(3);
  });
});
