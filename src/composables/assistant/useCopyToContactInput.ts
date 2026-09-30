import { UnnnicCallAlert } from '@weni/unnnic-system';
import i18n from '@/plugins/i18n';
import { useMessageManager } from '@/store/modules/chats/messageManager';

export async function copyTextToContactInput(text: string): Promise<boolean> {
  const value = text?.trim();
  if (!value) {
    return false;
  }

  const messageManager = useMessageManager();
  messageManager.setInputMessage(value, { focus: true });

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
    }
  } catch (error) {
    console.error('Failed to copy text to clipboard:', error);
  }

  UnnnicCallAlert({
    props: {
      text: i18n.global.t('contact_info.desk_copilot.copied_to_message_input'),
      type: 'success',
    },
  });

  return true;
}
