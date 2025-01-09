import SoundNotification from '@/services/api/websocket/soundNotification';

import { sendWindowNotification } from '@/utils/notifications';
import { isValidJson } from '@/utils/messages';

import { useDiscussions } from '@/store/modules/chats/discussions';
import { useDiscussionMessages } from '@/store/modules/chats/discussionMessages';
import { useDashboard } from '@/store/modules/dashboard';

export default (message, { app }) => {
  const discussionStore = useDiscussions();
  const discussionMessagesStore = useDiscussionMessages();
  const dashboardStore = useDashboard();

  const { viewedAgent } = dashboardStore;
  const { discussions, activeDiscussion } = discussionStore;
  const findDiscussion = discussions.find(
    (discussion) => discussion.uuid === message.discussion,
  );

  if (findDiscussion) {
    if (app.me.email === message.user?.email) {
      return;
    }

    const notification = new SoundNotification('ping-bing');
    notification.notify();

    if (document.hidden) {
      const { first_name, last_name } = message.user;
      try {
        sendWindowNotification({
          title: `${first_name} ${last_name}`,
          message: message.text,
          image: message.media?.[0]?.url,
        });
      } catch (error) {
        console.log(error);
      }
    }

    const isCurrentDiscussion = activeDiscussion?.uuid === message.discussion;

    const isViewModeCurrentDiscussion =
      viewedAgent.email && activeDiscussion?.uuid === message.discussion;

    const shouldAddDiscussionMessage =
      isCurrentDiscussion || isViewModeCurrentDiscussion;

    if (shouldAddDiscussionMessage) {
      discussionMessagesStore.addDiscussionMessage({ message });
    }

    const isJsonMessage = isValidJson(message.text);

    if (shouldAddDiscussionMessage || isJsonMessage) {
      return;
    }

    discussionStore.addNewMessagesByDiscussion({
      discussion: message.discussion,
      message: {
        created_on: message.created_on,
        uuid: message.uuid,
        text: message.text,
      },
    });
  }
};
