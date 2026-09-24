import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { mount, config } from '@vue/test-utils';
import AiFeedbackModal from '../AiFeedbackModal.vue';
import i18n from '@/plugins/i18n';

beforeAll(() => {
  config.global.plugins = (config.global.plugins || []).filter(
    (plugin) => plugin !== i18n,
  );
});

afterAll(() => {
  if (config.global.plugins && !config.global.plugins.includes(i18n)) {
    config.global.plugins.push(i18n);
  }
});

const tags = [
  { uuid: 'incorrect_answer', name: 'Incorrect answer' },
  { uuid: 'incomplete_answer', name: 'Incomplete answer' },
];

const createWrapper = (props = {}) =>
  mount(AiFeedbackModal, {
    props: {
      modelValue: true,
      tags,
      ...props,
    },
    global: {
      mocks: {
        $t: (key) => key,
      },
      stubs: {
        UnnnicDialog: {
          name: 'UnnnicDialog',
          props: ['open'],
          template: '<div data-testid="ai-feedback-modal"><slot /></div>',
        },
        UnnnicDialogContent: { template: '<div><slot /></div>' },
        UnnnicDialogHeader: { template: '<div><slot /></div>' },
        UnnnicDialogTitle: { template: '<h1><slot /></h1>' },
        UnnnicDialogFooter: { template: '<div><slot /></div>' },
        UnnnicButton: {
          name: 'UnnnicButton',
          props: ['text', 'type', 'disabled', 'loading'],
          template:
            '<button :data-testid="$attrs[\'data-testid\']" :disabled="disabled" @click="$emit(\'click\')">{{ text }}</button>',
          inheritAttrs: false,
        },
        UnnnicTextArea: {
          name: 'UnnnicTextArea',
          props: ['modelValue', 'placeholder', 'label', 'maxLength'],
          template: `
            <textarea
              data-testid="ai-feedback-modal-textarea"
              :value="modelValue"
              @input="$emit('update:modelValue', $event.target.value)"
            />
          `,
        },
        UnnnicSkeletonLoading: {
          name: 'UnnnicSkeletonLoading',
          template: '<div class="skeleton-stub" />',
        },
        UnnnicTag: {
          name: 'UnnnicTag',
          props: ['text', 'clickable', 'disabled'],
          template:
            '<button :data-testid="$attrs[\'data-testid\']" @click="$emit(\'click\')">{{ text }}</button>',
          inheritAttrs: false,
        },
      },
    },
  });

describe('AiFeedbackModal', () => {
  let wrapper;

  afterEach(() => {
    wrapper?.unmount();
  });

  it('renders the title and tags', () => {
    wrapper = createWrapper();

    expect(wrapper.find('[data-testid="ai-feedback-modal"]').exists()).toBe(
      true,
    );
    expect(wrapper.text()).toContain(
      'contact_info.desk_copilot.feedback.title',
    );
    expect(wrapper.find('[data-testid="tag__incorrect_answer"]').text()).toBe(
      'Incorrect answer',
    );
    expect(wrapper.find('[data-testid="tag__incomplete_answer"]').text()).toBe(
      'Incomplete answer',
    );
  });

  it('disables submit when there is no tag and no text', () => {
    wrapper = createWrapper();

    expect(
      wrapper
        .find('[data-testid="ai-feedback-modal-submit"]')
        .attributes('disabled'),
    ).toBeDefined();
  });

  it('emits submit with selected tags and text', async () => {
    wrapper = createWrapper();

    await wrapper
      .find('[data-testid="tag__incorrect_answer"]')
      .trigger('click');
    await wrapper
      .find('[data-testid="ai-feedback-modal-textarea"]')
      .setValue('Needs more detail');
    await wrapper
      .find('[data-testid="ai-feedback-modal-submit"]')
      .trigger('click');

    expect(wrapper.emitted('submit')?.[0]).toEqual([
      {
        tags: ['incorrect_answer'],
        text: 'Needs more detail',
      },
    ]);
  });

  it('emits cancel when the cancel button is clicked', async () => {
    wrapper = createWrapper();

    await wrapper
      .find('[data-testid="ai-feedback-modal-cancel"]')
      .trigger('click');

    expect(wrapper.emitted('cancel')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false]);
  });

  it('shows skeletons while tags are loading', () => {
    wrapper = createWrapper({ isLoadingTags: true });

    expect(
      wrapper.find('[data-testid="ai-feedback-modal-tags-loading"]').exists(),
    ).toBe(true);
    expect(wrapper.find('[data-testid="tag__incorrect_answer"]').exists()).toBe(
      false,
    );
  });
});
