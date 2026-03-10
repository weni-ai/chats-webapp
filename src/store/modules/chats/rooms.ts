import { defineStore } from 'pinia';

import { useDashboard } from '../dashboard';
import { useProfile } from '../profile';

import Room from '@/services/api/resources/chats/room';
import { removeDuplicatedItems } from '@/utils/array';
import { getRoomType } from '@/utils/room';

import type {
  Room as RoomType,
  Tag,
} from '@/services/api/resources/chats/types';

interface RoomSummary {
  feedback: { liked: boolean | null };
  summary: string;
  status: string;
}

interface RoomMessagesByRoom {
  [roomUuid: string]: { messages: any[] };
}

interface GetAllParams {
  offset: number;
  concat?: boolean;
  limit: number;
  contact: string;
  order: string;
  viewedAgent?: string;
  roomsType?: string;
  cleanRoomType?: string;
}

interface UpdateRoomParams {
  room: RoomType;
  userEmail: string;
  routerReplace: () => void;
  viewedAgentEmail?: string | null;
}

export const useRooms = defineStore('rooms', {
  state: () => ({
    activeTab: 'ongoing' as string,
    rooms: [] as RoomType[],
    activeRoom: null as RoomType | null,
    isCanSendMessageActiveRoom: true,
    activeRoomTags: [] as Tag[],
    activeRoomTagsNext: '',
    maxPinLimit: 0,
    roomsSummary: {} as Record<string, RoomSummary>,
    isLoadingActiveRoomSummary: false,
    isLoadingCanSendMessageStatus: false,
    openActiveRoomSummary: false,
    newMessagesByRoom: {} as RoomMessagesByRoom,
    hasNextRooms: {
      waiting: false,
      in_progress: false,
      flow_start: false,
    } as Record<string, boolean | string | null>,
    canUseCopilot: false,
    copilotSuggestion: '',
    selectedOngoingRooms: [] as string[],
    selectedWaitingRooms: [] as string[],
    contactToTransfer: '',
    orderBy: {
      ongoing: '-last_interaction',
      discussions: '-last_interaction',
      flow_start: '-last_interaction',
      waiting: 'added_to_queue_at',
    } as Record<string, string>,
    showOngoingDot: false,
    roomsCount: {
      waiting: 0,
      ongoing: 0,
      flow_start: 0,
    } as Record<string, number>,
  }),

  actions: {
    updateLastInteraction({
      room,
      lastInteraction,
    }: {
      room: string;
      lastInteraction: string;
    }) {
      const findedRoomIndex = this.rooms.findIndex(({ uuid }) => uuid === room);

      if (!this.rooms[findedRoomIndex]?.is_pinned) {
        this.rooms[findedRoomIndex] = {
          ...this.rooms[findedRoomIndex],
          last_interaction: lastInteraction,
        };
      }
    },
    updateMessagesByRoom({
      room,
      message,
      reset = false,
    }: {
      room: string;
      message?: any;
      reset?: boolean;
    }) {
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

    setActiveRoom(room: RoomType | null) {
      this.activeRoom = room;
    },

    setIsLoadingCanSendMessageStatus(isLoading: boolean) {
      this.isLoadingCanSendMessageStatus = isLoading;
    },

    setIsCanSendMessageActiveRoom(isCanSendMessage: boolean) {
      this.isCanSendMessageActiveRoom = isCanSendMessage;
    },

    addRoom(room: RoomType, { after = false } = {}) {
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

    bringRoomFront(room: RoomType) {
      if (!room?.is_pinned) {
        this.rooms.sort((x) => (x === room ? -1 : 0));
      }
    },

    setCopilotSuggestion(suggestion: string) {
      this.copilotSuggestion = suggestion;
    },

    checkUserSeenRoom({
      room,
      userEmail,
      viewedAgentEmail,
    }: {
      room: RoomType;
      userEmail: string;
      viewedAgentEmail?: string | null;
    }): boolean {
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
      roomsType,
      cleanRoomType,
    }: GetAllParams) {
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

    async updateRoomContact({ uuid }: { uuid: string }) {
      const newRoom = await Room.getByUuid({ uuid });
      this.activeRoom = newRoom as RoomType | null;
    },

    async getCanUseCopilot() {
      if (this.activeRoom) {
        const response = await Room.getCanUseCopilot({
          uuid: this.activeRoom.uuid,
        });
        if (response) {
          this.canUseCopilot = response.can_use_chat_completion;
        }
      }
    },

    async getCopilotSuggestion() {
      this.setCopilotSuggestion('');
      const response = await Room.getCopilotSuggestion({
        uuid: (this.activeRoom as RoomType).uuid,
      });
      const suggestion = response?.choices?.[0]?.message?.content;
      if (suggestion) {
        this.setCopilotSuggestion(suggestion || '');
      } else if (response.status !== 200) {
        return response.status;
      }
      return undefined;
    },

    updateRoom({
      room,
      userEmail,
      routerReplace,
      viewedAgentEmail,
    }: UpdateRoomParams) {
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
            return (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0);
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
          (dashboardStore as any).setShowModalAssumedChat(true);
          (dashboardStore as any).setAssumedChatContactName(room.contact.name);
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

    removeRoom(roomUuid: string) {
      const filteredRooms = this.rooms.filter((r) => r.uuid !== roomUuid);

      this.rooms = filteredRooms;

      this.selectedOngoingRooms = this.selectedOngoingRooms.filter(
        (room) => room !== roomUuid,
      );

      this.selectedWaitingRooms = this.selectedWaitingRooms.filter(
        (room) => room !== roomUuid,
      );

      if (this.activeRoom && this.activeRoom?.uuid === roomUuid) {
        this.setActiveRoom(null);
      }
    },

    addNewMessagesByRoom({ room, message }: { room: string; message: any }) {
      this.updateMessagesByRoom({ room, message });
    },

    resetNewMessagesByRoom({ room }: { room: string }) {
      this.updateMessagesByRoom({ room, reset: true });
    },

    setContactToTransfer(contact: string) {
      this.contactToTransfer = contact;
    },

    setSelectedOngoingRooms(rooms: string[]) {
      this.selectedOngoingRooms = rooms;
    },

    setSelectedWaitingRooms(rooms: string[]) {
      this.selectedWaitingRooms = rooms;
    },

    sortRooms(a: RoomType, b: RoomType, key: string): number {
      const isDesc = this.orderBy[key].startsWith('-');
      const field = isDesc ? this.orderBy[key].slice(1) : this.orderBy[key];
      const valueA = new Date(a[field]).getTime();
      const valueB = new Date(b[field]).getTime();
      return isDesc ? valueB - valueA : valueA - valueB;
    },
  },

  getters: {
    currentSelectedRooms(store): string[] {
      return store.activeTab === 'ongoing'
        ? store.selectedOngoingRooms
        : store.selectedWaitingRooms;
    },

    agentRooms(store): RoomType[] {
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
    waitingQueue(store): RoomType[] {
      return store.rooms
        .filter((room) => !room.user && !room.is_waiting)
        .sort((a, b) => {
          return this.sortRooms(a, b, 'waiting');
        });
    },
    waitingContactAnswer(store): RoomType[] {
      return store.rooms
        .filter((room) => room.is_waiting === true)
        .sort((a, b) => {
          return this.sortRooms(a, b, 'flow_start');
        });
    },
    getRoomById:
      (store) =>
      (uuid: string): RoomType | undefined => {
        return store.rooms.find((room) => room.uuid === uuid);
      },
    activeRoomSummary(store): RoomSummary {
      if (!store.activeRoom) {
        return { feedback: { liked: null }, summary: '', status: '' };
      }

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
