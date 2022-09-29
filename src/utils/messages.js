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

    if (acc.at(-1)?.sender?.uuid !== message.sender.uuid) {
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
