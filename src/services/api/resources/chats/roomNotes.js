import http from '@/services/api/http';

import { asyncTimeout } from '@/utils/time';

export default {
  async getInternalNotes({ room }) {
    // const response = await http.get('/room_notes/', {
    //   params: { room, limit: 9999 },
    // });

    const response = {
      data: {
        results: [
          {
            uuid: '1',
            text: 'Nota 1',
            user: {
              email: 'eduardo.medeiros@weni.ai',
              first_name: 'Eduardo',
              last_name: 'Medeiros',
            },
          },
          {
            uuid: '2',
            text: 'Nota 2',
            is_deletable: true,
            user: {
              email: 'eduardo.medeiros@weni.ai',
              first_name: 'Eduardo',
              last_name: 'Medeiros',
            },
          },
        ],
      },
    };

    await asyncTimeout(1000);

    return response.data;
  },
};
