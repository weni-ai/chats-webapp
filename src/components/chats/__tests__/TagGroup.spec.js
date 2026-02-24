import { unnnicTag } from '@weni/unnnic-system';
import { mount } from '@vue/test-utils';
import TagGroup from '@/components/TagGroup.vue';
import { expect } from 'vitest';

function createWrapper(props = {}) {
  return mount(TagGroup, {
    props: {
      tags: [],
      ...props,
    },
  });
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
    const tagComponents = wrapper.findAllComponents(unnnicTag);

    expect(tagComponents.length).toBe(0);
  });

  it('should be able to select tags when `selectable` prop is passed', async () => {
    const wrapper = createWrapper({
      tags,
      selectable: true,
    });

    await wrapper.find('[data-testid="tag__doubts"]').trigger('click');
    await wrapper.find('[data-testid="tag__finance"]').trigger('click');

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
    await wrapper.find('[data-testid="tag__finance"]').trigger('click');
    await wrapper.find('[data-testid="tag__doubts"]').trigger('click');

    expect(wrapper.emitted('update:modelValue').length).toBe(3);
  });

  it('should emit close with tag', async () => {
    const wrapper = createWrapper({ tags });
    const unnnicTags = wrapper.findAllComponents({ name: 'UnnnicTag' });
    await unnnicTags[0].vm.$emit('close');

    expect(wrapper.emitted('close')[0][0]).toEqual(tags[0]);
  });

  describe('emits add and remove', () => {
    it('should emit add when selecting a tag', async () => {
      const wrapper = createWrapper({ tags, selectable: true });

      await wrapper.find('[data-testid="tag__finance"]').trigger('click');

      expect(wrapper.emitted('add')).toBeTruthy();
      expect(wrapper.emitted('add')[0][0]).toEqual(tags[0]);
    });

    it('should emit remove when deselecting a selected tag', async () => {
      const wrapper = createWrapper({
        tags,
        selectable: true,
        modelValue: [tags[0]],
      });

      await wrapper.find('[data-testid="tag__finance"]').trigger('click');

      expect(wrapper.emitted('remove')).toBeTruthy();
      expect(wrapper.emitted('remove')[0][0]).toEqual(tags[0]);
    });
  });

  describe('disabledTag prop', () => {
    it('should emit close when clicking a tag and disabledTag is true', async () => {
      const wrapper = createWrapper({
        tags,
        selectable: true,
        disabledTag: true,
      });

      await wrapper.find('[data-testid="tag__finance"]').trigger('click');

      expect(wrapper.emitted('close')).toBeTruthy();
      expect(wrapper.emitted('close')[0][0]).toEqual(tags[0]);
      expect(wrapper.emitted('add')).toBeFalsy();
    });
  });

  describe('useCloseClick prop', () => {
    it('should call close on tag click when useCloseClick is true', async () => {
      const wrapper = createWrapper({
        tags,
        useCloseClick: true,
      });

      await wrapper.find('[data-testid="tag__finance"]').trigger('click');

      expect(wrapper.emitted('close')).toBeTruthy();
      expect(wrapper.emitted('close')[0][0]).toEqual(tags[0]);
    });
  });

  describe('close method', () => {
    it('should emit close and run select when selectable and close is triggered', async () => {
      const wrapper = createWrapper({
        tags,
        selectable: true,
        modelValue: [tags[0]],
      });

      const unnnicTags = wrapper.findAllComponents({ name: 'UnnnicTag' });
      await unnnicTags[0].vm.$emit('close');

      expect(wrapper.emitted('close')).toBeTruthy();
      expect(wrapper.emitted('remove')).toBeTruthy();
    });
  });

  describe('selected state and showCloseIcon', () => {
    it('should apply selected class when tag is in modelValue', async () => {
      const wrapper = createWrapper({
        tags,
        selectable: true,
        modelValue: [tags[1]],
      });

      await wrapper.vm.$nextTick();

      const unnnicTags = wrapper.findAllComponents({ name: 'UnnnicTag' });
      const doubtsTag = unnnicTags.find((c) => c.props('text') === 'Dúvidas');
      expect(doubtsTag?.classes()).toContain('tag-group__tags__tag--selected');
    });

    it('should show close icon when hasCloseIcon is true', () => {
      const wrapper = createWrapper({
        tags,
        hasCloseIcon: true,
      });

      const unnnicTags = wrapper.findAllComponents({ name: 'UnnnicTag' });
      unnnicTags.forEach((tag) => {
        expect(tag.props('hasCloseIcon')).toBe(true);
      });
    });

    it('should show close icon when selectable and tag is selected', () => {
      const wrapper = createWrapper({
        tags,
        selectable: true,
        modelValue: [tags[0]],
      });

      const unnnicTags = wrapper.findAllComponents({ name: 'UnnnicTag' });
      const financeTag = unnnicTags.find(
        (c) => c.props('text') === 'Financeiro',
      );
      expect(financeTag?.props('hasCloseIcon')).toBe(true);
    });
  });

  describe('flex prop', () => {
    it('should add flex class when flex is true', () => {
      const wrapper = createWrapper({ tags, flex: true });

      expect(wrapper.find('.tag-group').classes()).toContain('flex');
    });

    it('should not add flex class when flex is false', () => {
      const wrapper = createWrapper({ tags, flex: false });

      expect(wrapper.find('.tag-group').classes()).not.toContain('flex');
    });
  });

  describe('computed selected', () => {
    it('should get selected from modelValue', () => {
      const wrapper = createWrapper({
        tags,
        modelValue: [tags[0]],
      });

      expect(wrapper.vm.selected).toEqual([tags[0]]);
    });

    it('should emit update:modelValue when selected setter is called', async () => {
      const wrapper = createWrapper({ tags });

      wrapper.vm.selected = [tags[0]];
      await wrapper.vm.$nextTick();

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')[0][0]).toEqual([tags[0]]);
    });
  });

  describe('isSelectedTag and showCloseIcon methods', () => {
    it('isSelectedTag returns truthy when tag is in selected', () => {
      const wrapper = createWrapper({
        tags,
        modelValue: [tags[0]],
      });

      expect(wrapper.vm.isSelectedTag(tags[0])).toBeTruthy();
      expect(wrapper.vm.isSelectedTag(tags[1])).toBeFalsy();
    });

    it('showCloseIcon returns true when hasCloseIcon is true', () => {
      const wrapper = createWrapper({ tags, hasCloseIcon: true });

      expect(wrapper.vm.showCloseIcon(tags[0])).toBe(true);
    });

    it('showCloseIcon returns truthy when selectable and tag is selected', () => {
      const wrapper = createWrapper({
        tags,
        selectable: true,
        modelValue: [tags[0]],
      });

      expect(wrapper.vm.showCloseIcon(tags[0])).toBeTruthy();
      expect(wrapper.vm.showCloseIcon(tags[1])).toBeFalsy();
    });
  });
});
