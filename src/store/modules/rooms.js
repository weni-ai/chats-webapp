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
  SET_ACTIVE_ROOM_HAS_NEXT: 'SET_ACTIVE_ROOM_HAS_NEXT',
  SET_ROOMS_HAS_NEXT: 'SET_ROOMS_HAS_NEXT',
  BRING_ROOM_FRONT: 'BRING_ROOM_FRONT',
};

export default {
  namespaced: true,
  state: {
    rooms: [],
    activeRoom: null,
    activeRoomMessages: [],
    newMessagesByRoom: {},
    hasNext: true,
    hasNextRooms: true,
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
    [mutations.SET_ACTIVE_ROOM_HAS_NEXT](state, hasNext) {
      state.hasNext = hasNext;
    },
    [mutations.SET_ROOMS_HAS_NEXT](state, hasNextRooms) {
      state.hasNextRooms = hasNextRooms;
    },
    [mutations.BRING_ROOM_FRONT](state, room) {
      state.rooms.sort((x) => (x === room ? -1 : 0));
    },
    [mutations.ADD_MESSAGE](state, message) {
      if (message.room !== state.activeRoom.uuid) return;
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
    async getAll({ commit, state }, { offset, concat, limit, contact, order, viewedAgent }) {
      const response = await Room.getAll(offset, limit, contact, order, viewedAgent);
      let rooms = response.results || [];
      const listRoomHasNext = response.next;
      if (concat) {
        rooms = state.rooms.concat(response.results);
      }
      commit(mutations.SET_ROOMS_HAS_NEXT, listRoomHasNext);
      commit(mutations.SET_ROOMS, rooms);
      return rooms;
    },
    setActiveRoom({ commit }, room) {
      commit(mutations.SET_ACTIVE_ROOM, room);
    },
    addRoom({ commit }, room) {
      commit(mutations.ADD_ROOM, room);
    },
    bringRoomFront({ commit }, room) {
      commit(mutations.BRING_ROOM_FRONT, room);
    },
    async getActiveRoomMessages({ commit, state }, { offset, concat, limit }) {
      const { activeRoom } = state;
      if (!activeRoom) return;
      const response = await Message.getByRoom(activeRoom.uuid, offset, limit);
      let messages = response.results;
      const hasNext = response.next;
      if (concat) {
        messages = response.results.concat(state.activeRoomMessages);
      }
      const messagesWithSender = messages.map(parseMessageToMessageWithSenderProp);
      commit(mutations.SET_ACTIVE_ROOM_MESSAGES, messagesWithSender);
      commit(mutations.SET_ACTIVE_ROOM_HAS_NEXT, hasNext);
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
    async sendMedias({ state }, { files: medias, updateLoadingFiles }) {
      const { activeRoom } = state;
      if (!activeRoom) return;

      await Promise.all(
        medias.map((media) =>
          Message.sendMedia({
            roomId: activeRoom.uuid,
            userEmail: activeRoom.user.email,
            media,
            updateLoadingFiles,
          }),
        ),
      );
    },
    async addMessage({ commit, state }, message) {
      const messageAlreadyExists = state.activeRoomMessages.some((m) => m.uuid === message.uuid);

      if (messageAlreadyExists) commit(mutations.UPDATE_MESSAGE, { message });
      else commit(mutations.ADD_MESSAGE, message);
    },
    updateRoom({ state, commit }, { room, userEmail, routerReplace }) {
      const rooms = state.rooms
        .map((r) => (r.uuid === room.uuid ? { ...room } : r))
        .filter((r) => !r.user || r.user.email === userEmail);
      commit(mutations.SET_ROOMS, rooms);

      const isTransferedToOtherUser = room.user && room.user.email !== userEmail;
      const isTransferedByMe = room.transferred_by === userEmail;
      const isActiveRoom = state.activeRoom && room.uuid === state.activeRoom.uuid;

      if (!isTransferedByMe && isTransferedToOtherUser) {
        if (!room.is_waiting) {
          commit('dashboard/SET_SHOW_MODAL_ASSUMED_CHAT', true, { root: true });
          commit('dashboard/SET_ASSUMED_CHAT_CONTACT_NAME', room.contact.name, { root: true });
        }

        if (isActiveRoom) {
          routerReplace();
        }
      }

      if (!room.is_waiting && isActiveRoom) {
        commit(mutations.SET_ACTIVE_ROOM, { ...room });
      }
    },
    removeRoom({ state, commit }, roomUuid) {
      const rooms = state.rooms.filter((r) => r.uuid !== roomUuid);
      commit(mutations.SET_ROOMS, rooms);

      if (state.activeRoom.uuid === roomUuid) commit(mutations.SET_ACTIVE_ROOM, {});
    },
  },

  getters: {
    agentRooms(state) {
      return state.rooms.filter((room) => !!room.user && room.is_waiting === false);
    },
    waitingQueue(state) {
      return state.rooms.filter((room) => !room.user);
    },
    waitingContactAnswer(state) {
      return state.rooms.filter((room) => room.is_waiting === true);
    },
    getRoomById: (state) => (uuid) => {
      return state.rooms.find((room) => room.uuid === uuid);
    },
    groupedActiveRoomsMessage: (state) => {
      return groupSequentialSentMessages(state.activeRoomMessages);
    },
  },
};
