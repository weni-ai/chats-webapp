import Room from '@/services/api/resources/chats/room';

const mutations = {
  SET_ROOMS: 'SET_ROOMS',
  ADD_ROOM: 'ADD_ROOM',
  UPDATE_ROOM: 'UPDATE_ROOM',
  SET_ACTIVE_ROOM: 'SET_ACTIVE_ROOM',
  SET_ROOMS_HAS_NEXT: 'SET_ROOMS_HAS_NEXT',
  BRING_ROOM_FRONT: 'BRING_ROOM_FRONT',
  SET_CAN_USE_COPILOT: 'SET_CAN_USE_COPILOT',
  SET_COPILOT_SUGGESTION: 'SET_COPILOT_SUGGESTION',
  UPDATE_NEW_MESSAGES_BY_ROOM: 'UPDATE_NEW_MESSAGES_BY_ROOM',
  SET_SELECTED_ROOMS_TO_TRANFER: 'SET_SELECTED_ROOMS_TO_TRANFER',
  SET_CONTACT_TO_TRANSFER: 'SET_CONTACT_TO_TRANSFER',
};

export default {
  namespaced: true,
  state: {
    rooms: [],
    activeRoom: null,
    newMessagesByRoom: {},
    hasNextRooms: true,
    canUseCopilot: false,
    copilotSuggestion: '',

    selectedRoomsToTransfer: [],
    contactToTransfer: '',
  },

  mutations: {
    [mutations.SET_ROOMS](state, rooms) {
      state.rooms = rooms;
    },
    [mutations.ADD_ROOM](state, room) {
      if (room.uuid) {
        state.rooms.unshift({ ...room });
      }
    },
    [mutations.SET_ACTIVE_ROOM](state, room) {
      state.activeRoom = room;
    },
    [mutations.SET_ROOMS_HAS_NEXT](state, hasNextRooms) {
      state.hasNextRooms = hasNextRooms;
    },
    [mutations.BRING_ROOM_FRONT](state, room) {
      state.rooms.sort((x) => (x === room ? -1 : 0));
    },
    [mutations.SET_CAN_USE_COPILOT](state, canUseCopilot) {
      state.canUseCopilot = canUseCopilot;
    },
    [mutations.SET_COPILOT_SUGGESTION](state, copilotSuggestion) {
      state.copilotSuggestion = copilotSuggestion;
    },
    [mutations.UPDATE_NEW_MESSAGES_BY_ROOM](
      state,
      { room, message, reset = false },
    ) {
      const roomMessages = state.newMessagesByRoom[room]?.messages || [];

      state.newMessagesByRoom = {
        ...state.newMessagesByRoom,
        [room]: {
          messages: reset ? [] : [...roomMessages, message],
        },
      };
    },
    [mutations.SET_SELECTED_ROOMS_TO_TRANFER](state, rooms) {
      state.selectedRoomsToTransfer = rooms;
    },
    [mutations.SET_CONTACT_TO_TRANSFER](state, boolean) {
      state.contactToTransfer = boolean;
    },
  },

  actions: {
    async getAll(
      { commit, state },
      { offset, concat, limit, contact, order, viewedAgent },
    ) {
      const response = await Room.getAll(
        offset,
        limit,
        contact,
        order,
        viewedAgent,
      );
      let rooms = response.results || [];
      const listRoomHasNext = response.next;
      if (concat) {
        rooms = state.rooms.concat(response.results);
      }
      commit(mutations.SET_ROOMS_HAS_NEXT, listRoomHasNext);
      commit(mutations.SET_ROOMS, rooms);
      return rooms;
    },
    async updateRoomContact({ commit }, { uuid }) {
      const newRoom = await Room.getByUuid({ uuid });

      commit(mutations.SET_ACTIVE_ROOM, newRoom);
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
    async getCanUseCopilot({ state, commit }) {
      if (state.activeRoom) {
        const response = await Room.getCanUseCopilot({
          uuid: state.activeRoom.uuid,
        });
        commit(mutations.SET_CAN_USE_COPILOT, response.can_use_chat_completion);
      }
    },
    async clearCopilotSuggestion({ commit }) {
      commit(mutations.SET_COPILOT_SUGGESTION, '');
    },
    async getCopilotSuggestion({ dispatch, state, commit }) {
      dispatch('clearCopilotSuggestion');
      const response = await Room.getCopilotSuggestion({
        uuid: state.activeRoom.uuid,
      });
      const suggestion = response?.choices?.[0]?.message?.content;
      if (suggestion) {
        commit(mutations.SET_COPILOT_SUGGESTION, suggestion || '');
      } else if (response.status !== 200) {
        return response.status;
      }
      return undefined;
    },
    updateRoom(
      { state, commit },
      { room, userEmail, routerReplace, viewedAgentEmail },
    ) {
      const rooms = state.rooms
        .map((mappedRoom) =>
          mappedRoom.uuid === room.uuid ? { ...room } : mappedRoom,
        )
        .filter((filteredRoom) => {
          if (!filteredRoom.user) return filteredRoom;
          if (viewedAgentEmail) {
            return filteredRoom.user.email === viewedAgentEmail;
          }
          return filteredRoom.user.email === userEmail;
        });
      commit(mutations.SET_ROOMS, rooms);

      const isTransferedToOtherUser =
        room.user && room.user.email !== userEmail;
      const isTransferedByMe = room.transferred_by === userEmail;
      const isTransferedByViewedAgent =
        room.transferred_by === viewedAgentEmail;
      const isTransferedFromAQueue =
        room.transfer_history?.from?.type === 'queue' ||
        !room.transfer_history?.from;
      const isActiveRoom =
        state.activeRoom && room.uuid === state.activeRoom.uuid;

      if (!isTransferedByMe && isTransferedToOtherUser) {
        if (!isTransferedFromAQueue && !room.is_waiting && !viewedAgentEmail) {
          commit('dashboard/SET_SHOW_MODAL_ASSUMED_CHAT', true, { root: true });
          commit('dashboard/SET_ASSUMED_CHAT_CONTACT_NAME', room.contact.name, {
            root: true,
          });
        }

        if (isActiveRoom && !viewedAgentEmail) {
          commit(mutations.SET_ACTIVE_ROOM, null);
          routerReplace();
          return;
        }
      }

      if (!room.is_waiting && isActiveRoom) {
        if (isTransferedByViewedAgent) {
          commit(mutations.SET_ACTIVE_ROOM, {});
          return;
        }
        commit(mutations.SET_ACTIVE_ROOM, { ...room });
      }
    },
    removeRoom({ state, commit }, roomUuid) {
      const rooms = state.rooms.filter((r) => r.uuid !== roomUuid);
      commit(mutations.SET_ROOMS, rooms);

      if (state.activeRoom && state.activeRoom?.uuid === roomUuid) {
        commit(mutations.SET_ACTIVE_ROOM, null);
      }
    },
    addNewMessagesByRoom({ commit }, { room, message }) {
      commit(mutations.UPDATE_NEW_MESSAGES_BY_ROOM, { room, message });
    },
    resetNewMessagesByRoom({ commit }, { room }) {
      commit(mutations.UPDATE_NEW_MESSAGES_BY_ROOM, { room, reset: true });
    },
    setSelectedRoomsToTransfer({ commit }, rooms) {
      commit(mutations.SET_SELECTED_ROOMS_TO_TRANFER, rooms);
    },
    setContactToTransfer({ commit }, boolean) {
      commit(mutations.SET_CONTACT_TO_TRANSFER, boolean);
    },
  },

  getters: {
    agentRooms(state) {
      return state.rooms.filter(
        (room) => !!room.user && room.is_waiting === false,
      );
    },
    waitingQueue(state) {
      return state.rooms.filter((room) => !room.user && !room.is_waiting);
    },
    waitingContactAnswer(state) {
      return state.rooms.filter((room) => room.is_waiting === true);
    },
    getRoomById: (state) => (uuid) => {
      return state.rooms.find((room) => room.uuid === uuid);
    },
  },
};
