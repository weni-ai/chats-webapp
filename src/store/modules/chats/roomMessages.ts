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

import type {
  Message as MessageType,
  InternalNote,
} from '@/services/api/resources/chats/types';

interface UpdateMessageParams {
  media?: any;
  toUpdateMediaPreview?: string;
  message: MessageType;
  toUpdateMessageUuid?: string;
  reorderMessageMinute?: boolean;
}

interface SendRoomMediasParams {
  files: any[];
  updateLoadingFiles?: (_uuid: string, _progress: number) => void;
  repliedMessage?: MessageType | null;
}

export const useRoomMessages = defineStore('roomMessages', {
  state: () => ({
    roomMessages: [] as MessageType[],
    roomMessagesSorted: [] as any[],
    roomMessagesSendingUuids: [] as string[],
    roomMessagesInPromiseUuids: [] as string[],
    roomMessagesFailedUuids: [] as string[],
    roomMessagesNext: '',
    roomMessagesPrevious: '',
    replyMessage: null as MessageType | null,
    roomInternalNotes: [] as InternalNote[],
    toScrollNote: null as string | null,
    toScrollMessage: null as string | null,
    showScrollToBottomButton: false,
    showSearchMessagesDrawer: false,
    isLoadingAllMessages: false,
  }),
  actions: {
    addRoomMessageSorted({
      message,
      addBefore,
      reorderMessageMinute,
    }: {
      message: MessageType;
      addBefore?: boolean;
      reorderMessageMinute?: boolean;
    }) {
      (groupMessages as Function)(this.roomMessagesSorted, {
        message,
        addBefore,
        reorderMessageMinute,
      });
    },

    addFailedMessage({ message }: { message: MessageType }) {
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

    removeMessageFromSendings(messageUuid: string) {
      this.roomMessagesSendingUuids = this.roomMessagesSendingUuids.filter(
        (mappedMessageUuid) => mappedMessageUuid !== messageUuid,
      );
    },

    removeMessageFromInPromise(messageUuid: string) {
      this.roomMessagesInPromiseUuids = this.roomMessagesInPromiseUuids.filter(
        (mappedMessageUuid) => mappedMessageUuid !== messageUuid,
      );
    },

    removeMessageFromFaileds(messageUuid: string) {
      this.roomMessagesFailedUuids = this.roomMessagesFailedUuids.filter(
        (mappedMessageUuid) => mappedMessageUuid !== messageUuid,
      );
    },

    isMessageInActiveRoom(message: MessageType): boolean {
      const roomsStore = useRooms();
      return message.room === roomsStore.activeRoom?.uuid;
    },

    handlingAddMessage({ message }: { message: MessageType }) {
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

    updateMessageStatus({
      messageUuid,
      status,
    }: {
      messageUuid: string;
      status: string;
    }) {
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
      reorderMessageMinute = false,
    }: UpdateMessageParams) {
      const uuid = toUpdateMessageUuid || message.uuid;
      const treatedMessage = { ...message };

      if (media) {
        const mediaIndex = treatedMessage.media.findIndex(
          (mappedMessage: any) =>
            mappedMessage.preview === toUpdateMediaPreview,
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
        this.addRoomMessageSorted({
          message: updatedMessage,
          reorderMessageMinute,
        });
      }

      this.removeMessageFromSendings(uuid);
    },

    async getAllRoomsMessages() {
      try {
        this.isLoadingAllMessages = true;
        await this.getRoomMessages();
      } catch (error) {
        console.log(error);
      } finally {
        if (this.roomMessagesNext) this.getAllRoomsMessages();
        else this.isLoadingAllMessages = false;
      }
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
        addSortedMessage: ({
          message,
          addBefore,
        }: {
          message: MessageType;
          addBefore?: boolean;
        }) => this.addRoomMessageSorted({ message, addBefore }),
        resetSortedMessages: () => this.resetRoomMessagesSorted(),
        setMessages: (messages: MessageType[]) =>
          (this.roomMessages = messages),
        setMessagesNext: (nextMessage: string) =>
          (this.roomMessagesNext = nextMessage),
        setMessagesPrevious: (previousMessage: string) =>
          (this.roomMessagesPrevious = previousMessage),
      });
    },

    async addMessage(message: MessageType) {
      const messageAlreadyExists = this.roomMessages.some(
        (mappedMessage) => mappedMessage.uuid === message.uuid,
      );
      if (messageAlreadyExists) this.updateMessage({ message });
      else {
        this.handlingAddMessage({ message });
        this.addRoomMessageSorted({ message });
      }
    },

    async sendRoomMessage(text: string, repliedMessage?: MessageType | null) {
      const roomsStore = useRooms();
      const { activeRoom } = roomsStore;

      if (!activeRoom) return;

      await sendMessage({
        itemType: 'room',
        itemUuid: activeRoom.uuid,
        itemUser: activeRoom.user,
        message: text,
        repliedMessage: repliedMessage,
        internalNote: undefined,
        sendItemMessage: () =>
          Message.sendRoomMessage(activeRoom.uuid, {
            text,
            user_email: activeRoom.user.email,
            seen: true,
            repliedMessageId: repliedMessage?.uuid,
          }),
        addMessage: (message: MessageType) =>
          this.handlingAddMessage({ message }),
        addSortedMessage: (message: MessageType) =>
          this.addRoomMessageSorted({ message }),
        updateMessage: ({
          message,
          toUpdateMessageUuid,
        }: {
          message: MessageType;
          toUpdateMessageUuid: string;
        }) => this.updateMessage({ message, toUpdateMessageUuid }),
      });
    },

    async sendRoomMedias({
      files: medias,
      updateLoadingFiles,
      repliedMessage,
    }: SendRoomMediasParams) {
      const roomsStore = useRooms();
      const { activeRoom } = roomsStore;
      if (!activeRoom) return;

      await sendMedias({
        itemType: 'room',
        itemUuid: activeRoom.uuid,
        itemUser: activeRoom.user,
        medias,
        repliedMessage: repliedMessage,
        sendItemMedia: (media: any) =>
          Message.sendRoomMedia(activeRoom.uuid, {
            user_email: activeRoom.user.email,
            media,
            updateLoadingFiles,
            repliedMessageId: repliedMessage?.uuid,
          }),
        addMessage: (message: MessageType) =>
          this.handlingAddMessage({ message }),
        addSortedMessage: (message: MessageType) =>
          this.addRoomMessageSorted({ message }),
        addFailedMessage: (message: MessageType) =>
          this.addFailedMessage({
            message,
          }),
        updateMessage: ({
          media,
          message,
          toUpdateMessageUuid,
          toUpdateMediaPreview,
        }: UpdateMessageParams) =>
          this.updateMessage({
            media,
            message,
            toUpdateMessageUuid,
            toUpdateMediaPreview,
          }),
      });
    },

    async sendRoomInternalNote({ text }: { text: string }) {
      const roomsStore = useRooms();

      if (!roomsStore.activeRoom) return;

      const createdNote = await RoomNotes.createInternalNote({
        text,
        room: roomsStore.activeRoom.uuid,
      });

      sendMessage({
        itemType: 'room',
        itemUuid: roomsStore.activeRoom.uuid,
        itemUser: roomsStore.activeRoom.user,
        message: text,
        repliedMessage: undefined,
        internalNote: createdNote,
        sendItemMessage: () => createdNote,
        addMessage: (message: MessageType) =>
          this.handlingAddMessage({ message }),
        addSortedMessage: (message: MessageType) =>
          this.addRoomMessageSorted({ message }),
        updateMessage: () => {},
      });
    },

    async resendRoomMessage({ message }: { message: MessageType }) {
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
        updateMessage: ({
          message,
          toUpdateMessageUuid,
        }: {
          message: MessageType;
          toUpdateMessageUuid: string;
        }) => this.updateMessage({ message, toUpdateMessageUuid }),
        messagesInPromiseUuids: this.roomMessagesInPromiseUuids,
        removeInPromiseMessage: (message: string) =>
          this.removeMessageFromInPromise(message),
      });
    },

    async resendRoomMedia({
      message,
      media,
    }: {
      message: MessageType;
      media: any;
    }) {
      const roomsStore = useRooms();
      const { activeRoom } = roomsStore;
      if (!activeRoom) return;

      await resendMedia({
        itemUuid: activeRoom.uuid,
        message,
        media,
        sendItemMedia: (media: any) =>
          Message.sendRoomMedia(activeRoom.uuid, {
            user_email: activeRoom.user.email,
            media: media.file,
          }),
        addFailedMessage: (message: MessageType) =>
          this.addFailedMessage({ message }),
        removeFailedMessage: (message: string) =>
          this.removeMessageFromFaileds(message),
        addSendingMessage: (message: string) =>
          this.roomMessagesSendingUuids.push(message),
        updateMessage: ({
          media,
          message,
          toUpdateMessageUuid,
          toUpdateMediaPreview,
        }: UpdateMessageParams) =>
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
