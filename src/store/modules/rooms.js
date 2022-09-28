import Message from '@/services/api/resources/chats/message';
import { groupSequentialSentMessages, parseMessageToMessageWithSenderProp } from '@/utils/messages';
import Room from '@/services/api/resources/chats/room';

const mutations = {
  SET_ROOMS: 'SET_ROOMS',
  ADD_ROOM: 'ADD_ROOM',
  UPDATE_ROOM: 'UPDATE_ROOM',
  SET_ACTIVE_ROOM: 'SET_ACTIVE_ROOM',
  SET_ACTIVE_ROOM_MESSAGES: 'SET_ACTIVE_ROOM_MESSAGES',
  ADD_MESSAGE: 'ADD_MESSAGE',
  UPDATE_MESSAGE: 'UPDATE_MESSAGE',
};

export default {
  namespaced: true,
  state: {
    rooms: [],
    activeRoom: null,
    activeRoomMessages: [],
  },

  mutations: {
    [mutations.SET_ROOMS](state, rooms) {
      state.rooms = rooms;
    },
    [mutations.ADD_ROOM](state, room) {
      state.rooms.unshift({ ...room });
    },
    [mutations.SET_ACTIVE_ROOM](state, room) {
      state.activeRoom = room;
    },
    [mutations.SET_ACTIVE_ROOM_MESSAGES](state, messages) {
      state.activeRoomMessages = messages;
    },
    [mutations.ADD_MESSAGE](state, message) {
      const messageWithSender = parseMessageToMessageWithSenderProp(message);
      state.activeRoomMessages.push(messageWithSender);
    },
    [mutations.UPDATE_MESSAGE](state, { message, toUpdateUuid = '' }) {
      if (message.room !== state.activeRoom.uuid) return;
      const uuid = toUpdateUuid || message.uuid;

      const updatedMessage = parseMessageToMessageWithSenderProp(message);
      state.activeRoomMessages = state.activeRoomMessages.map((message) => {
        return message.uuid === uuid ? { ...updatedMessage } : message;
      });
    },
  },

  actions: {
    async getAll({ commit }) {
      const response = await Room.getAll();
      const rooms = response.results || [];
      commit(mutations.SET_ROOMS, rooms);
      return rooms;
    },
    setActiveRoom({ commit }, room) {
      commit(mutations.SET_ACTIVE_ROOM, room);
    },
    addRoom({ commit }, room) {
      commit(mutations.ADD_ROOM, room);
    },
    async getActiveRoomMessages({ commit, state }) {
      const { activeRoom } = state;
      if (!activeRoom) return;
      const response = await Message.getByRoom(activeRoom.uuid);
      const messages = response.results;
      const messagesWithSender = messages.map(parseMessageToMessageWithSenderProp);
      commit(mutations.SET_ACTIVE_ROOM_MESSAGES, messagesWithSender);
    },
    async sendMessage({ state, commit }, text) {
      const { activeRoom } = state;
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

      commit(mutations.ADD_MESSAGE, temporaryMessage);

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
    async sendMedias({ state }, medias) {
      const { activeRoom } = state;
      if (!activeRoom) return;

      await Promise.all(
        medias.map((media) =>
          Message.sendMedia({ roomId: activeRoom.uuid, userEmail: activeRoom.user.email, media }),
        ),
      );
    },
    async addMessage({ commit, state }, message) {
      const messageAlreadyExists = state.activeRoomMessages.some((m) => m.uuid === message.uuid);

      if (messageAlreadyExists) commit(mutations.UPDATE_MESSAGE, { message });
      else commit(mutations.ADD_MESSAGE, message);
    },
    updateRoom({ state, commit }, { room, userEmail }) {
      const rooms = state.rooms
        .map((r) => (r.uuid === room.uuid ? { ...room } : r))
        .filter((r) => !r.user || r.user.email === userEmail);
      commit(mutations.SET_ROOMS, rooms);
      commit(mutations.SET_ACTIVE_ROOM, { ...room });
    },
  },

  getters: {
    agentRooms(state) {
      return state.rooms.filter((room) => !!room.user);
    },
    waitingQueue(state) {
      return state.rooms.filter((room) => !room.user);
    },
    getRoomById: (state) => (uuid) => {
      return state.rooms.find((room) => room.uuid === uuid);
    },
    groupedActiveRoomsMessage: (state) => {
      return groupSequentialSentMessages(state.activeRoomMessages);
    },
  },
};
