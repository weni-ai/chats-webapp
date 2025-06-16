import { defineStore } from 'pinia';

import Dasboard from '@/services/api/resources/dashboard/dashboardManager';

export const useDashboard = defineStore('dashboard', {
  state: () => ({
    viewedAgent: {
      email: '',
      name: '',
    },
    showModalAssumedChat: false,
    assumedChatContactName: '',
    isLoadingViewedAgent: false,
  }),
  actions: {
    setViewedAgent(viewedAgent) {
      this.viewedAgent = viewedAgent;
    },
    setShowModalAssumedChat(isAssumedChat) {
      this.showModalAssumedChat = isAssumedChat;
    },
    setAssumedChatContactName(contactName) {
      this.assumedChatContactName = contactName;
    },

    async getViewedAgentData(agentEmail) {
      try {
        this.isLoadingViewedAgent = true;

        const { first_name, last_name } =
          await Dasboard.getViewedAgentData(agentEmail);

        const newViewedAgent = {
          name: `${first_name} ${last_name}`,
          email: agentEmail,
        };

        this.viewedAgent = newViewedAgent;

        return newViewedAgent;
      } catch (error) {
        console.error('Error getting viewed agent data', error);
      } finally {
        this.isLoadingViewedAgent = false;
      }
    },
  },
  getters: {
    getViewedAgent: ({ viewedAgent }) => viewedAgent,
    getShowModalAssumedChat: ({ showModalAssumedChat }) => showModalAssumedChat,
    getAssumedChatContactName: ({ assumedChatContactName }) =>
      assumedChatContactName,
  },
});
