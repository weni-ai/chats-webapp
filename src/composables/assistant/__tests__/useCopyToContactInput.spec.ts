import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { UnnnicCallAlert } from '@weni/unnnic-system';
import { copyTextToContactInput } from '../useCopyToContactInput';
import { useMessageManager } from '@/store/modules/chats/messageManager';

vi.mock('@weni/unnnic-system', () => ({
  UnnnicCallAlert: vi.fn(),
}));

vi.mock('@/plugins/i18n', () => ({
  default: {
    global: {
      t: (key: string) => key,
    },
  },
}));

describe('copyTextToContactInput', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('returns false when text is empty', async () => {
    await expect(copyTextToContactInput('   ')).resolves.toBe(false);
    expect(UnnnicCallAlert).not.toHaveBeenCalled();
  });

  it('copies text, fills the contact chat input and focuses it', async () => {
    const messageManager = useMessageManager();

    await expect(copyTextToContactInput('  Suggested reply  ')).resolves.toBe(
      true,
    );

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      'Suggested reply',
    );
    expect(messageManager.inputMessage).toBe('Suggested reply');
    expect(messageManager.inputFocusRequestId).toBe(1);
    expect(UnnnicCallAlert).toHaveBeenCalledWith({
      props: {
        text: 'contact_info.desk_copilot.copied_to_message_input',
        type: 'success',
      },
    });
  });

  it('still fills the input when clipboard write fails', async () => {
    (
      navigator.clipboard.writeText as ReturnType<typeof vi.fn>
    ).mockRejectedValue(new Error('denied'));
    const messageManager = useMessageManager();

    await expect(copyTextToContactInput('Hello')).resolves.toBe(true);

    expect(messageManager.inputMessage).toBe('Hello');
    expect(UnnnicCallAlert).toHaveBeenCalledWith({
      props: {
        text: 'contact_info.desk_copilot.copied_to_message_input',
        type: 'success',
      },
    });
  });
});
