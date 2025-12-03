import { defineStore } from 'pinia';

import { useRooms } from './rooms';

import Message from '@/services/api/resources/chats/message';
import RoomNotes from '@/services/api/resources/chats/roomNotes';

import {
  isMessageFromCurrentUser,
  groupMessages,
  parseMessageToMessageWithSenderProp,
  treatMessages,
  sendMessage,
  sendMedias,
  resendMedia,
  resendMessage,
  removeFromGroupedMessages,
  updateMessageStatusInGroupedMessages,
} from '@/utils/messages';

export const useRoomMessages = defineStore('roomMessages', {
  state: () => ({
    roomMessages: [],
    roomMessagesSorted: [],
    roomMessagesSendingUuids: [],
    roomMessagesInPromiseUuids: [],
    roomMessagesFailedUuids: [],
    roomMessagesNext: '',
    roomMessagesPrevious: '',
    replyMessage: null,
    roomInternalNotes: [],
    toScrollNote: null,
    showScrollToBottomButton: false,
  }),
  actions: {
    addRoomMessageSorted({ message, addBefore, reorderMessageMinute }) {
      groupMessages(this.roomMessagesSorted, {
        message,
        addBefore,
        reorderMessageMinute,
      });
    },

    addFailedMessage({ message }) {
      const { uuid } = message;

      if (this.isMessageInActiveRoom(message)) {
        this.removeMessageFromSendings(uuid);

        if (isMessageFromCurrentUser(message)) {
          this.roomMessagesFailedUuids.push(uuid);
        }
      }
    },

    resetRoomMessagesSorted() {
      this.roomMessagesSorted = [];
    },

    resetRoomMessages() {
      this.roomMessages = [];
      this.resetRoomMessagesSorted();
      this.roomMessagesNext = '';
      this.roomMessagesPrevious = '';
    },

    removeMessageFromSendings(messageUuid) {
      this.roomMessagesSendingUuids = this.roomMessagesSendingUuids.filter(
        (mappedMessageUuid) => mappedMessageUuid !== messageUuid,
      );
    },

    removeMessageFromInPromise(messageUuid) {
      this.roomMessagesInPromiseUuids = this.roomMessagesInPromiseUuids.filter(
        (mappedMessageUuid) => mappedMessageUuid !== messageUuid,
      );
    },

    removeMessageFromFaileds(messageUuid) {
      this.roomMessagesFailedUuids = this.roomMessagesFailedUuids.filter(
        (mappedMessageUuid) => mappedMessageUuid !== messageUuid,
      );
    },

    isMessageInActiveRoom(message) {
      const roomsStore = useRooms();
      return message.room === roomsStore.activeRoom?.uuid;
    },

    handlingAddMessage({ message }) {
      const { uuid } = message;

      if (this.isMessageInActiveRoom(message)) {
        const messageWithSender = parseMessageToMessageWithSenderProp(message);

        this.roomMessages.push(messageWithSender);

        if (
          isMessageFromCurrentUser(message) &&
          !message.is_automatic_message &&
          !message.internal_note
        ) {
          this.roomMessagesSendingUuids.push(uuid);
        }

        if (message.internal_note) {
          this.roomInternalNotes.push({
            ...message.internal_note,
            user: message.user,
          });
        }
      }
    },

    updateMessageStatus({ messageUuid, status }) {
      const findedMessage = this.roomMessages.find(
        (mappedMessage) => mappedMessage.uuid === messageUuid,
      );

      if (!findedMessage) return;

      if (status === 'delivered') {
        findedMessage.is_delivered = true;
      }

      if (status === 'read') {
        findedMessage.is_read = true;
      }

      updateMessageStatusInGroupedMessages(this.roomMessagesSorted, {
        message: findedMessage,
      });
    },

    updateMessage({
      media,
      toUpdateMediaPreview,
      message,
      toUpdateMessageUuid = '',
    }) {
      const uuid = toUpdateMessageUuid || message.uuid;
      const treatedMessage = { ...message };

      if (media) {
        const mediaIndex = treatedMessage.media.findIndex(
          (mappedMessage) => mappedMessage.preview === toUpdateMediaPreview,
        );

        if (mediaIndex !== -1) {
          treatedMessage.media[mediaIndex] = media;
        }
      }

      const updatedMessage =
        parseMessageToMessageWithSenderProp(treatedMessage);

      const toUpdatedMessage = this.roomMessages.find(
        (mappedMessage) => mappedMessage.uuid === uuid,
      );

      const messageIndex = this.roomMessages.findIndex(
        (mappedMessage) => mappedMessage.uuid === uuid,
      );

      if (messageIndex !== -1) {
        this.roomMessages[messageIndex] = updatedMessage;
        removeFromGroupedMessages(this.roomMessagesSorted, {
          message: toUpdatedMessage,
        });
        this.addRoomMessageSorted({ message: updatedMessage });
      }

      this.removeMessageFromSendings(uuid);
    },

    async getRoomMessages() {
      const roomsStore = useRooms();

      const nextReq = this.roomMessagesNext;

      await treatMessages({
        itemUuid: roomsStore.activeRoom?.uuid,
        getItemMessages: () =>
          Message.getByRoom({ nextReq }, roomsStore.activeRoom?.uuid),
        oldMessages: this.roomMessages,
        nextReq,
        addSortedMessage: ({ message, addBefore }) =>
          this.addRoomMessageSorted({ message, addBefore }),
        resetSortedMessages: () => this.resetRoomMessagesSorted(),
        setMessages: (messages) => (this.roomMessages = messages),
        setMessagesNext: (nextMessage) => (this.roomMessagesNext = nextMessage),
        setMessagesPrevious: (previousMessage) =>
          (this.roomMessagesPrevious = previousMessage),
      });
    },

    async addMessage(message) {
      const messageAlreadyExists = this.roomMessages.some(
        (mappedMessage) => mappedMessage.uuid === message.uuid,
      );

      if (messageAlreadyExists) this.updateMessage({ message });
      else {
        this.handlingAddMessage({ message });
        this.addRoomMessageSorted({ message });
      }
    },

    async sendRoomMessage(text, repliedMessage) {
      const roomsStore = useRooms();
      const { activeRoom } = roomsStore;

      if (!activeRoom) return;

      await sendMessage({
        itemType: 'room',
        itemUuid: activeRoom.uuid,
        itemUser: activeRoom.user,
        message: text,
        repliedMessage: repliedMessage,
        sendItemMessage: () =>
          Message.sendRoomMessage(activeRoom.uuid, {
            text,
            user_email: activeRoom.user.email,
            seen: true,
            repliedMessageId: repliedMessage?.uuid,
          }),
        addMessage: (message) => this.handlingAddMessage({ message }),
        addSortedMessage: (message) => this.addRoomMessageSorted({ message }),
        updateMessage: ({ message, toUpdateMessageUuid }) =>
          this.updateMessage({ message, toUpdateMessageUuid }),
      });
    },

    async sendRoomMedias({
      files: medias,
      updateLoadingFiles,
      repliedMessage,
    }) {
      const roomsStore = useRooms();
      const { activeRoom } = roomsStore;
      if (!activeRoom) return;

      await sendMedias({
        itemType: 'room',
        itemUuid: activeRoom.uuid,
        itemUser: activeRoom.user,
        medias,
        repliedMessage: repliedMessage,
        sendItemMedia: (media) =>
          Message.sendRoomMedia(activeRoom.uuid, {
            user_email: activeRoom.user.email,
            media,
            updateLoadingFiles,
            repliedMessageId: repliedMessage?.uuid,
          }),
        addMessage: (message) => this.handlingAddMessage({ message }),
        addSortedMessage: (message) => this.addRoomMessageSorted({ message }),
        addFailedMessage: (message) =>
          this.addFailedMessage({
            message,
          }),
        updateMessage: ({
          media,
          message,
          toUpdateMessageUuid,
          toUpdateMediaPreview,
        }) =>
          this.updateMessage({
            media,
            message,
            toUpdateMessageUuid,
            toUpdateMediaPreview,
          }),
      });
    },

    async sendRoomInternalNote({ text }) {
      const roomsStore = useRooms();

      if (!roomsStore.activeRoom) return;

      const createdNote = await RoomNotes.createInternalNote({
        text,
        room: roomsStore.activeRoom.uuid,
      });

      // add internal note in the room messages
      sendMessage({
        itemType: 'room',
        itemUuid: roomsStore.activeRoom.uuid,
        itemUser: roomsStore.activeRoom.user,
        message: text,
        internalNote: createdNote,
        sendItemMessage: () => createdNote,
        addMessage: (message) => this.handlingAddMessage({ message }),
        addSortedMessage: (message) => this.addRoomMessageSorted({ message }),
        updateMessage: () => {},
      });
    },

    async resendRoomMessage({ message }) {
      const roomsStore = useRooms();
      const { activeRoom } = roomsStore;
      if (!activeRoom) return;

      await resendMessage({
        itemUuid: activeRoom.uuid,
        message,
        sendItemMessage: () =>
          Message.sendRoomMessage(activeRoom.uuid, {
            text: message.text,
            user_email: activeRoom.user.email,
            seen: true,
          }),
        updateMessage: ({ message, toUpdateMessageUuid }) =>
          this.updateMessage({ message, toUpdateMessageUuid }),
        messagesInPromiseUuids: this.roomMessagesInPromiseUuids,
        removeInPromiseMessage: (message) =>
          this.removeMessageFromInPromise(message),
      });
    },

    async resendRoomMedia({ message, media }) {
      const roomsStore = useRooms();
      const { activeRoom } = roomsStore;
      if (!activeRoom) return;

      await resendMedia({
        itemUuid: activeRoom.uuid,
        message,
        media,
        sendItemMedia: (media) =>
          Message.sendRoomMedia(activeRoom.uuid, {
            user_email: activeRoom.user.email,
            media: media.file,
          }),
        addFailedMessage: (message) => this.addFailedMessage({ message }),
        removeFailedMessage: (message) =>
          this.removeMessageFromFaileds(message),
        addSendingMessage: (message) =>
          this.roomMessagesSendingUuids.push(message),
        updateMessage: ({
          media,
          message,
          toUpdateMessageUuid,
          toUpdateMediaPreview,
        }) =>
          this.updateMessage({
            media,
            message,
            toUpdateMessageUuid,
            toUpdateMediaPreview,
          }),
      });
    },

    async resendRoomMessages() {
      const { roomMessagesSendingUuids, roomMessages } = this;
      if (roomMessagesSendingUuids.length > 0) {
        for (const messageUuid of roomMessagesSendingUuids) {
          /*
            As it is important that messages are sent in the same order in which they were
            registered, it is necessary to use this "for...of" as it makes it possible
            to send messages sequentially, synchronously
          */

          const messageIndex = roomMessages.findIndex(
            (mappedMessage) => mappedMessage.uuid === messageUuid,
          );

          await this.resendRoomMessage({ message: roomMessages[messageIndex] });
        }
      }
    },
  },
});
