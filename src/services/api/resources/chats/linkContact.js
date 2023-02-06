import http from '@/services/api/http';
import { getProject } from '@/utils/config';

const uuid = getProject();

export default {
  async getLinketContact(contact) {
    const response = await http.get(`/project/${uuid}/retrieve_linked_contact/`, {
      params: contact,
    });
    return response.data;
  },

  async linkContactToAgent(contact) {
    const response = await http.post(`/project/${uuid}/create_linked_contact/`, contact);
    return response.data;
  },

  async removeContactFromAgent(contact) {
    const response = await http.delete(`/project/${uuid}/delete_linked_contact`, {
      params: { contact },
    });
    return response.data;
  },
};
