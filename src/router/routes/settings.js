const routes = [
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/layouts/SettingsLayout'),
    children: [
      {
        path: 'chats',
        name: 'settings.chats',
        component: () => import('@/views/Settings'),
      },

      {
        path: 'chats/sectors',
        name: 'settings.chats.sectors',
        component: { render: (h) => h('router-view') },
        children: [
          {
            path: 'new',
            name: 'settings.chats.sectors.new',
            component: () => import('@/views/Settings/Sectors/New'),
            meta: {
              breadcrumb: [{ name: 'Chats', path: '/settings/chats' }, { name: 'Novo setor' }],
            },
          },
        ],
      },

      {
        path: '*',
        component: { render: (h) => h('router-view') },
      },
    ],
  },
];

export default routes;
