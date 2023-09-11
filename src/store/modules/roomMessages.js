// import mime from 'mime-types';
import { groupSequentialSentMessages, parseMessageToMessageWithSenderProp } from '@/utils/messages';
import Message from '@/services/api/resources/chats/message';
import Rooms from './rooms';

const mutations = {
  SET_ROOM_MESSAGES: 'SET_ROOM_MESSAGES',
  SET_ROOM_HAS_NEXT_MESSAGES: 'SET_ROOM_HAS_NEXT_MESSAGES',
  ADD_MESSAGE: 'ADD_MESSAGE',
  UPDATE_MESSAGE: 'UPDATE_MESSAGE',
};

export default {
  namespaced: true,
  state: {
    // acceptedFileExtensions: [
    //   '.png',
    //   '.jpeg',
    //   '.jpg',
    //   '.mp4',
    //   '.pdf',
    //   '.doc',
    //   '.docx',
    //   '.txt',
    //   '.xls',
    //   '.xlsx',
    //   '.csv',
    // ],
    roomMessages: [],
    roomMessagesSendingUuids: [],
    hasNextMessages: true,
  },

  mutations: {
    [mutations.SET_ROOM_MESSAGES](state, messages) {
      state.roomMessages = messages;
    },
    [mutations.SET_ROOM_HAS_NEXT_MESSAGES](state, hasNextMessages) {
      state.hasNextMessages = hasNextMessages;
    },
    [mutations.ADD_MESSAGE](state, { message }) {
      if (message.room !== Rooms.state.activeRoom.uuid) return;
      const messageWithSender = parseMessageToMessageWithSenderProp(message);
      state.roomMessages.push(messageWithSender);
      state.roomMessagesSendingUuids.push(message.uuid);
    },
    [mutations.UPDATE_MESSAGE](state, { message, toUpdateUuid = '' }) {
      if (message.room !== Rooms.state.activeRoom.uuid) return;
      const uuid = toUpdateUuid || message.uuid;

      const updatedMessage = parseMessageToMessageWithSenderProp(message);
      state.roomMessages = state.roomMessages.map((message) => {
        return message.uuid === uuid ? { ...updatedMessage } : message;
      });
      delete state.roomMessagesSendingUuids[message.uuid];
    },
  },

  getters: {
    // getAcceptedFileExtensions({ acceptedFileExtensions }) {
    //   return acceptedFileExtensions;
    // },
    // validFile(files) {
    //   if (files.length > this.maximumUploads) return [];
    //   return Array.from(files).filter((file) => {
    //     if (this.validExtension([file])) {
    //       return true;
    //     }
    //     return false;
    //   });
    // },
    // validExtension(files) {
    //   const formats = this.supportedFormats.map((format) => format.trim());
    //   const isValid = Array.from(files).find((file) => {
    //     const fileName = file.name.toLowerCase();
    //     const fileType = file.type.toLowerCase();
    //     const fileExtension = `.${fileName.split('.').pop()}`;
    //     const isValidFileExtension = formats.includes(fileExtension);
    //     const isValidFileType = fileType === mime.lookup(fileName);
    //     return isValidFileExtension && isValidFileType;
    //   });
    //   return isValid;
    // },
    groupedActiveRoomsMessage: (state) => {
      return groupSequentialSentMessages(state.roomMessages);
    },
  },

  actions: {
    async getRoomMessages({ commit, state }, { offset, concat, limit }) {
      const { activeRoom } = Rooms.state;
      if (!activeRoom) return;
      const response = await Message.getByRoom(activeRoom.uuid, offset, limit);
      let messages = response.results;
      const hasNext = response.next;
      if (concat) {
        messages = response.results.concat(state.roomMessages);
      }
      const messagesWithSender = messages.map(parseMessageToMessageWithSenderProp);
      commit(mutations.SET_ROOM_MESSAGES, messagesWithSender);
      commit(mutations.SET_ROOM_HAS_NEXT_MESSAGES, hasNext);
    },
    async addMessage({ commit, state }, message) {
      const messageAlreadyExists = state.roomMessages.some((m) => m.uuid === message.uuid);

      if (messageAlreadyExists) commit(mutations.UPDATE_MESSAGE, { message });
      else commit(mutations.ADD_MESSAGE, { message });
    },
    async sendMessage({ commit }, text) {
      const { activeRoom } = Rooms.state;
      if (!activeRoom) return;

      const temporaryMessage = {
        uuid: Date.now().toString(),
        text,
        created_on: new Date().toISOString(),
        media: [],
        room: activeRoom.uuid,
        seen: false,
        user: { ...activeRoom.user },
      };

      commit(mutations.ADD_MESSAGE, { message: temporaryMessage });

      Message.send(activeRoom.uuid, {
        text,
        user_email: activeRoom.user.email,
      })
        .then((message) => {
          commit(mutations.UPDATE_MESSAGE, { message, toUpdateUuid: temporaryMessage.uuid });
        })
        .catch(() => {
          console.error('Não foi possível enviar a mensagem');
        });
    },
  },
};
