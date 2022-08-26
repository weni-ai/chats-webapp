import Message from '@/services/api/resources/message';
import Room from '@/services/api/resources/room';
import { groupSequentialSentMessages, parseMessageToMessageWithSenderProp } from '@/utils/messages';

const mutations = {
  SET_ROOMS: 'SET_ROOMS',
  SET_ACTIVE_ROOM: 'SET_ACTIVE_ROOM',
  SET_ACTIVE_ROOM_MESSAGES: 'SET_ACTIVE_ROOM_MESSAGES',
  NEW_MESSAGE: 'NEW_MESSAGE',
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
    [mutations.SET_ACTIVE_ROOM](state, room) {
      state.activeRoom = room;
    },
    [mutations.SET_ACTIVE_ROOM_MESSAGES](state, messages) {
      state.activeRoomMessages = messages;
    },
    [mutations.NEW_MESSAGE](state, message) {
      // TODO: fazer esse agrupamento via getter
      const parsedMessage = parseMessageToMessageWithSenderProp(message);
      const lastSenderUuid = state.activeRoomMessages.at(-1)?.sender?.uuid;
      if (lastSenderUuid === parsedMessage.sender.uuid)
        state.activeRoomMessages
          .at(-1)
          .content.push({ uuid: parsedMessage.uuid, text: parsedMessage.text });
      else {
        const { text, uuid } = parsedMessage;
        state.activeRoomMessages.push({ ...parsedMessage, content: [{ uuid, text }] });
      }
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
    async getActiveRoomMessages({ commit, state }) {
      const { activeRoom } = state;
      if (!activeRoom) return;
      const response = await Message.getByRoomId(activeRoom.uuid);
      const messages = groupSequentialSentMessages(response.results || []);
      commit(mutations.SET_ACTIVE_ROOM_MESSAGES, messages);
    },
    async sendMessage({ state, commit }, text) {
      const { activeRoom } = state;
      if (!activeRoom) return;

      const message = await Message.send(activeRoom.uuid, {
        text,
        user_email: activeRoom.user.email,
      });
      commit(mutations.NEW_MESSAGE, message);
    },
    async newMessage({ commit }, message) {
      commit(mutations.NEW_MESSAGE, message);
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
  },
};
