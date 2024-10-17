import { mount } from '@vue/test-utils';
import { describe, it, expect, beforeEach } from 'vitest';

import TagFilter from '../TagFilter.vue';

const tags = [
  { uuid: 'tag1', name: 'Tag 1' },
  { uuid: 'tag2', name: 'Tag 2' },
];

const createWrapper = (props = {}) => {
  return mount(TagFilter, {
    props: { tags, label: 'Test Label', ...props },
    global: { stubs: { UnnnicCheckbox: true } },
  });
};

describe('TagFilter.vue', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = createWrapper();
  });

  it('renders the label when provided', () => {
    const label = wrapper.find('[data-testid="tag-filter-label"]');
    expect(label.exists()).toBe(true);
    expect(label.text()).toBe('Test Label');
  });

  it('does not render the label when not provided', async () => {
    await wrapper.setProps({ label: '' });
    const label = wrapper.find('[data-testid="tag-filter-label"]');
    expect(label.exists()).toBe(false);
  });

  it('renders the correct number of tags', () => {
    const tagElements = wrapper.findAll('.tags > span');
    expect(tagElements.length).toBe(tags.length);
  });

  it('emits "input" event with updated selected tags when a tag is selected', async () => {
    const tagElement = wrapper.findAll('.tags > span').at(0);

    await tagElement.trigger('click');

    expect(wrapper.emitted('input')).toBeTruthy();
    expect(wrapper.emitted('input')[0][0]).toEqual(['tag1']);
  });

  it('emits "input" event with updated selected tags when a tag is unselected', async () => {
    await wrapper.setProps({ value: ['tag1'] });
    const tagElement = wrapper.findAll('.tags > span').at(0);

    await tagElement.trigger('click');

    expect(wrapper.emitted('input')).toBeTruthy();
    expect(wrapper.emitted('input')[0][0]).toEqual([]);
  });
});
