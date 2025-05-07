import { defineStore } from 'pinia';

import {
  setToken as setSessionToken,
  setProject as setSessionProjectUuid,
  setStatus as setSessionStatus,
} from '@/utils/config';

import Profile from '@/services/api/resources/profile';
import { useProfile } from './profile';

export const useConfig = defineStore('config', {
  state: () => ({
    token: '',
    project: {
      config: {},
    },
    status: '',
    copilot: {
      active: false,
      customRulesActive: false,
      customRules: '',
    },
  }),
  actions: {
    async setToken(token) {
      setSessionToken(token);
      this.token = token;
    },
    async setProjectUuid(projectUuid) {
      setSessionProjectUuid(projectUuid);
      this.project.uuid = projectUuid;
    },
    async setProject(project) {
      this.project = project;
    },
    setStatus(status) {
      this.status = status;
    },
    async getStatus(projectUuid) {
      const { data } = await Profile.status(projectUuid);
      return data.connection_status;
    },
    async updateStatus(status) {
      const validStatus = ['online', 'offline'];

      if (typeof status !== 'string') {
        throw new Error(typeof status, status);
      }
      if (!validStatus.includes(status.toLowerCase())) {
        throw new Error(
          `Invalid status. Try any for these: ${validStatus.join(', ')}`,
        );
      }

      const { data } = await Profile.updateStatus({
        projectUuid: this.project.uuid,
        status: status.toUpperCase(),
      });
      const newStatus = data.connection_status || 'OFFLINE';
      this.status = newStatus;
      setSessionStatus(newStatus);
    },
    setCopilotActive(active) {
      this.copilot.active = active;
    },
    setCopilotCustomRulesActive(active) {
      this.copilot.customRulesActive = active;
    },
    setCopilotCustomRules(customRules) {
      this.copilot.customRules = customRules;
    },
  },
  getters: {
    enableAutomaticRoomRouting: ({ project }) => {
      const { isHumanServiceProfile } = useProfile();

      const isAutomaticRoutingQueueProject =
        project.room_routing_type === 'QUEUE_PRIORITY';

      return isHumanServiceProfile && isAutomaticRoutingQueueProject;
    },
    enableGroupsMode: ({ project }) => {
      return 'its_principal' in (project?.config || {});
    },
    isPrimaryProject: ({ project }) => {
      return !!project.config?.its_principal;
    },
    isSecondaryProject: ({ project }) => {
      return !!project.config?.its_principal === false;
    },
  },
});
