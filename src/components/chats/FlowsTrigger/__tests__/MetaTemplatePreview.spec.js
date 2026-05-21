import { mount, config } from '@vue/test-utils';
import { expect, describe, it, beforeAll, afterAll, beforeEach } from 'vitest';

import MetaTemplatePreview from '../MetaTemplatePreview.vue';

let savedGlobalMocks;

beforeAll(() => {
  savedGlobalMocks = { ...config.global.mocks };
  config.global.mocks = {};
});

afterAll(() => {
  config.global.mocks = savedGlobalMocks;
});

const baseTemplate = {
  name: 'template_test',
  components: [
    {
      type: 'HEADER',
      format: 'TEXT',
      text: 'Your style, your next inspiration',
    },
    {
      type: 'BODY',
      text: 'Hi {{1}}, your order #{{2}} from our {{3}} collection is ready',
    },
    {
      type: 'FOOTER',
      text: 'Weni by VTEX',
    },
    {
      type: 'BUTTONS',
      buttons: [
        { type: 'QUICK_REPLY', text: 'Unsubscribe' },
        { type: 'URL', text: 'Shop now', url: 'https://example.com' },
      ],
    },
  ],
};

describe('MetaTemplatePreview', () => {
  let wrapper;

  const buildWrapper = (props = {}) =>
    mount(MetaTemplatePreview, {
      props: {
        template: baseTemplate,
        variables: ['contactName', 'orderNumber', 'collection'],
        variableValues: {},
        ...props,
      },
      global: {
        components: {
          UnnnicToolTip: config.global.stubs.UnnnicToolTip,
        },
      },
    });

  beforeEach(() => {
    wrapper = buildWrapper();
  });

  it('renders preview title with template name', () => {
    const title = wrapper.find('[data-testid="meta-template-preview-title"]');
    expect(title.text()).toContain('template_test');
  });

  it('renders header and footer texts', () => {
    expect(
      wrapper.find('[data-testid="meta-template-preview-header"]').text(),
    ).toBe('Your style, your next inspiration');

    expect(
      wrapper.find('[data-testid="meta-template-preview-footer"]').text(),
    ).toBe('Weni by VTEX');
  });

  it('renders unfilled variables as {{n}} placeholders', () => {
    const variables = wrapper.findAll(
      '[data-testid="meta-template-preview-variable"]',
    );
    expect(variables).toHaveLength(3);
    expect(variables[0].text()).toBe('{{1}}');
    expect(variables[1].text()).toBe('{{2}}');
    expect(variables[2].text()).toBe('{{3}}');
  });

  it('renders buttons with mapped icons', () => {
    const buttons = wrapper.findAll(
      '[data-testid="meta-template-preview-button"]',
    );
    expect(buttons).toHaveLength(2);
    expect(buttons[0].text()).toContain('Unsubscribe');
    expect(buttons[1].text()).toContain('Shop now');
  });

  it('wraps each variable with an UnnnicToolTip showing its label', () => {
    const tooltips = wrapper.findAllComponents({ name: 'UnnnicToolTipStub' });
    expect(tooltips).toHaveLength(3);
    expect(tooltips[0].props('text')).toBe('Variable {{1}}');
    expect(tooltips[1].props('text')).toBe('Variable {{2}}');
    expect(tooltips[2].props('text')).toBe('Variable {{3}}');
  });

  it('appends the typed value to the tooltip label when the variable is filled', async () => {
    await wrapper.setProps({
      variableValues: {
        contactName: 'Marcus',
        orderNumber: '12345',
      },
    });

    const tooltips = wrapper.findAllComponents({ name: 'UnnnicToolTipStub' });
    expect(tooltips[0].props('text')).toBe('Variable {{1}} | Marcus');
    expect(tooltips[1].props('text')).toBe('Variable {{2}} | 12345');
    expect(tooltips[2].props('text')).toBe('Variable {{3}}');
  });

  it('ignores whitespace-only values when composing the tooltip', async () => {
    await wrapper.setProps({
      variableValues: {
        contactName: '   ',
      },
    });

    const tooltips = wrapper.findAllComponents({ name: 'UnnnicToolTipStub' });
    expect(tooltips[0].props('text')).toBe('Variable {{1}}');
  });

  it('strips html comments from body before parsing variables', () => {
    const wrapperWithComments = buildWrapper({
      template: {
        ...baseTemplate,
        components: [
          {
            type: 'BODY',
            text: 'Hello {<!-- -->{1}}, this is {<!-- -->{2}}',
          },
        ],
      },
      variables: ['nameA', 'nameB'],
      variableValues: { nameA: 'Alice', nameB: 'Bob' },
    });

    const variables = wrapperWithComments.findAll(
      '[data-testid="meta-template-preview-variable"]',
    );
    expect(variables).toHaveLength(2);
    expect(variables[0].text()).toBe('Alice');
    expect(variables[1].text()).toBe('Bob');
  });

  it('renders gracefully when template is empty', () => {
    const emptyWrapper = mount(MetaTemplatePreview, {
      props: {
        template: {},
        variables: [],
        variableValues: {},
      },
    });

    expect(
      emptyWrapper.find('[data-testid="meta-template-preview"]').exists(),
    ).toBe(true);
    expect(
      emptyWrapper.find('[data-testid="meta-template-preview-body"]').exists(),
    ).toBe(false);
  });
});
