import { describe, it, expect, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import ProductListSections from '../ProductListSections.vue';

const sections = [
  {
    title: 'TV 32',
    items: [
      {
        product_retailer_id: 'tv-32-1',
        name: 'Smart TV 32"',
        price: 1099,
        currency: 'BRL',
        image: 'https://example.com/tv32.png',
      },
    ],
  },
  {
    title: 'TV 50',
    items: [
      {
        product_retailer_id: 'tv-50-1',
        name: 'Smart TV 50"',
        price: 2299,
        currency: 'BRL',
        image: 'https://example.com/tv50.png',
      },
    ],
  },
];

const createWrapper = (props = {}) =>
  mount(ProductListSections, {
    props: {
      sections,
      getQuantity: () => 0,
      ...props,
    },
    global: {
      stubs: {
        ProductCarousel: {
          name: 'ProductCarousel',
          template: '<div data-testid="product-carousel" />',
          props: ['products', 'getQuantity', 'dismissedIds'],
          emits: ['add', 'remove', 'increment', 'decrement'],
        },
      },
    },
  });

describe('ProductListSections', () => {
  let wrapper;

  afterEach(() => {
    wrapper?.unmount();
  });

  it('renders header and section titles', () => {
    wrapper = createWrapper({ header: 'TV selection' });

    expect(
      wrapper.find('[data-testid="product-list-sections-header"]').text(),
    ).toBe('TV selection');
    expect(
      wrapper
        .findAll('[data-testid="product-list-section-title"]')
        .map((node) => node.text()),
    ).toEqual(['TV 32', 'TV 50']);
  });

  it('renders one carousel per section', () => {
    wrapper = createWrapper();

    expect(wrapper.findAll('[data-testid="product-carousel"]')).toHaveLength(2);
  });

  it('forwards add events from carousel', async () => {
    wrapper = createWrapper();

    const carousel = wrapper.findComponent({ name: 'ProductCarousel' });
    await carousel.vm.$emit('add', sections[0].items[0]);

    expect(wrapper.emitted('add')?.[0]).toEqual([sections[0].items[0]]);
  });
});
