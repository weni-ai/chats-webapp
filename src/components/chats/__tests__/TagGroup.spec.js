import { unnnicTag } from '@weni/unnnic-system';
import { mount } from '@vue/test-utils';
import TagGroup from '@/components/TagGroup.vue';
import { expect, vi } from 'vitest';

function createWrapper(props) {
  const wrapper = mount(TagGroup, {
    props,
  });

  return wrapper;
}

const tags = [
  { uuid: 'finance', name: 'Financeiro' },
  { uuid: 'doubts', name: 'Dúvidas' },
  { uuid: 'help', name: 'Ajuda' },
];

describe('TagGroup', () => {
  it('should renders all the tags passed in `tags` prop', () => {
    const wrapper = createWrapper({
      tags,
    });

    expect(wrapper.html()).toContain('Financeiro');
    expect(wrapper.html()).toContain('Dúvidas');
    expect(wrapper.html()).toContain('Ajuda');
  });

  it('should return an array with the tag names', () => {
    const wrapper = createWrapper({ tags });
    wrapper.vm.tagNames.forEach((tagName) => {
      expect(['Financeiro', 'Dúvidas', 'Ajuda'].includes(tagName)).toBe(true);
    });
  });

  it('should emit close on UnnnicTag have emitted close', async () => {
    const wrapper = createWrapper({
      tags,
    });

    const unnnicTags = wrapper.findAllComponents({ name: 'UnnnicTag' });

    await unnnicTags[0].vm.$emit('close');

    expect(wrapper.emitted().close).toBeTruthy();
    expect(wrapper.emitted().close[0][0]).toEqual(tags[0]);
  });

  it('should not render when `tags` prop is not passed', () => {
    const wrapper = createWrapper();
    const tags = wrapper.findAllComponents(unnnicTag);

    expect(tags.length).toBe(0);
  });

  it('should be able to select tags when `selectable` prop is passed', async () => {
    const wrapper = createWrapper({
      tags,
      selectable: true,
    });

    await wrapper.findComponent('[data-testid="tag__doubts"]').trigger('click');
    await wrapper
      .findComponent('[data-testid="tag__finance"]')
      .trigger('click');

    const emittedInputEvent = wrapper
      .emitted('update:modelValue')
      .flat(Infinity);

    expect(emittedInputEvent.length).toBe(2);
    expect(emittedInputEvent.find((e) => e.uuid === 'doubts')).toBeTruthy();
    expect(emittedInputEvent.find((e) => e.uuid === 'finance')).toBeTruthy();
  });

  it('should unselect the tag when the clicked tag is already selected', async () => {
    const wrapper = createWrapper({
      tags,
      selectable: true,
    });

    await wrapper.get('[data-testid="tag__doubts"]').trigger('click');
    await wrapper
      .findComponent('[data-testid="tag__finance"]')
      .trigger('click');
    await wrapper.findComponent('[data-testid="tag__doubts"]').trigger('click');

    expect(wrapper.emitted('update:modelValue').length).toBe(3);
  });

  it('should emit close with tag', async () => {
    const wrapper = createWrapper({ tags });
    const tag = wrapper.findComponent('[data-testid="tag__finance"]');
    await tag.vm.$emit('close');

    expect(wrapper.emitted('close')[0][0]).toEqual(tags[0]);
  });
});
