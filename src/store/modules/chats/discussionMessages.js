import {
  groupMessages,
  isMessageFromCurrentUser,
  parseMessageToMessageWithSenderProp,
  resendMedia,
  resendMessage,
  sendMedias,
  sendMessage,
  treatMessages,
} from '@/utils/messages';

import { useDiscussions } from './discussions';
const discussionsStore = useDiscussions();

import { useProfile } from '../profile';
const profileStore = useProfile();

import Message from '@/services/api/resources/chats/message';

import { defineStore } from 'pinia';

export const useDiscussionMessages = defineStore('discussionMessages', {
  state: () => ({
    discussionMessages: [],
    discussionMessagesSorted: [],
    discussionMessagesSendingUuids: [],
    discussionMessagesInPromiseUuids: [],
    discussionMessagesFailedUuids: [],
    discussionMessagesNext: '',
    discussionMessagesPrevious: '',
  }),
  actions: {
    addDiscussionMessageSorted({ message, addBefore }) {
      groupMessages(this.discussionMessagesSorted, { message, addBefore });
    },

    resetDiscussionMessagesSorted() {
      this.discussionMessagesSorted = [];
    },

    removeMessageFromSendings(messageUuid) {
      this.discussionMessagesSendingUuids =
        this.discussionMessagesSendingUuids.filter(
          (mappedMessageUuid) => mappedMessageUuid !== messageUuid,
        );
    },

    updateDiscussionMessage({
      media,
      toUpdateMediaPreview,
      message,
      toUpdateMessageUuid = '',
    }) {
      const { discussionMessages } = this;
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

      const messageIndex = discussionMessages.findIndex(
        (mappedMessage) => mappedMessage.uuid === uuid,
      );
      if (messageIndex !== -1) {
        discussionMessages[messageIndex] = updatedMessage;
      }

      this.removeMessageFromSendings(uuid);
    },

    isMessageInActiveDiscussion(message) {
      return message.discussion === discussionsStore.activeDiscussion?.uuid;
    },

    handlingAddDiscussionMessage({ message }) {
      const { discussionMessages, discussionMessagesSendingUuids } = this;
      const { uuid } = message;

      if (this.isMessageInActiveDiscussion(message)) {
        const messageWithSender = parseMessageToMessageWithSenderProp(message);

        discussionMessages.push(messageWithSender);

        if (isMessageFromCurrentUser(message)) {
          discussionMessagesSendingUuids.push(uuid);
        }
      }
    },

    addFailedDiscussionMessage({ message }) {
      const { discussionMessagesFailedUuids } = this;
      const { uuid } = message;

      if (this.isMessageInActiveDiscussion(message)) {
        this.removeMessageFromSendings(uuid);

        if (isMessageFromCurrentUser(message)) {
          discussionMessagesFailedUuids.push(uuid);
        }
      }
    },

    removeMessageFromInPromise(messageUuid) {
      this.discussionMessagesInPromiseUuids =
        this.discussionMessagesInPromiseUuids.filter(
          (mappedMessageUuid) => mappedMessageUuid !== messageUuid,
        );
    },

    removeMessageFromFaileds(messageUuid) {
      this.discussionMessagesFailedUuids =
        this.discussionMessagesFailedUuids.filter(
          (mappedMessageUuid) => mappedMessageUuid !== messageUuid,
        );
    },

    async getDiscussionMessages({ offset, limit }) {
      const nextReq = this.discussionMessagesNext;

      await treatMessages({
        itemUuid: discussionsStore.activeDiscussion?.uuid,
        getItemMessages: () =>
          Message.getByDiscussion(
            { nextReq },
            discussionsStore.activeDiscussion.uuid,
            offset,
            limit,
          ),
        oldMessages: this.discussionMessages,
        nextReq,
        addSortedMessage: ({ message, addBefore }) =>
          this.addDiscussionMessageSorted({
            message,
            addBefore,
          }),
        resetSortedMessages: () => this.resetDiscussionMessagesSorted(),
        setMessages: (messages) => (this.discussionMessages = messages),
        setMessagesNext: (next) => (this.discussionMessagesNext = next),
        setMessagesPrevious: (previous) =>
          (this.discussionMessagesPrevious = previous),
      });
    },

    resetDiscussionMessages() {
      this.resetDiscussionMessagesSorted();
      this.discussionMessagesNext = '';
      this.discussionMessagesPrevious = '';
    },

    async addDiscussionMessage(message) {
      const messageAlreadyExists = this.discussionMessages.some(
        (mappedMessage) => mappedMessage.uuid === message.uuid,
      );

      if (messageAlreadyExists) this.updateDiscussionMessage({ message });
      else {
        this.handlingAddDiscussionMessage({ message });
        this.addDiscussionMessageSorted({ message });
      }
    },

    async sendDiscussionMessage(text) {
      const { activeDiscussion } = discussionsStore;
      if (!activeDiscussion) return;

      const me = { ...profileStore.me };

      await sendMessage({
        itemType: 'discussion',
        itemUuid: activeDiscussion.uuid,
        itemUser: activeDiscussion.user || me,
        message: text,
        sendItemMessage: () =>
          Message.sendDiscussionMessage(activeDiscussion.uuid, {
            text,
          }),
        addMessage: (message) => this.addDiscussionMessage({ message }),
        addSortedMessage: (message) =>
          this.addDiscussionMessageSorted({ message }),
        updateMessage: ({ message, toUpdateMessageUuid }) =>
          this.updateDiscussionMessage({
            message,
            toUpdateMessageUuid,
          }),
      });
    },

    async sendDiscussionMedias({ files: medias, updateLoadingFiles }) {
      const { activeDiscussion } = discussionsStore;
      if (!activeDiscussion) return;

      const me = { ...profileStore.me };

      await sendMedias({
        itemType: 'discussion',
        itemUuid: activeDiscussion.uuid,
        itemUser: activeDiscussion.user || me,
        medias,
        sendItemMedia: (media) =>
          Message.sendDiscussionMedia(activeDiscussion.uuid, {
            media,
            updateLoadingFiles,
          }),
        addMessage: (message) => this.addDiscussionMessage({ message }),
        addSortedMessage: (message) =>
          this.addDiscussionMessageSorted({ message }),
        addFailedMessage: (message) =>
          this.addFailedDiscussionMessage({
            message,
          }),
        updateMessage: ({
          media,
          message,
          toUpdateMessageUuid,
          toUpdateMediaPreview,
        }) =>
          this.updateDiscussionMessage({
            media,
            message,
            toUpdateMessageUuid,
            toUpdateMediaPreview,
          }),
      });
    },

    async resendDiscussionMessage({ message }) {
      const { activeDiscussion } = discussionsStore;
      if (!activeDiscussion) return;

      await resendMessage({
        itemUuid: activeDiscussion.uuid,
        message,
        sendItemMessage: () =>
          Message.sendDiscussionMessage(activeDiscussion.uuid, {
            text: message.text,
          }),
        updateMessage: ({ message, toUpdateMessageUuid }) =>
          this.updateDiscussionMessage({
            message,
            toUpdateMessageUuid,
          }),
        messagesInPromiseUuids: this.discussionMessagesInPromiseUuids,
        removeInPromiseMessage: (message) =>
          this.removeMessageFromInPromise(message),
      });
    },

    async resendDiscussionMedia({ message, media }) {
      const { activeDiscussion } = discussionsStore;
      if (!activeDiscussion) return;

      await resendMedia({
        itemUuid: activeDiscussion.uuid,
        message,
        media,
        sendItemMedia: (media) =>
          Message.sendDiscussionMedia(activeDiscussion.uuid, {
            media: media.file,
          }),
        addFailedMessage: (message) =>
          this.addFailedDiscussionMessage({
            message,
          }),
        removeFailedMessage: (message) =>
          this.removeMessageFromFaileds(message),
        addSendingMessage: (message) =>
          this.discussionMessagesSendingUuids.push(message),
        updateMessage: ({
          media,
          message,
          toUpdateMessageUuid,
          toUpdateMediaPreview,
        }) =>
          this.updateDiscussionMessage({
            media,
            message,
            toUpdateMessageUuid,
            toUpdateMediaPreview,
          }),
      });
    },

    async resendDiscussionMessages() {
      const { discussionMessagesSendingUuids, discussionMessages } = this;
      if (discussionMessagesSendingUuids.length > 0) {
        for (const messageUuid of discussionMessagesSendingUuids) {
          /*
            As it is important that messages are sent in the same order in which they were
            registered, it is necessary to use this "for...of" as it makes it possible
            to send messages sequentially, synchronously
          */

          const messageIndex = discussionMessages.findIndex(
            (mappedMessage) => mappedMessage.uuid === messageUuid,
          );

          await this.resendDiscussionMessage({
            message: discussionMessages[messageIndex],
          });
        }
      }
    },
  },
});
