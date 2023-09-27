const moment = require('moment');

export function parseMessageToMessageWithSenderProp(message) {
  const sender = message.contact || message.user;
  if (!sender) return message;

  // only the contact has the `name` and `uuid` properties
  // the user's uuid is his email
  const { uuid, email, name, first_name: firstName, last_name: lastName } = sender;
  const senderName = name || [firstName, lastName].join(' ');
  const senderUuid = uuid || email;
  sender.name = senderName;
  sender.uuid = senderUuid;
  return {
    ...message,
    sender,
  };
}

export function groupSequentialSentMessages(messages) {
  const groupedMessages = messages.reduce((acc, message) => {
    if (!message.sender) {
      acc.push(message);
      return acc;
    }
    const messageTime = moment(message?.created_on);
    const lastMessageTime = moment(acc.at(-1)?.created_on);

    const sameMinute = messageTime.isSame(lastMessageTime, 'minute');

    const isCommingDifferentUsers = acc.at(-1)?.sender?.uuid !== message.sender.uuid;

    if (isCommingDifferentUsers || !sameMinute) {
      const charsFromDayToMinute = 16;
      const groupUuid = `${message.created_on.slice(0, charsFromDayToMinute)}-${
        message.sender.uuid
      }`;
      const newGroup = {
        ...message,
        content: [{ ...message }],
        uuid: groupUuid || message.uuid,
      };
      acc.push(newGroup);
      return acc;
    }

    acc[acc.length - 1].content.push({ ...message });
    return acc;
  }, []);

  return groupedMessages;
}
