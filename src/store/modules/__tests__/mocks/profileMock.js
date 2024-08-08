export const mockProfileHumanServiceState = {
  me: {
    email: 'testing@weni.ai',
    first_name: 'Testing',
    last_name: 'Weni',
    project_permission_role: 2,
    created_on: '2024-05-16T10:35:47.304382-03:00',
    modified_on: '2024-05-16T10:35:47.304407-03:00',
    sound_new_room: true,
    sound_chat_msg: true,
    sound_action: true,
    config: null,
    queues: [
      {
        uuid: '1',
        queue_name: 'FILA 1',
        created_on: '2024-08-01T11:37:10.385670-03:00',
        modified_on: '2024-08-05T19:13:20.400581-03:00',
        role: 1,
        queue: '1',
        permission: 'bf85fc6f-a51a-437b-bf1b-b9a043afbe7a',
      },
      {
        uuid: '2',
        queue_name: 'FILA 2',
        created_on: '2024-08-02T07:19:30.593781-03:00',
        modified_on: '2024-08-05T19:13:20.428562-03:00',
        role: 1,
        queue: '2',
        permission: 'bf85fc6f-a51a-437b-bf1b-b9a043afbe7a',
      },
    ],
  },
};

export const mockProfileAdminState = {
  me: {
    email: 'testing-adm@weni.ai',
    first_name: 'TestingAdm',
    last_name: 'Weni',
    project_permission_role: 1,
    created_on: '2024-05-16T10:35:47.304382-03:00',
    modified_on: '2024-05-16T10:35:47.304407-03:00',
    sound_new_room: true,
    sound_chat_msg: true,
    sound_action: true,
    config: null,
    queues: [
      {
        uuid: '3',
        queue_name: 'FILA 3',
        created_on: '2024-08-01T11:37:10.385670-03:00',
        modified_on: '2024-08-05T19:13:20.400581-03:00',
        role: 1,
        queue: '3',
        permission: 'bf85fc6f-a51a-437b-bf1b-b9a043afbe7a',
      },
    ],
  },
};
