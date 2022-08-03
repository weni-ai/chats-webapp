/* eslint-disable no-plusplus */
let messageId = 1;
const messages = [
  {
    uuid: (messageId++).toString(),
    created_on: new Date().toISOString(),
    modified_on: new Date().toISOString(),
    text: 'Boa tarde! Preciso da segunda via do meu boleto',
    seen: true,
    room: '84226d40-b580-4684-a2fa-74ac1932ff07',
    contact: {
      id: 'ea861258-8a13-4849-87b9-05524bb05eba',
      full_name: 'Pedro Pontes',
      email: 'pedro.pontes@gmail.com',
      status: 'online',
      last_interaction: '2019-08-24T14:15:22Z',
      custom_fields: {
        instagram: 'pedro.pontes',
      },
    },
    user: null,
    media: null,
  },
  {
    uuid: (messageId++).toString(),
    created_on: new Date().toISOString(),
    modified_on: new Date().toISOString(),
    text: 'Claro! Aguarde um segundo que já te envio',
    seen: false,
    room: '84226d40-b580-4684-a2fa-74ac1932ff07',
    contact: null,
    user: {
      id: '3cbb3f58-a241-4e4d-8fe7-2d785a0775d4',
      full_name: 'Matheus Pedroni',
      status: 'online',
      last_interaction: new Date().toISOString(),
    },
    media: null,
  },
  {
    uuid: (messageId++).toString(),
    created_on: new Date().toISOString(),
    modified_on: new Date().toISOString(),
    text: 'Olá!',
    seen: true,
    room: '9b611a24-a1d6-4be6-892f-64ab3f1ddbae',
    contact: {
      id: '07310fe8-bac0-46fa-a374-bc07848c76bd',
      full_name: 'Ilanna Lins',
      email: 'ilanna.lins@gmail.com',
      status: 'online',
      last_interaction: '2019-08-24T14:15:22Z',
      custom_fields: {
        whatsapp: '+5547987774756',
      },
    },
    user: null,
    media: null,
  },
  {
    uuid: (messageId++).toString(),
    created_on: new Date(new Date().getTime() + 10 * 1000).toISOString(),
    modified_on: new Date().toISOString(),
    text: 'Gostaria de saber como faço para acessar o aplicativo da empresa',
    seen: true,
    room: '9b611a24-a1d6-4be6-892f-64ab3f1ddbae',
    contact: {
      id: '07310fe8-bac0-46fa-a374-bc07848c76bd',
      full_name: 'Ilanna Lins',
      email: 'ilanna.lins@gmail.com',
      status: 'online',
      last_interaction: '2019-08-24T14:15:22Z',
      custom_fields: {
        whatsapp: '+5547987774756',
      },
    },
    user: null,
    media: null,
  },
  {
    uuid: (messageId++).toString(),
    created_on: new Date().toISOString(),
    modified_on: new Date().toISOString(),
    text: 'Certo! Vou te transferir para a fila de ajuda para que eles possam te ajudar com isso. Só um momento',
    seen: false,
    room: '9b611a24-a1d6-4be6-892f-64ab3f1ddbae',
    contact: null,
    user: {
      id: '91015653-7d9e-4474-9e1c-fd4f987fa7f8',
      full_name: 'Ana Cristina',
      status: 'online',
      last_interaction: '2019-08-24T14:15:22Z',
    },
    media: null,
  },
  {
    room: '9b611a24-a1d6-4be6-892f-64ab3f1ddbae',
    type: 'queue',
    name: 'Ajuda',
    uuid: (messageId++).toString(),
    created_at: new Date().toISOString(),
  },
];

export default {
  async getByRoomId(roomId) {
    return new Promise((resolve) => {
      const roomMessages = messages.filter((message) => message.room === roomId);
      resolve({
        results: roomMessages,
      });
    });
  },
};
