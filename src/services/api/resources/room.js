const rooms = [
  {
    uuid: '84226d40-b580-4684-a2fa-74ac1932ff07',
    ended_at: null,
    is_active: true,
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
    user: {
      id: '3cbb3f58-a241-4e4d-8fe7-2d785a0775d4',
      full_name: 'Matheus Pedroni',
      status: 'online',
      last_interaction: '2019-08-24T14:15:22Z',
    },
    queue: {
      uuid: '8b68a13d-8f69-47b8-bce9-5cdc2e507c97',
      name: 'Financeiro',
    },
  },
  {
    uuid: '9b611a24-a1d6-4be6-892f-64ab3f1ddbae',
    ended_at: null,
    is_active: true,
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
    user: {
      id: '3cbb3f58-a241-4e4d-8fe7-2d785a0775d4',
      full_name: 'Matheus Pedroni',
      status: 'online',
      last_interaction: '2019-08-24T14:15:22Z',
    },
    queue: {
      uuid: '8b68a13d-8f69-47b8-bce9-5cdc2e507c97',
      name: 'Financeiro',
    },
  },
  {
    uuid: '8fb89ba2-72e3-4cbf-8e7c-be7f72422322',
    ended_at: null,
    is_active: true,
    contact: {
      id: 'c8b8af83-057e-4da6-987b-f488690586a1',
      full_name: 'Rafael Felipe',
      email: 'rafael.felipe@gmail.com',
      status: 'online',
      last_interaction: '2019-08-24T14:15:22Z',
      custom_fields: {
        telegram: '+5547987774756',
      },
    },
    user: {
      id: '3cbb3f58-a241-4e4d-8fe7-2d785a0775d4',
      full_name: 'Matheus Pedroni',
      status: 'online',
      last_interaction: '2019-08-24T14:15:22Z',
    },
    queue: {
      uuid: '8b68a13d-8f69-47b8-bce9-5cdc2e507c97',
      name: 'Financeiro',
    },
  },
  {
    uuid: 'ba0ce975-ba60-47bc-a884-ac1e1e9ecdd9',
    ended_at: null,
    is_active: true,
    contact: {
      id: 'ba812151-93ec-49ba-a748-3cdfaba53218',
      full_name: 'Milton Neves',
      email: 'milton.neves@gmail.com',
      status: 'online',
      last_interaction: '2019-08-24T14:15:22Z',
      custom_fields: {
        instagram: 'neves.milton23',
      },
    },
    user: {
      id: '3cbb3f58-a241-4e4d-8fe7-2d785a0775d4',
      full_name: 'Matheus Pedroni',
      status: 'online',
      last_interaction: '2019-08-24T14:15:22Z',
    },
    queue: {
      uuid: '8b68a13d-8f69-47b8-bce9-5cdc2e507c97',
      name: 'Financeiro',
    },
  },
  {
    uuid: '796f5929-3384-459e-a64a-7c4595692a79',
    ended_at: null,
    is_active: true,
    contact: {
      id: 'beec87a1-cbdd-4ec6-9671-81ecfbe798f7',
      full_name: 'João Cláudio',
      email: 'joao.claudio@gmail.com',
      status: 'online',
      last_interaction: '2019-08-24T14:15:22Z',
      custom_fields: {
        instagram: 'joao.claudio',
      },
    },
    user: null,
    queue: {
      uuid: '8b68a13d-8f69-47b8-bce9-5cdc2e507c97',
      name: 'Financeiro',
    },
  },
  {
    uuid: '5eed076d-e096-4077-a624-9340de6250a3',
    ended_at: null,
    is_active: true,
    contact: {
      id: '96a4538a-efb0-478d-9615-3bb6ff40e600',
      full_name: 'Marcela Barros',
      email: 'marcela.barros@gmail.com',
      status: 'online',
      last_interaction: '2019-08-24T14:15:22Z',
      custom_fields: {
        instagram: 'marcela.barros',
      },
    },
    user: null,
    queue: {
      uuid: '8b68a13d-8f69-47b8-bce9-5cdc2e507c97',
      name: 'Financeiro',
    },
  },
  {
    uuid: '4fb1924c-30d4-44a7-bb48-ff71f17a3731',
    ended_at: null,
    is_active: true,
    contact: {
      id: '9b29ef69-0705-4b07-a74d-d2670ce49607',
      full_name: 'Roberto Barcelos',
      email: 'roberto.barcelos@gmail.com',
      status: 'online',
      last_interaction: '2019-08-24T14:15:22Z',
      custom_fields: {
        instagram: 'marcela.barros',
      },
    },
    user: null,
    queue: {
      uuid: '8b68a13d-8f69-47b8-bce9-5cdc2e507c97',
      name: 'Financeiro',
    },
  },
];

export default {
  async getAll() {
    return new Promise((resolve) => {
      resolve({
        results: rooms,
      });
    });
  },
};
