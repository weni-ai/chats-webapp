// TODO: Replace mocks with real API calls when backend endpoints are available

export default {
  async check() {
    return { agent_builder: true };
  },

  async getAiTransferConfig() {
    return { enabled: false, criteria: '' };
  },

  async updateAiTransferConfig({ enabled, criteria }) {
    return { enabled, criteria };
  },
};
