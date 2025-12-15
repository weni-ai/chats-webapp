import { defineStore } from 'pinia';

import { useDashboard } from '../dashboard';
import { useProfile } from '../profile';

import Room from '@/services/api/resources/chats/room';
import { removeDuplicatedItems } from '@/utils/array';
import { getRoomType } from '@/utils/room';

export const useRooms = defineStore('rooms', {
  state: () => ({
    activeTab: 'ongoing',
    rooms: [],
    activeRoom: null,
    activeRoomTags: [],
    activeRoomTagsNext: '',
    maxPinLimit: 0,
    roomsSummary: {},
    isLoadingActiveRoomSummary: false,
    openActiveRoomSummary: false,
    newMessagesByRoom: {},
    hasNextRooms: { waiting: false, in_progress: false, flow_start: false },
    canUseCopilot: false,
    copilotSuggestion: '',
    selectedRoomsToTransfer: [],
    contactToTransfer: '',
    orderBy: {
      ongoing: '-last_interaction',
      discussions: '-last_interaction',
      flow_start: '-last_interaction',
      waiting: 'added_to_queue_at',
    },
    showOngoingDot: false,
    roomsCount: {
      waiting: 0,
      ongoing: 0,
      flow_start: 0,
    },
  }),

  actions: {
    updateLastInteraction({ room, lastInteraction }) {
      const findedRoomIndex = this.rooms.findIndex(({ uuid }) => uuid === room);

      if (!this.rooms[findedRoomIndex]?.is_pinned) {
        this.rooms[findedRoomIndex] = {
          ...this.rooms[findedRoomIndex],
          last_interaction: lastInteraction,
        };
      }
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

    setActiveRoom(room) {
      this.activeRoom = room;
    },

    addRoom(room, { after = false } = {}) {
      if (room.uuid) {
        const isRoomAlreadyInList = this.rooms.some(
          (mappedRoom) => mappedRoom.uuid === room.uuid,
        );
        if (isRoomAlreadyInList) return;

        if (after) {
          this.rooms.push({ ...room });
        } else {
          this.rooms.unshift({ ...room });
        }
      }
    },

    bringRoomFront(room) {
      if (!room?.is_pinned) {
        this.rooms.sort((x) => (x === room ? -1 : 0));
      }
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
          permission.queue === room.queue.uuid && permission.role === 1,
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
      roomsType,
      cleanRoomType,
    }) {
      const response = await Room.getAll(
        offset,
        limit,
        contact,
        order,
        viewedAgent,
        roomsType,
      );

      if (cleanRoomType) {
        this.rooms = this.rooms.filter(
          (room) => getRoomType(room) !== cleanRoomType,
        );
      }

      let gettedRooms = response.results || [];
      const listRoomHasNext = response.next;

      if (concat) {
        gettedRooms = gettedRooms.concat(this.rooms);
      }

      this.rooms = removeDuplicatedItems(gettedRooms, 'uuid');

      if (roomsType) {
        this.hasNextRooms[roomsType] = listRoomHasNext;
        this.roomsCount[roomsType] = response.count;
      }

      this.maxPinLimit = response.max_pin_limit || 0;

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
      const rooms = this.rooms;
      const filteredRooms = rooms
        .map((mappedRoom) =>
          mappedRoom.uuid === room.uuid
            ? { is_pinned: mappedRoom?.is_pinned, ...room }
            : mappedRoom,
        )
        .filter((filteredRoom) => {
          return this.checkUserSeenRoom({
            room: filteredRoom,
            viewedAgentEmail,
            userEmail,
          });
        })
        .sort((a, b) => {
          if (a.is_pinned !== undefined && b.is_pinned !== undefined) {
            return b.is_pinned - a.is_pinned;
          }
          return 0;
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

      this.selectedRoomsToTransfer = this.selectedRoomsToTransfer.filter(
        (room) => room !== roomUuid,
      );

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
    sortRooms(a, b, key) {
      const isDesc = this.orderBy[key].startsWith('-');
      const field = isDesc ? this.orderBy[key].slice(1) : this.orderBy[key];
      const valueA = new Date(a[field]);
      const valueB = new Date(b[field]);
      return isDesc ? valueB - valueA : valueA - valueB;
    },
  },

  getters: {
    agentRooms(store) {
      return store.rooms
        .filter((room) => !!room.user && room.is_waiting === false)
        .sort((a, b) => {
          return this.sortRooms(a, b, 'ongoing');
        })
        .sort((a, b) => {
          const aPinned = a.is_pinned || false;
          const bPinned = b.is_pinned || false;

          if (aPinned && !bPinned) return -1;
          if (!aPinned && bPinned) return 1;

          return 0;
        });
    },
    waitingQueue(store) {
      return store.rooms
        .filter((room) => !room.user && !room.is_waiting)
        .sort((a, b) => {
          return this.sortRooms(a, b, 'waiting');
        });
    },
    waitingContactAnswer(store) {
      return store.rooms
        .filter((room) => room.is_waiting === true)
        .sort((a, b) => {
          return this.sortRooms(a, b, 'flow_start');
        });
    },
    getRoomById: (store) => (uuid) => {
      return store.rooms.find((room) => room.uuid === uuid);
    },
    activeRoomSummary(store) {
      return (
        store.roomsSummary[store.activeRoom?.uuid] || {
          feedback: { liked: null },
          summary: '',
          status: '',
        }
      );
    },
  },
});
