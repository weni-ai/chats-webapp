import {
  describe,
  it,
  expect,
  afterEach,
  beforeAll,
  afterAll,
  vi,
} from 'vitest';
import { mount, config } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import SummaryMessage from '../SummaryMessage.vue';
import { useRooms } from '@/store/modules/chats/rooms';
import { useProfile } from '@/store/modules/profile';
import Room from '@/services/api/resources/chats/room';
import i18n from '@/plugins/i18n';

vi.mock('@/services/api/resources/chats/room', () => ({
  default: {
    sendSummaryFeedback: vi.fn(),
  },
}));

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

const createWrapper = ({
  summary = 'The customer needs bathroom materials',
  status = 'DONE',
  isLoading = false,
  userEmail = 'agent@weni.ai',
  meEmail = 'agent@weni.ai',
} = {}) => {
  const pinia = createPinia();
  setActivePinia(pinia);

  const roomsStore = useRooms();
  roomsStore.$patch({
    activeRoom: {
      uuid: 'room-1',
      ended_at: null,
      user: { email: userEmail },
    },
    roomsSummary: {
      'room-1': {
        summary,
        feedback: { liked: null },
        status,
      },
    },
    isLoadingActiveRoomSummary: isLoading,
  });

  const profileStore = useProfile();
  profileStore.$patch({
    me: { email: meEmail },
  });

  return mount(SummaryMessage, {
    global: {
      plugins: [pinia],
      mocks: {
        $t: (key) => key,
      },
      stubs: {
        UnnnicIcon: {
          name: 'UnnnicIcon',
          template:
            '<button class="unnnic-icon" :data-testid="$attrs[\'data-testid\']" @click="$emit(\'click\')" />',
          inheritAttrs: false,
        },
        UnnnicToolTip: {
          name: 'UnnnicToolTip',
          template: '<div><slot /></div>',
        },
        CopyValueButton: {
          name: 'CopyValueButton',
          template: '<button data-testid="copy-summary" />',
          props: ['value', 'copyTooltipKey', 'fillChatInput'],
        },
        FeedbackModal: true,
      },
    },
  });
};

describe('DeskCopilotSummaryMessage', () => {
  let wrapper;

  afterEach(() => {
    wrapper?.unmount();
    vi.clearAllMocks();
  });

  it('renders the summary title and text', () => {
    wrapper = createWrapper();

    expect(wrapper.find('[data-testid="desk-copilot-summary"]').exists()).toBe(
      true,
    );
    expect(wrapper.text()).toContain('contact_info.desk_copilot.summary_title');
    expect(
      wrapper.find('[data-testid="desk-copilot-summary-text"]').text(),
    ).toBe('The customer needs bathroom materials');
  });

  it('shows loading dots while the summary is generating', () => {
    wrapper = createWrapper({ summary: '', isLoading: true });

    expect(
      wrapper.find('[data-testid="desk-copilot-summary-loading"]').exists(),
    ).toBe(true);
    expect(
      wrapper.findAll('[data-testid="desk-copilot-summary-generating-dot"]')
        .length,
    ).toBe(3);
  });

  it('shows feedback actions for the room owner when summary is done', () => {
    wrapper = createWrapper();

    expect(
      wrapper.find('[data-testid="desk-copilot-summary-actions"]').exists(),
    ).toBe(true);
    expect(
      wrapper.find('[data-testid="desk-copilot-summary-thumb-up"]').exists(),
    ).toBe(true);
    expect(
      wrapper.find('[data-testid="desk-copilot-summary-thumb-down"]').exists(),
    ).toBe(true);
  });

  it('hides feedback thumbs when the user is not the room owner', () => {
    wrapper = createWrapper({ meEmail: 'other@weni.ai' });

    expect(
      wrapper.find('[data-testid="desk-copilot-summary-thumb-up"]').exists(),
    ).toBe(false);
  });

  it('sends positive feedback on thumb up', async () => {
    wrapper = createWrapper();

    await wrapper
      .find('[data-testid="desk-copilot-summary-thumb-up"]')
      .trigger('click');

    expect(Room.sendSummaryFeedback).toHaveBeenCalledWith({
      roomUuid: 'room-1',
      liked: true,
      text: '',
      tags: [],
    });
  });
});
