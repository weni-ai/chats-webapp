import { defineStore } from 'pinia';
import Discussion from '@/services/api/resources/chats/discussion';

import { useRoomsStore } from './rooms';
const roomsStore = useRoomsStore();

export const useDiscussions = defineStore('discussions', {
  state: () => ({
    discussions: [],
    discussionsCloseds: [],
    activeDiscussion: null,
    newMessagesByDiscussion: {},
  }),
  actions: {
    setDiscussions(discussions) {
      this.discussions = discussions;
    },

    addDiscussion(discussion) {
      this.discussions.unshift({ ...discussion });
    },

    setActiveDiscussion(discussion) {
      this.activeDiscussion = discussion;
    },

    updateNewMessagesByDiscussion({ discussion, message, reset = false }) {
      const discussionMessages =
        this.newMessagesByDiscussion[discussion]?.messages || [];

      this.newMessagesByDiscussion = {
        ...this.newMessagesByDiscussion,
        [discussion]: {
          messages: reset ? [] : [...discussionMessages, message],
        },
      };
    },

    async getAll({ viewedAgent }) {
      const newDiscussions = await Discussion.listAll({ viewedAgent });
      this.setDiscussions(newDiscussions?.results);
    },

    async getAllClosed({ roomId }) {
      const closedDiscussions = await Discussion.listCloseds({ roomId });
      this.discussionsCloseds = closedDiscussions?.results;
    },

    async create({ queue, subject, initial_message }) {
      const responseDiscussion = await Discussion.create({
        queue,
        subject,
        initial_message,
      });

      if (
        responseDiscussion.status === 201 ||
        (responseDiscussion && !responseDiscussion.status)
      ) {
        const discussionWithContact = {
          ...responseDiscussion,
          contact: roomsStore.activeRoom?.contact.name,
        };
        this.addDiscussion(discussionWithContact);
        this.setActiveDiscussion(discussionWithContact);
      }

      return responseDiscussion;
    },

    removeDiscussion(discussionUuid) {
      const discussions = this.discussions.filter(
        (discussion) => discussion.uuid !== discussionUuid,
      );
      this.setDiscussions(discussions);

      if (
        this.activeDiscussion &&
        this.activeDiscussion?.uuid === discussionUuid
      ) {
        this.setActiveDiscussion(null);
      }
    },

    addNewMessagesByDiscussion({ discussion, message }) {
      this.updateNewMessagesByDiscussion({
        discussion,
        message,
      });
    },

    resetNewMessagesByDiscussion({ discussion }) {
      this.updateNewMessagesByDiscussion({
        discussion,
        reset: true,
      });
    },

    async addAgent({ user_email }) {
      const responseAgent = await Discussion.addAgent({
        discussionUuid: this.activeDiscussion.uuid,
        user_email,
      });

      return responseAgent;
    },

    async delete() {
      try {
        const { activeDiscussion } = this;
        await Discussion.delete({ discussionUuid: activeDiscussion.uuid });

        const discussions = this.discussions.filter(
          (discussion) => discussion.uuid !== activeDiscussion.uuid,
        );
        this.setDiscussions(discussions);
        this.setActiveDiscussion(null);
      } catch (error) {
        console.error(
          'An error occurred while deleting the discussion:',
          error,
        );
      }
    },

    getDiscussionDetails() {
      return Discussion.getDiscussionDetails({
        discussionUuid: this.activeDiscussion.uuid,
      });
    },

    getDiscussionAgents() {
      return Discussion.getDiscussionAgents({
        discussionUuid: this.activeDiscussion.uuid,
      });
    },
  },
  getters: {
    getDiscussionById: (state) => (uuid) => {
      return state.discussions.find((discussion) => discussion.uuid === uuid);
    },
  },
});
