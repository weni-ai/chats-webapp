import Discussion from '@/services/api/resources/chats/discussion';

const mutations = {
  SET_DISCUSSIONS: 'SET_DISCUSSIONS',
  SET_ACTIVE_DISCUSSION: 'SET_ACTIVE_DISCUSSION',
};

export default {
  namespaced: true,
  state: {
    discussions: [],
    activeDiscussion: null,
  },

  mutations: {
    [mutations.SET_DISCUSSIONS](state, discussions) {
      state.discussions = discussions;
    },
    [mutations.SET_ACTIVE_DISCUSSION](state, room) {
      state.activeDiscussion = room;
    },
  },

  actions: {
    async getAll({ commit }) {
      const newDiscussions = await Discussion.listAll();
      commit(mutations.SET_DISCUSSIONS, newDiscussions?.results);
    },

    async create({ commit }, { queue, subject, initial_message }) {
      const newDiscussion = await Discussion.create({
        queue,
        subject,
        initial_message,
      });

      commit(mutations.SET_ACTIVE_DISCUSSION, newDiscussion);
      return newDiscussion;
    },
    async addAgent({ state }, { user_email }) {
      await Discussion.addAgent({
        discussionUuid: state.activeDiscussion.uuid,
        user_email,
      });
    },
    setActiveDiscussion({ commit }, discussion) {
      commit(mutations.SET_ACTIVE_DISCUSSION, discussion);
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
