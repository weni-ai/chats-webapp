import Rooms from '../store/modules/rooms';
import Profile from '../store/modules/profile';

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

export function isMessageInActiveRoom(message) {
  const { activeRoom } = Rooms.state;
  return message.room === activeRoom?.uuid;
}

export function isMessageFromCurrentUser(message) {
  const { me } = Profile.state;
  return message.user?.email === me?.email;
}

export function groupSequentialSentMessages(messages) {
  const groupedMessages = messages.reduce((acc, message) => {
    if (!message.sender) {
      acc.push(message);
      return acc;
    }
    const getDifference = moment(message?.created_on).diff(moment(acc.at(-1)?.created_on));
    const hours = moment.duration(getDifference).asHours();
    const minutes = hours * 60;

    const pastOneMinute = minutes > 1;

    const verifyIdUsere = acc.at(-1)?.sender?.uuid !== message.sender.uuid;

    if (verifyIdUsere || pastOneMinute) {
      const m = {
        ...message,
        content: [{ ...message }],
      };
      acc.push(m);
      return acc;
    }
    acc[acc.length - 1].content.push({ ...message });
    return acc;
  }, []);

  return groupedMessages;
}
