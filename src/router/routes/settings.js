const routes = [
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/layouts/SettingsLayout'),
    children: [
      {
        path: 'chats',
        name: 'chats',
        component: () => import('@/views/Settings'),
      },

      {
        path: 'chats/sectors',
        component: { render: (h) => h('router-view') },
        children: [
          {
            path: '/:id',
            name: 'sectors.view',
            component: () => import('@/views/Settings/Sectors/View'),
            props: (route) => ({
              id: route.params.id,
            }),
            meta: {
              breadcrumb: [
                { name: 'Chats', path: '/settings/chats' },
                { getter: 'settings/getActiveSector', solver: (sector) => sector?.name },
              ],
            },
          },
          {
            path: 'new',
            name: 'sectors.new',
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
