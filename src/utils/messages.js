import moment from 'moment';
import Rooms from '../store/modules/chats/rooms';
import Discussions from '../store/modules/chats/discussions';

import Profile from '../store/modules/profile';

export function isValidJson(message) {
  try {
    const parsedObject = JSON.parse(message);
    return typeof parsedObject === 'object' && parsedObject !== null;
  } catch {
    return false;
  }
}

function createTemporaryMessage({
  itemType = '',
  itemUuid = '',
  itemUser = {},
  message = '',
  medias = [],
}) {
  return {
    uuid: Date.now().toString(),
    text: message,
    created_on: new Date().toISOString(),
    media: medias || [],
    [itemType]: itemUuid,
    seen: true,
    user: itemUser,
  };
}

export function parseMessageToMessageWithSenderProp(message) {
  const sender = message.contact || message.user;
  if (!sender) return message;

  // only the contact has the `name` and `uuid` properties
  // the user's uuid is his email
  const {
    uuid,
    email,
    name,
    first_name: firstName,
    last_name: lastName,
  } = sender;
  const senderName = name || [firstName, lastName].join(' ');
  const senderUuid = uuid || email;
  sender.name = senderName;
  sender.uuid = senderUuid;
  return {
    ...message,
    sender,
  };
}

export function isMessageFromCurrentUser(message) {
  const { me } = Profile.state;
  return message.user?.email === me?.email;
}

export async function getMessages({ itemUuid, getItemMessages }) {
  if (!itemUuid) {
    return {};
  }

  let messages = [];
  let next = '';
  let previous = '';
  const maxRetries = 3;
  let currentRetry = 0;

  async function fetchData() {
    try {
      const response = await getItemMessages();

      const {
        results: responseMessages,
        next: responseNext,
        previous: responsePrevious,
      } = response;

      const firstMessage = responseMessages?.[0];

      if (firstMessage) {
        const activeRoomUUID = Rooms.state.activeRoom?.uuid;
        const activeDiscussionUUID = Discussions.state.activeDiscussion?.uuid;

        if (firstMessage.room && firstMessage.room !== activeRoomUUID) {
          return;
        }

        if (
          firstMessage.discussion &&
          firstMessage.discussion !== activeDiscussionUUID
        ) {
          return;
        }
      }

      messages = responseMessages;
      next = responseNext;
      previous = responsePrevious;
    } catch (error) {
      console.error('An error ocurred when try get the room messages', error);

      if (currentRetry < maxRetries) {
        currentRetry += 1;

        const TWO_SECONDS = 2000;

        await new Promise((resolve) => {
          setTimeout(() => {
            resolve(fetchData());
          }, TWO_SECONDS);
        });
      } else {
        throw new Error(
          `Several errors occurred when trying to request messages from the room. There will be no automatic retries.`,
        );
      }
    }
  }

  await fetchData();
  return { messages, next, previous };
}

export async function treatMessages({
  itemUuid,
  getItemMessages,
  oldMessages,
  nextReq,
  addSortedMessage,
  resetSortedMessages,
  setMessages,
  setMessagesNext,
  setMessagesPrevious,
}) {
  const { messages, next, previous } = await getMessages({
    itemUuid,
    getItemMessages,
  });
  let newMessages = messages;

  if (!newMessages.length) {
    return;
  }

  if (nextReq) {
    messages.reverse().forEach((message) => {
      addSortedMessage({ message, addBefore: !!nextReq });
    });

    newMessages = newMessages.reverse().concat(oldMessages);
  } else {
    await resetSortedMessages();
    messages.forEach((message) => {
      addSortedMessage({ message });
    });
  }

  setMessages(newMessages);
  setMessagesNext(next);
  setMessagesPrevious(previous);
}

export async function sendMessage({
  itemType,
  itemUuid,
  itemUser,
  message,
  sendItemMessage,
  addMessage,
  addSortedMessage,
  updateMessage,
}) {
  if (!itemUuid) {
    return;
  }

  // Create a temporary message to display while sending
  const temporaryMessage = createTemporaryMessage({
    itemType,
    itemUuid,
    itemUser,
    message,
  });
  addMessage(temporaryMessage);
  addSortedMessage(temporaryMessage);

  // Send the message and update it with the actual message data
  try {
    const newMessage = await sendItemMessage();
    updateMessage({
      message: newMessage,
      toUpdateMessageUuid: temporaryMessage.uuid,
    });
  } catch (error) {
    console.error('An error occurred while sending the message', error);
  }
}

