import http from '@/services/api/http';

export default {
  async all(offset, limit) {
    const response = await http.get('/quick_messages/', {
      params: {
        offset,
        limit,
      },
    });
    return response.data;
  },

  async create({ title, text, shortcut = null }) {
    const response = await http.post('/quick_messages/', {
      title,
      text,
      shortcut,
    });

    return response.data;
  },

  async update(uuid, { title, text, shortcut = null }) {
    const response = await http.patch(`/quick_messages/${uuid}/`, {
      title,
      text,
      shortcut,
    });

    return response.data;
  },

  async delete(uuid) {
    const response = await http.delete(`/quick_messages/${uuid}/`);
    return response.data;
  },
};
