import Discussion from '@/services/api/resources/chats/discussion';

const mutations = {
  SET_ACTIVE_DISCUSSION: 'SET_ACTIVE_DISCUSSION',
};

export default {
  namespaced: true,
  state: {
    activeDiscussion: null,
  },

  mutations: {
    [mutations.SET_ACTIVE_DISCUSSION](state, room) {
      state.activeDiscussion = room;
    },
  },

  actions: {
    async create({ commit }, { queue, subject, initial_message }) {
      const newDiscussion = await Discussion.create({
        queue,
        subject,
        initial_message,
      });

      commit(mutations.SET_ACTIVE_DISCUSSION, newDiscussion);
      return newDiscussion;
    },
  },
};
