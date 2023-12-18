const mutations = {
  SET_TOKEN: 'SET_TOKEN',
  SET_PROJECT: 'SET_PROJECT',
  SET_COPILOT_ACTIVE: 'SET_COPILOT_ACTIVE',
  SET_COPILOT_CUSTOM_RULES_ACTIVE: 'SET_COPILOT_CUSTOM_RULES_ACTIVE',
  SET_COPILOT_CUSTOM_RULES: 'SET_COPILOT_CUSTOM_RULES',
};

export default {
  namespaced: true,
  state: {
    token: '',
    project: '',
    status: '',
    copilot: {
      active: false,
      customRulesActive: false,
      customRules: '',
    },
  },
  mutations: {
    [mutations.SET_TOKEN](state, token) {
      state.token = token;
    },
    [mutations.SET_PROJECT](state, project) {
      state.project = project;
    },
    [mutations.SET_COPILOT_ACTIVE](state, active) {
      state.copilot.active = active;
    },
    [mutations.SET_COPILOT_CUSTOM_RULES_ACTIVE](state, active) {
      state.copilot.customRulesActive = active;
    },
    [mutations.SET_COPILOT_CUSTOM_RULES](state, customRules) {
      state.copilot.customRules = customRules;
    },
  },
  actions: {
    setToken({ commit }, token) {
      commit(mutations.SET_TOKEN, token);
    },
    setProject({ commit }, project) {
      commit(mutations.SET_PROJECT, project);
    },
    setCopilotActive({ commit }, active) {
      commit(mutations.SET_COPILOT_ACTIVE, active);
    },
    setCopilotCustomRulesActive({ commit }, active) {
      commit(mutations.SET_COPILOT_CUSTOM_RULES_ACTIVE, active);
    },
    setCopilotCustomRules({ commit }, customRules) {
      commit(mutations.SET_COPILOT_CUSTOM_RULES, customRules);
    },
  },
};
