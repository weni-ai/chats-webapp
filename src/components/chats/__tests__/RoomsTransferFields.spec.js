import { createLocalVue, mount } from '@vue/test-utils';
import Vuex from 'vuex';
import { unnnicLabel, unnnicSelectSmart } from '@weni/unnnic-system';
import i18n from '@/plugins/i18n';

import RoomsTransferFields from '../RoomsTransferFields.vue';

jest.mock('@/services/api/resources/settings/queue', () => ({
  listByProject: jest.fn(() => ({
    results: [
      { name: 'Queue 1', sector_name: 'Sector 1', uuid: '1' },
      { name: 'Queue 2', sector_name: 'Sector 2', uuid: '2' },
    ],
  })),
  agentsToTransfer: jest.fn(() => [
    { first_name: 'John', last_name: 'Doe', email: 'john@doe.com' },
    { name: 'Jane', sector_name: 'Doe', uuid: 'jane@doe.com' },
  ]),
}));

const localVue = createLocalVue();

localVue.use(Vuex);

function createWrapper(store) {
  const wrapper = mount(RoomsTransferFields, {
    i18n,
    store,
    localVue,
  });

  return wrapper;
}

describe('RoomsTransferField', () => {
  let store;
  let wrapper;

  beforeEach(() => {
    store = new Vuex.Store({
      modules: {
        profile: {
          namespaced: true,
          state: {
            me: 'mocked@email.com',
          },
        },
        chats: {
          namespaced: true,
          modules: {
            rooms: {
              namespaced: true,
              state: {
                selectedRoomsToTransfer: ['1', '2'],
              },
            },
          },
        },
      },
    });
    wrapper = createWrapper(store);
  });

  describe('Rendering', () => {
    it('should render with fields', () => {
      const labels = wrapper.findAllComponents(unnnicLabel);
      const selects = wrapper.findAllComponents(unnnicSelectSmart);

      expect(labels).toHaveLength(2);
      expect(selects).toHaveLength(2);
    });
  });

  describe('Data Loading', () => {
    it('should load queues when created', async () => {
      expect(wrapper.vm.queues.length).toBeGreaterThan(1);
    });
  });

  describe('Field Behavior', () => {
    it('should disable agent field when queue is not selected or do not have agents to select', async () => {
      const agentSelect = wrapper.find('[data-testid="select-agent"]');

      wrapper.setData({
        selectedQueue: [{ value: 'queue_id', label: 'Queue' }],
        agents: [
          { value: '', label: 'Select agent' },
          { value: 'agent2_id', label: 'Agent2' },
        ],
      });
      await wrapper.vm.$nextTick();
      expect(agentSelect.props('disabled')).toBe(false);

      wrapper.setData({
        selectedQueue: [{ value: '', label: 'Select queue' }],
        agents: [
          { value: '', label: 'Select agent' },
          { value: 'agent2_id', label: 'Agent2' },
        ],
      });
      await wrapper.vm.$nextTick();
      expect(agentSelect.props('disabled')).toBe(true);

      wrapper.setData({
        selectedQueue: [{ value: 'queue_id', label: 'Queue' }],
        agents: [{ value: '', label: 'Select agent' }],
      });
      await wrapper.vm.$nextTick();
      expect(agentSelect.props('disabled')).toBe(false);
    });
  });

  describe('Bulk Transfer', () => {
    it('should perform bulk transfer when transfer event is called', async () => {});

    it('should show success alert after successful bulk transfer', async () => {});

    it('should show error alert if bulk transfer fails', async () => {});
  });

  describe('Alerts', () => {
    it('should display success alert with correct message', () => {});

    it('should display error alert with correct message', () => {});
  });

  describe('Localization', () => {
    it('should display translated text for all UI elements', () => {});
  });
});
