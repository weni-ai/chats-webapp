import SoundNotification from '@/services/api/websocket/soundNotification';

import { sendWindowNotification } from '@/utils/notifications';
import { isValidJson } from '@/utils/messages';

import { useDiscussions } from '@/store/modules/chats/discussions';
import { useDiscussionMessages } from '@/store/modules/chats/discussionMessages';

export default (message, { app }) => {
  const discussionStore = useDiscussions();
  const discussionMessagesStore = useDiscussionMessages();
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
      sendWindowNotification({
        title: `${first_name} ${last_name}`,
        message: message.text,
        image: message.media?.[0]?.url,
      });
    }

    const isCurrentDiscussion =
      app.$route.name === 'discussion' &&
      app.$route.params.discussionId === message.discussion;
    const isViewModeCurrentDiscussion =
      app.$route.params.viewedAgent &&
      activeDiscussion?.uuid === message.discussion;
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
