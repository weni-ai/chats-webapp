// eslint-disable-next-line import/prefer-default-export
export function groupSequentialSentMessages(messages) {
  const messagesWithSender = messages.map((message) => {
    const sender = message.contact || message.user;
    if (!sender) return message;
    // only the contact has the `name` property
    const { name, first_name: firstName, last_name: lastName } = sender;
    const senderName = name || [firstName, lastName].join(' ');
    sender.name = senderName;
    return {
      ...message,
      sender,
    };
  });

  const groupedMessages = messagesWithSender.reduce((acc, message) => {
    if (!message.sender) {
      acc.push(message);
      return acc;
    }

    if (acc.at(-1)?.sender?.id !== message.sender.id) {
      const m = { ...message, content: [{ uuid: message.uuid, text: message.text }] };
      acc.push(m);
      return acc;
    }

    acc[acc.length - 1].content.push({ uuid: message.uuid, text: message.text });
    return acc;
  }, []);

  return groupedMessages;
}
