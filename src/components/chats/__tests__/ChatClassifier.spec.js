import { mount } from '@vue/test-utils';
import { describe, it, expect, beforeEach } from 'vitest';
import { createTestingPinia } from '@pinia/testing';

import ChatClassifier from '../ChatClassifier.vue';

const tags = [
  { uuid: 'tag1', name: 'Tag 1' },
  { uuid: 'tag2', name: 'Tag 2' },
];

const modelValue = [{ uuid: 'tag1', name: 'Tag 1' }];

const createWrapper = (props = {}) => {
  return mount(ChatClassifier, {
    props: {
      tags,
      loading: false,
      ...props,
    },
    global: {
      plugins: [createTestingPinia()],
      stubs: {
        ChatClassifierLoading: true,
        TagGroup: true,
      },
    },
  });
};

describe('ChatClassifier.vue', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = createWrapper();
  });

  it('renders ChatClassifierLoading when loading is true', async () => {
    await wrapper.setProps({ loading: true });

    const loadingComponent = wrapper.findComponent(
      '[data-testid="chat-classifier-loading"]',
    );
    expect(loadingComponent.exists()).toBe(true);

    const tagGroupComponent = wrapper.findComponent(
      '[data-testid="tag-group"]',
    );
    expect(tagGroupComponent.exists()).toBe(false);
  });

  it('renders TagGroup when loading is false', () => {
    const tagGroupComponent = wrapper.findComponent(
      '[data-testid="tag-group"]',
    );
    expect(tagGroupComponent.exists()).toBe(true);

    const loadingComponent = wrapper.findComponent(
      '[data-testid="chat-classifier-loading"]',
    );
    expect(loadingComponent.exists()).toBe(false);
  });

  it('passes tags to TagGroup correctly', () => {
    const tagGroupComponent = wrapper.findComponent(
      '[data-testid="tag-group"]',
    );
    expect(tagGroupComponent.props('tags')).toEqual(tags);
  });

  it('binds the modelValue to TagGroup using v-model', async () => {
    await wrapper.setProps({ modelValue });
    const tagGroupComponent = wrapper.findComponent(
      '[data-testid="tag-group"]',
    );
    expect(tagGroupComponent.props('modelValue')).toEqual(modelValue);
  });

  it('emits update:modelValue event when selected changes', async () => {
    const newSelectedTags = [{ uuid: 'tag2', name: 'Tag 2' }];
    const tagGroupComponent = wrapper.findComponent(
      '[data-testid="tag-group"]',
    );

    await tagGroupComponent.vm.$emit('update:modelValue', newSelectedTags);

    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')[0][0]).toEqual(newSelectedTags);
  });
});