export async function resendMessage({
  itemUuid,
  message,
  sendItemMessage,
  updateMessage,
  messagesInPromiseUuids,
  removeInPromiseMessage,
}) {
  if (!itemUuid || messagesInPromiseUuids.includes(message.uuid)) return;

  // Send the message and update it with the actual message data
  try {
    messagesInPromiseUuids.push(message.uuid);
    const updatedMessage = await sendItemMessage();
    removeInPromiseMessage(message.uuid);

    await updateMessage({
      message: updatedMessage,
      toUpdateMessageUuid: message.uuid,
    });
  } catch (error) {
    removeInPromiseMessage(message.uuid);

    console.error('An error occurred while sending the message', error);
  }
}

export async function sendMedias({
  itemType,
  itemUuid,
  itemUser,
  medias,
  sendItemMedia,
  addMessage,
  addFailedMessage,
  addSortedMessage,
  updateMessage,
}) {
  if (!itemUuid) {
    return;
  }

  // Create a temporary message to display while sending

  await Promise.all(
    medias.map(async (media) => {
      // Create a temporary message to display while sending
      const mediaPreview = URL.createObjectURL(media);
      const temporaryMessage = createTemporaryMessage({
        itemType,
        itemUuid,
        itemUser,
        medias: [
          { preview: mediaPreview, file: media, content_type: media.type },
        ],
      });
      addMessage(temporaryMessage);
      addSortedMessage(temporaryMessage);

      // Send the message and update it with the actual message data
      try {
        const sentMedia = await sendItemMedia(media);
        updateMessage({
          media: sentMedia,
          message: temporaryMessage,
          toUpdateMediaPreview: mediaPreview,
          toUpdateMessageUuid: temporaryMessage.uuid,
        });
      } catch (error) {
        addFailedMessage(temporaryMessage);
        console.error('An error occurred while sending the media', error);
      }
    }),
  );
}

export async function resendMedia({
  itemUuid,
  sendItemMedia,
  addFailedMessage,
  removeFailedMessage,
  addSendingMessage,
  updateMessage,
  message,
  media,
}) {
  if (!itemUuid) {
    return;
  }

  if (isMessageFromCurrentUser(message)) {
    removeFailedMessage(message.uuid);
    addSendingMessage(message.uuid);
  }

  // Send the media and update it with the actual media data
  try {
    const updatedMedia = await sendItemMedia(media);
    updateMessage({
      media: updatedMedia,
      message,
      toUpdateMediaPreview: media.preview,
      toUpdateMessageUuid: message.uuid,
    });
  } catch (error) {
    addFailedMessage(message);
    console.error('An error occurred while sending the media', error);
  }
}

/**
 * Adds a message to the roomMessagesSorted data structure.
 *
 * This function is designed to follow the state with the following format:
 * [{
 *   date: "",
 *   minutes: [{
 *     minute: "",
 *     messages: [{
 *       // ... (message data)
 *     }]
 *   }]
 * }]
 *
 * The choice of this format was motivated by the following topics:
 *
 * 1. **Reactivity**: Allows real-time state updates, ensuring that changes
 *    are immediately reflected in observers. This is possible thanks to the use of arrays, as JavaScript
 *    does not observe property mutations in plain objects.
 *
 * 2. **Unshift and Push**: The ability to use `unshift` and `push` makes it easier to add messages in chronological order.
 *
 * 3. **Grouping**: Group messages by date and sending time.
 *
 * @param {object} payload.message - The message to be added.
 * @param {boolean} payload.addBefore - Specifies whether the message should be added before or after existing ones.
 */
export function groupMessages(messagesReference, { message, addBefore }) {
  const messageTimestamp = moment(message.created_on);
  const messageDate = messageTimestamp.format('L');
  const messageMinute = messageTimestamp.format('LT');

  let dateIndex = messagesReference.findIndex(
    (obj) => obj.date === messageDate,
  );

  if (dateIndex === -1) {
    dateIndex = addBefore ? 0 : messagesReference.length;
    const newDateEntry = { date: messageDate, minutes: [] };
    messagesReference.splice(dateIndex, 0, newDateEntry);
  }

  const currentDateEntry = messagesReference[dateIndex];
  let minuteIndex = currentDateEntry.minutes.findIndex(
    (obj) => obj.minute === messageMinute,
  );

  if (minuteIndex === -1) {
    minuteIndex = addBefore ? 0 : currentDateEntry.minutes.length;
    const newMinuteEntry = { minute: messageMinute, messages: [] };
    currentDateEntry.minutes.splice(minuteIndex, 0, newMinuteEntry);
  }

  const currentMinuteEntry = currentDateEntry.minutes[minuteIndex];

  if (addBefore) {
    currentMinuteEntry.messages.unshift(message);
  } else {
    currentMinuteEntry.messages.push(message);
  }
}
