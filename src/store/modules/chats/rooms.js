import { defineStore } from 'pinia';

import { useDashboard } from '../dashboard';
import { useProfile } from '../profile';

import Room from '@/services/api/resources/chats/room';
import { removeDuplicatedItems } from '@/utils/array';

export const useRooms = defineStore('rooms', {
  state: () => ({
    rooms: [],
    activeRoom: null,
    newMessagesByRoom: {},
    hasNextRooms: { waiting: false, in_progress: false, sent_flows: false },
    canUseCopilot: false,
    copilotSuggestion: '',
    roomsCount: {
      waiting: 0,
      in_progress: 0,
      sent_flows: 0,
    },
    selectedRoomsToTransfer: [],
    contactToTransfer: '',
  }),

  actions: {
    updateLastInteraction({ room, lastInteraction }) {
      const findedRoomIndex = this.rooms.findIndex(({ uuid }) => uuid === room);
      this.rooms[findedRoomIndex] = {
        ...this.rooms[findedRoomIndex],
        last_interaction: lastInteraction,
      };
    },
    updateMessagesByRoom({ room, message, reset = false }) {
      const roomMessages = this.newMessagesByRoom[room]?.messages || [];

      this.newMessagesByRoom = {
        ...this.newMessagesByRoom,
        [room]: {
          messages: reset ? [] : [...roomMessages, message],
        },
      };

      if (message)
        this.updateLastInteraction({
          room,
          lastInteraction: message.created_on,
        });
    },

    async setActiveRoom(room) {
      if (!room) {
        this.activeRoom = null;
        return;
      }

      if (!room.hasDetailInfo) {
        room = { ...(await Room.getByUuid(room)), hasDetailInfo: true };
      }
      const roomIndex = this.rooms.findIndex(
        (loadedRoom) => loadedRoom.uuid === room.uuid,
      );

      if (roomIndex === -1) this.rooms.unshift({ ...room });
      else this.rooms[roomIndex] = room;

      this.activeRoom = room;
    },

    addRoom(room) {
      if (room.uuid) {
        this.rooms.unshift({ ...room });
      }
    },

    bringRoomFront(room) {
      this.rooms.sort((x) => (x === room ? -1 : 0));
    },

    setCopilotSuggestion(suggestion) {
      this.copilotSuggestion = suggestion;
    },

    checkUserSeenRoom({ room, userEmail, viewedAgentEmail }) {
      const profileStore = useProfile();
      const isProjectAdmin = profileStore.me.project_permission_role === 1;

      if (isProjectAdmin && !room.user) return true;

      const userHasRoomQueue = !!profileStore.me.queues?.find(
        (permission) =>
          permission.queue === room.queue?.uuid && permission.role === 1,
      );

      if (!room.user && userHasRoomQueue) return true;

      if (viewedAgentEmail) {
        return room.user?.email === viewedAgentEmail;
      }

      return room.user?.email === userEmail;
    },

    async getAll({
      offset,
      concat,
      limit,
      contact,
      order,
      viewedAgent,
      filterFlag,
    }) {
      const filtersMapper = {
        waiting: {
          is_waiting: false,
          attending: false,
        },
        in_progress: {
          is_waiting: false,
          attending: true,
        },
        sent_flows: {
          is_waiting: true,
        },
      };

      const response = await Room.getAll(
        offset,
        limit,
        contact,
        order,
        viewedAgent,
        filtersMapper[filterFlag] || {},
      );
      let gettedRooms = response.results || [];

      const listRoomHasNext = response.next;

      if (concat) {
        gettedRooms = this.rooms.concat(response.results);
      }
      this.hasNextRooms[filterFlag] = listRoomHasNext;

      this.rooms = removeDuplicatedItems(gettedRooms, 'uuid');

      this.roomsCount[filterFlag] = response.count;

      return gettedRooms;
    },

    async updateRoomContact({ uuid }) {
      const newRoom = await Room.getByUuid({ uuid });

      this.activeRoom = newRoom;
    },

    async getCanUseCopilot() {
      if (this.activeRoom) {
        const response = await Room.getCanUseCopilot({
          uuid: this.activeRoom.uuid,
        });
        this.canUseCopilot = response.can_use_chat_completion;
      }
    },

    async getCopilotSuggestion() {
      this.setCopilotSuggestion('');
      const response = await Room.getCopilotSuggestion({
        uuid: this.activeRoom.uuid,
      });
      const suggestion = response?.choices?.[0]?.message?.content;
      if (suggestion) {
        this.setCopilotSuggestion(suggestion || '');
      } else if (response.status !== 200) {
        return response.status;
      }
      return undefined;
    },

    updateRoom({ room, userEmail, routerReplace, viewedAgentEmail }) {
      const dashboardStore = useDashboard();
      const filteredRooms = this.rooms
        .map((mappedRoom) =>
          mappedRoom.uuid === room.uuid ? { ...room } : mappedRoom,
        )
        .filter((filteredRoom) => {
          return this.checkUserSeenRoom({
            room: filteredRoom,
            viewedAgentEmail,
            userEmail,
          });
        });

      this.rooms = filteredRooms;

      const isTransferedToOtherUser =
        room.user && room.user.email !== userEmail;

      const isTransferedByMe = room.transferred_by === userEmail;

      const isTransferedByViewedAgent =
        room.transferred_by === viewedAgentEmail;

      const isTransferedFromAQueue =
        room.transfer_history?.from?.type === 'queue' ||
        !room.transfer_history?.from;

      const isActiveRoom =
        this.activeRoom && room.uuid === this.activeRoom.uuid;

      if (!isTransferedByMe && isTransferedToOtherUser) {
        if (!isTransferedFromAQueue && !room.is_waiting && !viewedAgentEmail) {
          dashboardStore.setShowModalAssumedChat(true);
          dashboardStore.setAssumedChatContactName(room.contact.name);
        }

        if (isActiveRoom && !viewedAgentEmail) {
          this.setActiveRoom(null);
          routerReplace();
          return;
        }
      }

      if (!room.is_waiting && isActiveRoom) {
        if (isTransferedByViewedAgent) {
          this.setActiveRoom(null);
          return;
        }
        this.setActiveRoom({ ...room });
      }
    },

    removeRoom(roomUuid) {
      const filteredRooms = this.rooms.filter((r) => r.uuid !== roomUuid);
      this.rooms = filteredRooms;

      if (this.activeRoom && this.activeRoom?.uuid === roomUuid) {
        this.setActiveRoom(null);
      }
    },

    addNewMessagesByRoom({ room, message }) {
      this.updateMessagesByRoom({ room, message });
    },

    resetNewMessagesByRoom({ room }) {
      this.updateMessagesByRoom({ room, reset: true });
    },

    setSelectedRoomsToTransfer(rooms) {
      this.selectedRoomsToTransfer = rooms;
    },

    setContactToTransfer(contact) {
      this.contactToTransfer = contact;
    },
  },

  getters: {
    agentRooms(store) {
      return store.rooms.filter(
        (room) => !!room.user && room.is_waiting === false,
      );
    },
    waitingQueue(store) {
      return store.rooms.filter((room) => !room.user && !room.is_waiting);
    },
    waitingContactAnswer(store) {
      return store.rooms.filter((room) => room.is_waiting === true);
    },
    getRoomById: (store) => (uuid) => {
      return store.rooms.find((room) => room.uuid === uuid);
    },
  },
});
