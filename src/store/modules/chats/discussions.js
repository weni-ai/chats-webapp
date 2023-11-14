import Discussion from '@/services/api/resources/chats/discussion';
import Rooms from './rooms';

const mutations = {
  SET_DISCUSSIONS: 'SET_DISCUSSIONS',
  ADD_DISCUSSION: 'ADD_DISCUSSION',
  SET_DISCUSSIONS_CLOSEDS: 'SET_DISCUSSIONS_CLOSEDS',
  SET_ACTIVE_DISCUSSION: 'SET_ACTIVE_DISCUSSION',
  UPDATE_NEW_MESSAGES_BY_DISCUSSION: 'UPDATE_NEW_MESSAGES_BY_DISCUSSION',
};

export default {
  namespaced: true,
  state: {
    discussions: [],
    discussionsCloseds: [],
    activeDiscussion: null,
    newMessagesByDiscussion: {},
  },

  mutations: {
    [mutations.SET_DISCUSSIONS](state, discussions) {
      state.discussions = discussions;
    },
    [mutations.ADD_DISCUSSION](state, discussion) {
      state.discussions.unshift({ ...discussion });
    },
    [mutations.SET_DISCUSSIONS_CLOSEDS](state, discussionsCloseds) {
      state.discussionsCloseds = discussionsCloseds;
    },
    [mutations.SET_ACTIVE_DISCUSSION](state, room) {
      state.activeDiscussion = room;
    },
    [mutations.UPDATE_NEW_MESSAGES_BY_DISCUSSION](state, { discussion, message, reset = false }) {
      const discussionMessages = state.newMessagesByDiscussion[discussion]?.messages || [];

      state.newMessagesByDiscussion = {
        ...state.newMessagesByDiscussion,
        [discussion]: {
          messages: reset ? [] : [...discussionMessages, message],
        },
      };
    },
  },

  actions: {
    async getAll({ commit }) {
      const newDiscussions = await Discussion.listAll();
      commit(mutations.SET_DISCUSSIONS, newDiscussions?.results);
    },

    async getAllClosed({ commit }, { roomId }) {
      const newDiscussions = await Discussion.listCloseds({ roomId });
      commit(mutations.SET_DISCUSSIONS_CLOSEDS, newDiscussions?.results);
    },

    async create({ commit }, { queue, subject, initial_message }) {
      const responseDiscussion = await Discussion.create({
        queue,
        subject,
        initial_message,
      });

      if (responseDiscussion.status === 201 || (responseDiscussion && !responseDiscussion.status)) {
        const discussionWithContact = {
          ...responseDiscussion,
          contact: Rooms.state.activeRoom?.contact.name,
        };
        commit(mutations.ADD_DISCUSSION, discussionWithContact);
        commit(mutations.SET_ACTIVE_DISCUSSION, discussionWithContact);
      }

      return responseDiscussion;
    },

    addDiscussion({ commit }, discussion) {
      commit(mutations.ADD_DISCUSSION, discussion);
    },

    removeDiscussion({ state, commit }, discussionUuid) {
      const discussions = state.discussions.filter(
        (discussion) => discussion.uuid !== discussionUuid,
      );
      commit(mutations.SET_DISCUSSIONS, discussions);

      if (state.activeDiscussion.uuid === discussionUuid)
        commit(mutations.SET_ACTIVE_DISCUSSION, {});
    },

    addNewMessagesByDiscussion({ commit }, { discussion, message }) {
      commit(mutations.UPDATE_NEW_MESSAGES_BY_DISCUSSION, { discussion, message });
    },

    resetNewMessagesByDiscussion({ commit }, { discussion }) {
      commit(mutations.UPDATE_NEW_MESSAGES_BY_DISCUSSION, { discussion, reset: true });
    },

    async addAgent({ state }, { user_email }) {
      const responseAgent = await Discussion.addAgent({
        discussionUuid: state.activeDiscussion.uuid,
        user_email,
      });

      return responseAgent;
    },

    setActiveDiscussion({ commit }, discussion) {
      commit(mutations.SET_ACTIVE_DISCUSSION, discussion);
    },

    async delete({ state, commit }) {
      try {
        const { activeDiscussion } = state;
        await Discussion.delete({ discussionUuid: activeDiscussion.uuid });

        const discussions = state.discussions.filter(
          (discussion) => discussion.uuid !== activeDiscussion.uuid,
        );

        commit(mutations.SET_DISCUSSIONS, discussions);
        commit(mutations.SET_ACTIVE_DISCUSSION, null);
      } catch (error) {
        console.error('An error occurred while deleting the discussion:', error);
      }
    },

    getDiscussionDetails({ state }) {
      return Discussion.getDiscussionDetails({ discussionUuid: state.activeDiscussion.uuid });
    },

    getDiscussionAgents({ state }) {
      return Discussion.getDiscussionAgents({ discussionUuid: state.activeDiscussion.uuid });
    },
  },

  getters: {
    getDiscussionById: (state) => (uuid) => {
      return state.discussions.find((discussion) => discussion.uuid === uuid);
    },
  },
};
