// eslint-disable-next-line import/prefer-default-export
export function groupSequentialSentMessages(messages) {
  const messagesWithSender = messages.map((message) =>
    message.contact || message.user
      ? {
          ...message,
          sender: message.contact || message.user,
        }
      : message,
  );

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
