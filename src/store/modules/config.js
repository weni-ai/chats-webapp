import Profile from '@/services/api/resources/profile';
import {
  setToken as setLocalToken,
  setProject as setLocalProject,
  setStatus as setLocalStatus,
} from '@/utils/config';

const mutations = {
  SET_TOKEN: 'SET_TOKEN',
  SET_PROJECT: 'SET_PROJECT',
  SET_STATUS: 'SET_STATUS',
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
    [mutations.SET_STATUS](state, status) {
      state.status = status;
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
    async setToken({ commit }, token) {
      setLocalToken(token);
      commit(mutations.SET_TOKEN, token);
    },
    async setProject({ commit }, project) {
      setLocalProject(project);
      commit(mutations.SET_PROJECT, project);
    },
    setStatus({ commit }, status) {
      commit(mutations.SET_STATUS, status);
    },
    getStatus({ state }) {
      const response = Profile.status({ projectUuid: state.project });
      return response?.data?.connection_status;
    },
    updateStatus({ state, dispatch }, status) {
      const validStatus = ['online', 'offline'];

      if (typeof status !== 'string') {
        throw new Error(typeof status, status);
      }
      if (!validStatus.includes(status.toLowerCase())) {
        throw new Error(`Invalid status. Try any for these: ${validStatus.join(', ')}`);
      }

      const response = Profile.updateStatus({
        projectUuid: state.project,
        status: status.toUpperCase(),
      });
      const newStatus = response?.data?.connection_status || 'OFFLINE';
      dispatch('setStatus', newStatus);
      setLocalStatus(newStatus);
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
